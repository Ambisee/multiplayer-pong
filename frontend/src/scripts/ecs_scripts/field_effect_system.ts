import { vec2, vec4 } from "gl-matrix"
import RenderSystem from "./render_system"
import { 
    ANIMATION_DIRECTION,
    ANIMATION_TIMING_FUNCTION,
    FIELD_EFFECTS,
    RENDER_LAYER,
    Vec4Animation 
} from "./components"
import { Entity } from "./ecs"
import { registry } from "./ecs_registry"
import { createDelayedCallback, createRectangle, createText } from "./world_init"
import { 
    GAME_WINDOW_HEIGHT, 
    GAME_WINDOW_WIDTH,
    INITIAL_BALL_VEL_MAG,
    LOW_FRICTION_MAX_PADDLE_VELOCITY,
    MAX_EFFECT_INTERVAL_TIME,
    MAX_EFFECT_TIME,
    MAX_PADDLE_VELOCITY,
    MIN_EFFECT_INTERVAL_TIME, 
    MIN_EFFECT_TIME,
    POWER_PADDLE_BALL_VEL_MAG
} from "../config"

class FieldEffectSystem {
    private renderer: RenderSystem
    private nextEffectTimerMs: number
    private effectTimerMs: number
    private inflictedPlayer: number
    private currentEffect: FIELD_EFFECTS
    private fieldToInit: Map<FIELD_EFFECTS, Function>

    public constructor(renderer: RenderSystem) {
        this.renderer = renderer
        this.inflictedPlayer = registry.players.entities[0]
        this.currentEffect = FIELD_EFFECTS.FIELD_EFFECTS_COUNT
        this.nextEffectTimerMs = Math.random()

        this.resetCountdown()

        this.fieldToInit = new Map([
            [FIELD_EFFECTS.SHOT_IN_THE_DARK, this.initShotInTheDark.bind(this)],
            [FIELD_EFFECTS.SHRINKING_PADDLE, this.initShrinkingPaddle.bind(this)],
            [FIELD_EFFECTS.LOW_FRICTION, this.initLowFriction.bind(this)],
            [FIELD_EFFECTS.POWER_PADDLE, this.initPowerPaddle.bind(this)],
        ])
        
        this.resetCountdown()
    }

    private shouldRun() {
        // Detect whether the game screen is being displayed
        if (registry.gameStates.length() < 1) {
            return false
        }
        
        // Detect whether currently the player
        // is "in-game" or not
        const gameState = registry.gameStates.components[0]
        return (
            !gameState.isPaused &&
            !gameState.isMultiplayer &&
            gameState.isGamePlaying &&
            registry.players.length() > 0 &&
            registry.opponents.length() > 0
        )
    }

    public step(elapsedTimeMs: number) {
        // Detect whether game is running and not in pause
        if (registry.gameStates.length() < 1) {
            this.resetCountdown()
        }

        if (!this.shouldRun()) {
            return
        }

        this.nextEffectTimerMs -= elapsedTimeMs
        this.effectTimerMs -= elapsedTimeMs

        if (this.effectTimerMs <= 0) {
            this.clearFieldEffect()
            this.effectTimerMs = Infinity
        }
        
        if (this.nextEffectTimerMs > 0) {
            return
        }

        // Randomly choose a new field effect and apply it
        this.currentEffect = this.selectFieldEffect()

        if (this.inflictedPlayer === registry.players.entities[0]) {
            this.inflictedPlayer = registry.opponents.entities[0]
        } else {
            this.inflictedPlayer = registry.players.entities[0]
        }
        
        // Create the effect
        this.createFieldEffect(this.currentEffect)

        // Reset the timer
        this.resetCountdown()
    }

    private resetCountdown() {
        const effectTimerRange = MAX_EFFECT_TIME - MIN_EFFECT_TIME
        this.effectTimerMs = MIN_EFFECT_TIME + (Math.random() * effectTimerRange % effectTimerRange)

        const nextEffectTimerRange = MAX_EFFECT_INTERVAL_TIME - MIN_EFFECT_INTERVAL_TIME
        this.nextEffectTimerMs = this.effectTimerMs + Math.random() * nextEffectTimerRange % nextEffectTimerRange
    }

    private clearFieldEffect() {
        for (const e of registry.fieldEffects.entities) {
            const comp = registry.fieldEffects.get(e)
            
            comp.cleanUpCallback()
            registry.fieldEffects.remove(e)
        }
    }

    private selectFieldEffect() {
        let result = Math.floor(Math.random() * FIELD_EFFECTS.FIELD_EFFECTS_COUNT)
        
        if (result !== this.currentEffect) {
            return result
        }

        result += 1
        result %= FIELD_EFFECTS.FIELD_EFFECTS_COUNT
        return result
    }

    private createFieldEffect(type: FIELD_EFFECTS) {
        const initializer = this.fieldToInit.get(type)
        
        if (initializer === undefined){
            return 
        }

        initializer()
    }

    private displayEffectAlert(text: string) {
        const textE = createText(
            this.renderer, vec2.fromValues(this.renderer.gl.canvas.width / 2, this.renderer.gl.canvas.height / 2),
            text, vec4.fromValues(0.75, 0.75, 0.75, 1), 0.75)
        createDelayedCallback(() => {
            registry.removeAllComponentsOf(textE)
        }, 1300)
    }

