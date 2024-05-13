import { vec2, vec3, vec4 } from "gl-matrix"

import RenderSystem from "./render_system"
import PhysicSystem from "./physics_system"
import ScreenSystem from "./screen_system"
import MultiplayerSystem from "./multiplayer_system"

import { registry } from "./ecs_registry"
import { BoundingBox } from "./common"
import { GAME_SCREEN } from "./components"
import { BaseScreen } from "../screens/base_screen"
import { Entity } from "./ecs"
import { setTextContent } from "../helper_scripts/component_helpers"
import { createBall, createDelayedCallback, createRectangle, createScreenBoundary, createText } from "./world_init"
import CollisionMessage from "../messages/collision_message"

class WorldSystem {
    private renderer: RenderSystem
    private screenSystem: ScreenSystem
    private multiplayerSystem: MultiplayerSystem
    private ball: number
    private player: number
    private opponent: number
    private timerTextEntity: number
    public isMultiplayer = false
    
    public currentScreen: GAME_SCREEN = GAME_SCREEN.MAIN_MENU
    public isPaused: boolean = false
    public playerScore: number = 0
    public opponentScore: number = 0

    public constructor(renderer: RenderSystem) {
        this.renderer = renderer
        this.screenSystem = new ScreenSystem()
        this.multiplayerSystem = new MultiplayerSystem("ws://127.0.0.1:8001")

        this.init()
    }

    public init() {
        this.reinitializeWorld()

        // Attach the user input listeners and attach the callbacks
        window.addEventListener("keydown", (e) => { this.onKeyDown(e) })
        window.addEventListener("keyup", (e) => { this.onKeyUp(e) })
        window.addEventListener("mousemove", (e) => { this.onMouseMove(e) })
        window.addEventListener("mousedown", (e) => { this.onMouseDown(e) })
    }

    public step(elapsedTimeMs: number) {
        // Decrement the time on the delayed callbacks and call them if time runs out
        for (let i = 0; i < registry.delayedCallbacks.length(); i++) {
            const delayedCallback = registry.delayedCallbacks.components[i]
            if (!this.isPaused) {
                delayedCallback.timeMs -= elapsedTimeMs
            }
            
            if (delayedCallback.timeMs <= 0) {
                delayedCallback.callback()
                registry.removeAllComponentsOf(registry.delayedCallbacks.entities[i])
            }
        }
        
    }

    public resetScore() {
        this.opponentScore = 0
        this.playerScore = 0
    }
    
    public play(isMultiplayer: boolean) {
        this.currentScreen = GAME_SCREEN.GAME_SCREEN
        this.isMultiplayer = isMultiplayer
        this.reinitializeWorld()
        this.resetScore()
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
        const scoreboardTextE = createText(
            this.renderer, vec2.fromValues(this.renderer.gl.canvas.width / 2, 0),
            `${this.playerScore} - ${this.opponentScore}`, vec4.fromValues(0.65, 0.65, 0.65, 1), 1
        )

        const scoreboardTextM = registry.motions.get(scoreboardTextE)
        scoreboardTextM.position[1] += scoreboardTextM.scale[1] / 2

        // In singleplayer, this function should be called immediately
        // In multiplayer, this function should be called only after two players are in a room
        if (!this.isMultiplayer) {
            this.commenceGameCountdown()
        } else {
            this.multiplayerSystem.init()
        }
    }

    private commenceGameCountdown() {
        this.timerTextEntity = createText(
            this.renderer, vec2.fromValues(this.renderer.gl.canvas.width / 2, this.renderer.gl.canvas.height / 2), 
            "3", vec4.fromValues(1, 1, 1, 1), 1.1)
        const timerText = registry.texts.get(this.timerTextEntity)

        // Timer count: 2
        createDelayedCallback(() => {
            timerText.content = "2"
        }, 1000)
        
        // Timer count: 1
        createDelayedCallback(() => {
            timerText.content = "1"
        }, 2000)

        // Timer count: 0
        createDelayedCallback(() => {
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

            setTextContent(this.renderer, this.timerTextEntity, "Start")

            createDelayedCallback(() => {
                registry.removeAllComponentsOf(this.timerTextEntity)
            }, 1000)
        }, 3000)
    }

