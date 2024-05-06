import RenderSystem from "./render_system"
import PhysicSystem from "./physics_system"
import { registry } from "./ecs_registry"
import { createBall, createEllipse, createRectangle, createScreenBoundary, createText } from "./world_init"
import { vec2, vec3, vec4 } from "gl-matrix"
import { clamp } from "./common"
import { GAME_SCREEN } from "./components"
import ScreenSystem from "./screen_system"
import { BaseScreen } from "../screens/base_screen"
import { Entity } from "./ecs"

class WorldSystem {
    private renderer: RenderSystem
    private screenSystem: ScreenSystem
    private ball: number
    private player: number
    private opponent: number
    
    public currentScreen: GAME_SCREEN = GAME_SCREEN.MAIN_MENU
    public isPaused: boolean = false
    public score: number = 0

    public constructor(renderer: RenderSystem) {
        this.renderer = renderer
        this.screenSystem = new ScreenSystem()

        this.init()
    }

    public init() {
        this.reinitializeWorld()

        // Attach the user input listeners and attach the callbacks
        window.addEventListener("keydown", (e) => { this.onKeyDown(e) })
        window.addEventListener("mousemove", (e) => { this.onMouseMove(e) })
        window.addEventListener("mousedown", (e) => { this.onMouseDown(e) })
    }

    public step(elapsedTimeMs: number) {
        
    }

    public reinitializeWorld() {
        let screen: BaseScreen

        switch (this.currentScreen) {
            case GAME_SCREEN.GAME_SCREEN:
                registry.clearAllComponents()
                this.restartGame()
                break
            case GAME_SCREEN.PAUSE_MENU:
                screen = this.screenSystem.gameScreenToRender.get(this.currentScreen)
                screen.init(this, this.renderer)
                break
            default:
                registry.clearAllComponents()
                screen = this.screenSystem.gameScreenToRender.get(this.currentScreen)
                screen.init(this, this.renderer)
                break
        }

        if (registry.screenStates.length() < 1) {
            registry.screenStates.emplace(Entity.generate()).darkenScreenFactor = 0
        }
    }

    private restartGame() {
        this.isPaused = false

        // Create the screen boundaries
        createScreenBoundary(this.renderer)

        // Create the decoration
        const numMidLines = 8
        const midLineGap = 10
        const midLineHeight = (this.renderer.gl.canvas.height - midLineGap * (numMidLines - 1) - 95) / numMidLines
        for (let i = 0; i < numMidLines; i++) {
            let line = createRectangle(
                vec2.fromValues(this.renderer.gl.canvas.width / 2, 95 + midLineHeight / 2 + i * (midLineGap + midLineHeight)),
                vec2.fromValues(10, midLineHeight),
                vec4.fromValues(0.2, 0.2, 0.2, 1)
            )
            registry.nonCollidables.emplace(line)
        }
        
        // Create the ball
        const ballXMin = 3 * this.renderer.gl.canvas.width / 8
        const ballXMax = 5 * this.renderer.gl.canvas.width / 8
        const ballYMin = 100
        const ballYMax = this.renderer.gl.canvas.height - 100

        const ballX = ballXMin + (Math.random() * (ballXMax - ballXMin))
        const ballY = ballYMin + (Math.random() * (ballYMax - ballYMin))
        const ballVelX = 7.5 * (-1 + 2 * Math.round(Math.random()))
        const ballVelY = 7.5 * (-1 + 2 * Math.round(Math.random()))

        this.ball = createBall(
            // vec2.fromValues(this.renderer.gl.canvas.width / 2, this.renderer.gl.canvas.height / 2),
            vec2.fromValues(ballX, ballY),
            vec2.fromValues(50, 50),
            vec4.fromValues(1, 1, 1, 1)
        )
        
        const ballMotion = registry.motions.get(this.ball)
        ballMotion.positionalVel = vec2.fromValues(ballVelX, ballVelY)
        
        // Create the player
        this.player = createRectangle(
            vec2.fromValues(75, this.renderer.gl.canvas.height / 2),
            vec2.fromValues(25, 150),
            vec4.fromValues(1, 1, 1, 1)
        )
        registry.players.emplace(this.player)
        registry.walls.emplace(this.player)

        // Create the opponent
        this.opponent = createRectangle(
            vec2.fromValues(this.renderer.gl.canvas.width - 75, this.renderer.gl.canvas.height / 2),
            vec2.fromValues(25, 150),
            vec4.fromValues(1, 1, 1, 1)
        )
        registry.walls.emplace(this.opponent)

        // Create the score board
        const textE = createText(
            this.renderer, vec2.fromValues(this.renderer.gl.canvas.width / 2, 0),
            "1 - 1", vec4.fromValues(0.65, 0.65, 0.65, 1), 1
        )

        const textM = registry.motions.get(textE)
        textM.position[1] += textM.scale[1] / 2
    }

    public handleCollision(elapsedTimeMs: number) {
        // Handle in-game collisions
        for (const collision of registry.collisions.components) {
            // Ball collides with other objects
            if (collision.entity === this.ball) {
                if (registry.walls.has(collision.entityOther)) {
                    let ballMotion = registry.motions.get(this.ball)
                    let otherMotion = registry.motions.get(collision.entityOther)

                    PhysicSystem.reflectObject(ballMotion, otherMotion)
                }
            }
        }

        // Clear all collision components
        registry.collisions.clear()
    }

    public onKeyDown(e: KeyboardEvent) {
        if (this.currentScreen !== GAME_SCREEN.GAME_SCREEN) {
            this.screenSystem.handleKeyDown(e)
            return
        }
        
        switch (e.key) {
            case "Escape":
                this.isPaused = !this.isPaused
                registry.screenStates.components[0].darkenScreenFactor = 0.9
                this.currentScreen = GAME_SCREEN.PAUSE_MENU
                this.reinitializeWorld()
                break
            default:
                break
        }
    }
    
    public onMouseMove(e: MouseEvent) {
        // User is in a menu
        if (this.currentScreen !== GAME_SCREEN.GAME_SCREEN) {
            this.screenSystem.checkMouseOverUI(e)
            return
        }

        // User is currently in-game and is not paused
        if (!this.isPaused) {
            let m = registry.motions.get(this.player)
            m.position[1] = clamp(
                e.y, m.scale[1] / 2, this.renderer.gl.canvas.height - m.scale[1] / 2
            )
        }
    }

    public onMouseDown(e: MouseEvent) {
        if (this.currentScreen !== GAME_SCREEN.GAME_SCREEN) {
            this.screenSystem.checkMouseDown(e)
        }
    }
}


export default WorldSystem