    private initLowFriction() {
        const fieldEffect = registry.fieldEffects.emplace(Entity.generate())
        fieldEffect.type = FIELD_EFFECTS.LOW_FRICTION
        
        this.displayEffectAlert("Low Friction")
        if (registry.players.length() < 1 || registry.opponents.length() < 1) {
            return
        }

        // Set the paddles' maximum velocities
        const pEntity = registry.players.entities[0]
        const opEntity = registry.opponents.entities[0]
        const pMotion = registry.motions.get(pEntity)
        const opMotion = registry.motions.get(opEntity)
        
        pMotion.maxVelMag = LOW_FRICTION_MAX_PADDLE_VELOCITY
        opMotion.maxVelMag = LOW_FRICTION_MAX_PADDLE_VELOCITY
        
        // Modify the ball's motion
        const ballEntity = registry.balls.entities[0]
        const ballM = registry.motions.get(ballEntity)
        
        vec2.copy(ballM.positionalAccel, ballM.positionalVel)
        ballM.maxVelMag = vec2.length(ballM.positionalVel)

        vec2.scale(ballM.positionalAccel, ballM.positionalAccel, 1000)
        vec2.set(ballM.positionalVel, 0, 0)


        const backgroundOverlay = createRectangle(
            vec2.fromValues(GAME_WINDOW_WIDTH / 2, GAME_WINDOW_HEIGHT / 2),
            vec2.fromValues(GAME_WINDOW_WIDTH, GAME_WINDOW_HEIGHT),
            vec4.fromValues(0, 0, 0.75, 0)
        )
        
        const bgRR = registry.renderRequests.get(backgroundOverlay)
        bgRR.renderLayer = RENDER_LAYER.L0

        const bgAnimation = new Vec4Animation(
            (value) => vec4.copy(bgRR.color, value),
            vec4.fromValues(0, 0, 0.75, 0),
            vec4.fromValues(0, 0, 0.75, 0.1),
            750,
            1,
            ANIMATION_TIMING_FUNCTION.EASE,
            ANIMATION_DIRECTION.FORWARD
        )
        
        registry.animations.insert(backgroundOverlay, bgAnimation)

        fieldEffect.cleanUpCallback = () => {
            pMotion.maxVelMag = MAX_PADDLE_VELOCITY
            opMotion.maxVelMag = MAX_PADDLE_VELOCITY
            
            pMotion.positionalAccel = vec2.fromValues(0, 0)
            opMotion.positionalAccel = vec2.fromValues(0, 0)

            vec2.set(ballM.positionalAccel, 0, 0)
            ballM.maxVelMag = Infinity

            registry.removeAllComponentsOf(backgroundOverlay)
        }
    }

    private initShrinkingPaddle() {
        const fieldEffect = registry.fieldEffects.emplace(this.inflictedPlayer)
        fieldEffect.type = FIELD_EFFECTS.SHRINKING_PADDLE
        
        const inflictedM = registry.motions.get(this.inflictedPlayer)
        const inflictedRR = registry.renderRequests.get(this.inflictedPlayer)
        const shrinkFactor = 0.5
        
        inflictedM.scale[1] *= shrinkFactor
        inflictedRR.color = vec4.fromValues(0.96, 1, 0.188, 1)

        fieldEffect.cleanUpCallback = () => {
            inflictedM.scale[1] /= shrinkFactor
            inflictedRR.color = vec4.fromValues(1, 1, 1, 1)
        }

        this.displayEffectAlert("Shrinking Paddle")
    }

    private initShotInTheDark() {
        // Create the field effect component
        const fieldEffect = registry.fieldEffects.emplace(Entity.generate())

        fieldEffect.type = FIELD_EFFECTS.SHOT_IN_THE_DARK

        // Set up the darken layer entity
        const pos = vec2.fromValues(this.renderer.gl.canvas.width / 2, this.renderer.gl.canvas.height / 2)
        const scale = vec2.fromValues(this.renderer.gl.canvas.width, this.renderer.gl.canvas.height)
        
        // Create the filter layer entity that darkens the background
        const darkenLayer = createRectangle(pos, scale, vec4.fromValues(0, 0, 0, 0.75))
        registry.renderRequests.get(darkenLayer).renderLayer = RENDER_LAYER.L2
        
        registry.animations.insert(darkenLayer,
            new Vec4Animation(
                (value) => vec4.copy(registry.renderRequests.get(darkenLayer).color, value),
                vec4.fromValues(0, 0, 0, 0.925),
                vec4.fromValues(0, 0, 0, 1),
                1750,
                Infinity,
                undefined,
                ANIMATION_DIRECTION.ALTERNATE
            )
        )
        
        fieldEffect.cleanUpCallback = () => {
            registry.removeAllComponentsOf(darkenLayer)
        }
    
        // Create the alert
        this.displayEffectAlert("Shot in the Dark")

        return fieldEffect
    }

    private initPowerPaddle() {
        const fieldEffect = registry.fieldEffects.emplace(this.inflictedPlayer)
        fieldEffect.type = FIELD_EFFECTS.POWER_PADDLE

        this.displayEffectAlert("Power Paddle")

        const ballE = registry.balls.entities[0]
        const ballM = registry.motions.get(ballE)
        const paddleRR = registry.renderRequests.get(this.inflictedPlayer)

        paddleRR.color = vec4.fromValues(1, 0, 0, 1)

        ballM.maxVelMag = POWER_PADDLE_BALL_VEL_MAG
        
        fieldEffect.cleanUpCallback = () => {
            if (registry.gameStates.length() < 1) {
                return
            }

            paddleRR.color = vec4.fromValues(1, 1, 1, 1)
            
            const gameState = registry.gameStates.components[0]
            ballM.maxVelMag = gameState.currentBallVelMag
        }
    }
}

export default FieldEffectSystem