    public handleCollision(elapsedTimeMs: number) {
        // Handle in-game collisions
        for (const collision of registry.collisions.components) {
            // Ball collides with other objects
            if (collision.entity === this.ball) {

                // Ball collides with the horizontal screen borders
                if (registry.endGameWalls.has(collision.entityOther)) {
                    const endGameWall = registry.endGameWalls.get(collision.entityOther)

                    // If player is in multiplayer, send the collision event to the server
                    if (this.isMultiplayer) {
                        const ball_motion = registry.motions.get(this.ball)
                        const wall_motion = registry.motions.get(collision.entityOther)

                        this.multiplayerSystem.sendMessage(new CollisionMessage(
                            ball_motion.position,
                            ball_motion.positionalVel,
                            wall_motion.position,
                            wall_motion.scale,
                            endGameWall.isLeft ? 0 : 1
                        ))

                        break
                    }

                    if (endGameWall.isLeft) {
                        this.opponentScore += 1
                    } else {
                        this.playerScore += 1
                    }


                    this.reinitializeWorld()
                    break
                }

                // Ball collides with a wall
                if (registry.walls.has(collision.entityOther)) {
                    if (this.isMultiplayer) {
                        const ball_motion = registry.motions.get(this.ball)
                        const wall_motion = registry.motions.get(collision.entityOther)

                        this.multiplayerSystem.sendMessage(new CollisionMessage(
                            ball_motion.position,
                            ball_motion.positionalVel,
                            wall_motion.position,
                            wall_motion.scale,
                            1000
                        ))
                        
                        break
                    }

                    let ballMotion = registry.motions.get(this.ball)
                    let otherMotion = registry.motions.get(collision.entityOther)

                    PhysicSystem.reflectObject(ballMotion, otherMotion)
                }
            }

            // Paddle collision
            if (collision.entity === this.player) {
                if (registry.walls.has(collision.entityOther)) {
                    const p_motion = registry.motions.get(this.player)
                    const w_motion = registry.motions.get(collision.entityOther)

                    const w_bb = BoundingBox.getBoundingBox(w_motion.position, w_motion.scale)

                    if (p_motion.positionalVel[1] > 0) {
                        p_motion.position[1] = w_bb.top - p_motion.scale[1] / 2
                    } else if (p_motion.positionalVel[1] < 0) {
                        p_motion.position[1] = w_bb.bottom + p_motion.scale[1] / 2
                    }
                }
            }
        }

        // Clear all collision components
        registry.collisions.clear()
    }

    private onKeyUp(e: KeyboardEvent) {
        if (this.isPaused) return
        if (!registry.motions.has(this.player)) return


        const p_motion = registry.motions.get(this.player)
        if (p_motion.positionalVel[1] != 0) {
            p_motion.positionalVel[1] = 0
        }
    }

    private onKeyDown(e: KeyboardEvent) {
        if (this.currentScreen !== GAME_SCREEN.GAME_SCREEN) {
            this.screenSystem.handleKeyDown(e)
            return
        }
        
        const p_motion = registry.motions.get(this.player)

        switch (e.key) {
            case "Escape":
                e.preventDefault()

                this.isPaused = !this.isPaused
                registry.screenStates.components[0].darkenScreenFactor = 0.9
                this.currentScreen = GAME_SCREEN.PAUSE_MENU
                this.reinitializeWorld()
                break
            case "w":
                if (!this.isPaused) p_motion.positionalVel[1] = -5
                break
            case "s":
                if (!this.isPaused) p_motion.positionalVel[1] = 5
                break
            default:
                break
        }
    }
    
    private onMouseMove(e: MouseEvent) {
        // User is in a menu
        if (this.currentScreen !== GAME_SCREEN.GAME_SCREEN) {
            this.screenSystem.checkMouseOverUI(e)
            return
        }
    }

    private onMouseDown(e: MouseEvent) {
        if (this.currentScreen !== GAME_SCREEN.GAME_SCREEN) {
            this.screenSystem.checkMouseDown(e)
        }
    }
}


export default WorldSystem