import { vec2, vec3, vec4 } from "gl-matrix"

import RenderSystem from "./render_system"
import PhysicSystem from "./physics_system"
import ScreenSystem from "./screen_system"
import MultiplayerSystem, { HandlerCallback } from "./multiplayer_system"

import { registry } from "./ecs_registry"
import { BoundingBox } from "./common"
import { ALIGNMENT, GAME_SCREEN } from "./components"
import { BaseScreen } from "../screens/base_screen"
import { Entity } from "./ecs"
import { setTextContent, setTextAlignment } from "../helper_scripts/component_helpers"
import { createBall, createDelayedCallback, createRectangle, createScreenBoundary, createText } from "./world_init"
import CollisionMessage from "../messages/collision_message"
import { SERVER_EVENT } from "../messages/message_enum"
import { arrayToShort } from "../helper_scripts/messaging_helpers"
import MotionMessage from "../messages/motion_message"

class WorldSystem {
    private renderer: RenderSystem
    private screenSystem: ScreenSystem
    private multiplayerSystem: MultiplayerSystem
    
    private ball: number
    private player: number
    private opponent: number
    private timerTextEntity: number
    private nameDisplayEntities: number[]

    private isMultiplayer: boolean
    private isPlayer1: boolean
    
    public currentScreen: GAME_SCREEN = GAME_SCREEN.MAIN_MENU
    public isPaused: boolean = false
    public playerScore: number = 0
    public opponentScore: number = 0

    public constructor(renderer: RenderSystem) {
        this.renderer = renderer
        this.screenSystem = new ScreenSystem()
        this.multiplayerSystem = new MultiplayerSystem("ws://127.0.0.1:8001")
        this.nameDisplayEntities = [-1, -1]

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
        // Multiplayer mode features
        if (this.isMultiplayer) {

        }
        
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
        this.isPlayer1 = false
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

        // Create the name displays
        const displayNames = ["Player", "Waiting for opponent..."]
        if (!this.isMultiplayer) {displayNames[1] = "Opponent"}

        this.nameDisplayEntities = displayNames.map(value => {
            return createText(
                this.renderer, vec2.fromValues(0, 0.175 * this.renderer.DEFAULT_FONTSIZE), value, vec4.fromValues(1, 1, 1, 1), 0.35
            )
        })

        setTextAlignment(this.nameDisplayEntities[0], 0, ALIGNMENT.LEFT)
        setTextAlignment(this.nameDisplayEntities[1], this.renderer.gl.canvas.width, ALIGNMENT.RIGHT)

        // In singleplayer, this function should be called immediately
        // In multiplayer, this function should be called only after two players are in a room
        if (!this.isMultiplayer) {
            this.commenceGameCountdown()
        } else {
            this.bindMultiplayerSystem()
            this.multiplayerSystem.init()
        }
    }

    public bindMultiplayerSystem() {
        // Connected
        this.multiplayerSystem.setHandler(SERVER_EVENT.CONNECTED, (message) => {
            if (message[1] === 0) {
                console.log("P1")
                this.isPlayer1 = true
            } else {
                console.log("P2")
                this.isPlayer1 = false
            }
        })

        // Opponent disconnected
        this.multiplayerSystem.setHandler(SERVER_EVENT.OP_DISCONNECT, (message) => {
            this.isPlayer1 = true
        })

        // Countdown start
        this.multiplayerSystem.setHandler(SERVER_EVENT.COUNTDOWN_START, (message) => {
            setTextContent(this.renderer, this.nameDisplayEntities[1], "Opponent")
            setTextAlignment(this.nameDisplayEntities[1], this.renderer.gl.canvas.width, ALIGNMENT.RIGHT)

            this.commenceGameCountdown()
        })

        // Round start
        this.multiplayerSystem.setHandler(SERVER_EVENT.ROUND_START, (message) => {
            if (message.length != 9) {
                throw Error("Expected a message length of 9.")
            }

            // Get the ball position and velocities
            const ballPos= vec2.fromValues(
                arrayToShort(message, 1), arrayToShort(message, 3))
            const ballVel= vec2.fromValues(
                arrayToShort(message, 5), arrayToShort(message, 7))

            if (!this.isPlayer1) {
                ballPos[0] = this.renderer.gl.canvas.width - ballPos[0]
                ballVel[0] *= -1
            }

            this.ball = createBall(ballPos, vec2.fromValues(50, 50), vec4.fromValues(1, 1, 1, 1))
            registry.motions.get(this.ball).positionalVel = ballVel

            // Display a "start" at the center for 1 second
            setTextContent(this.renderer, this.timerTextEntity, "Start")
            createDelayedCallback(() => {
                registry.removeAllComponentsOf(this.timerTextEntity)
            }, 1000)
        })

        // Collision motion
        this.multiplayerSystem.setHandler(SERVER_EVENT.COLLISION_MOTION, (message) => {
            const ballPos = vec2.fromValues(
                arrayToShort(message, 1), arrayToShort(message, 3))
            const ballVel = vec2.fromValues(
                arrayToShort(message, 5), arrayToShort(message, 7))
            const ballMotion = registry.motions.get(this.ball)

            if (!this.isPlayer1) {
                ballPos[0] = this.renderer.gl.canvas.width - ballPos[0]
                ballVel[0] *= -1
            }

            vec2.copy(ballMotion.position, ballPos)
            vec2.copy(ballMotion.positionalVel, ballVel)
        })

        // Opponent Motion
        this.multiplayerSystem.setHandler(SERVER_EVENT.OP_MOTION, (message) => {
            const opMotion = registry.motions.get(this.opponent)

            opMotion.position[1] = arrayToShort(message, 3)
        })
    }

    public setMultiplayerHandler(serverEvent: SERVER_EVENT, handlerCallback: HandlerCallback) {
        this.multiplayerSystem.setHandler(serverEvent, handlerCallback)
    }

    public pushMultiplayerMessages(timeElapsed: number) {
        if (!this.isMultiplayer) return
        if (!this.multiplayerSystem.isInitialized) return
        
        // We will broadcast our player's location at every iteration of the game loop
        // We could minimize the number of messages we sent further but this will do for now
        const pMotion = registry.motions.get(this.player)
        this.multiplayerSystem.sendMessage(new MotionMessage(pMotion.position))
    }

    public closeMultiplayer() {
        if (this.multiplayerSystem.isInitialized) {
            this.multiplayerSystem.close()
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
        if (this.isMultiplayer) {
            return
        }

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
                        const ballMotion = registry.motions.get(this.ball)
                        const wallMotion = registry.motions.get(collision.entityOther)

                        const message = new CollisionMessage(
                            vec2.clone(ballMotion.position),
                            vec2.clone(ballMotion.positionalVel),
                            vec2.clone(wallMotion.position),
                            vec2.clone(wallMotion.scale),
                            endGameWall.isLeft ? 0 : 1
                        )
                        
                        if (!this.isPlayer1) {
                            message.wallPosition[0] = this.renderer.gl.canvas.width - message.wallPosition[0]
                            message.ballPosition[0] = this.renderer.gl.canvas.width - message.ballPosition[0]
                            message.ballVelocity[0] *= -1
                        }

                        this.multiplayerSystem.sendMessage(message)

                        continue
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
                    const ballMotion = registry.motions.get(this.ball)
                    const otherMotion = registry.motions.get(collision.entityOther)

                    if (this.isMultiplayer) {
                        const message = new CollisionMessage(
                            vec2.clone(ballMotion.position),
                            vec2.clone(ballMotion.positionalVel),
                            vec2.clone(otherMotion.position),
                            vec2.clone(otherMotion.scale)
                        )
                        
                        if (!this.isPlayer1) {
                            message.wallPosition[0] = this.renderer.gl.canvas.width - message.wallPosition[0]
                            message.ballPosition[0] = this.renderer.gl.canvas.width - message.ballPosition[0]
                            message.ballVelocity[0] *= -1
                        }

                        this.multiplayerSystem.sendMessage(message)
                    }


                    PhysicSystem.reflectObject(ballMotion, otherMotion)
                }
            }

            // Paddle collision
            if (collision.entity === this.player || collision.entity === this.opponent) {
                if (registry.walls.has(collision.entityOther)) {
                    const pMotion = registry.motions.get(collision.entity)
                    const wMotion = registry.motions.get(collision.entityOther)

                    const wBB = BoundingBox.getBoundingBox(wMotion.position, wMotion.scale)

                    if (pMotion.positionalVel[1] > 0) {
                        pMotion.position[1] = wBB.top - pMotion.scale[1] / 2
                    } else if (pMotion.positionalVel[1] < 0) {
                        pMotion.position[1] = wBB.bottom + pMotion.scale[1] / 2
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


        const pMotion = registry.motions.get(this.player)
        if (pMotion.positionalVel[1] != 0) {
            pMotion.positionalVel[1] = 0
        }
    }

    private onKeyDown(e: KeyboardEvent) {
        if (this.currentScreen !== GAME_SCREEN.GAME_SCREEN) {
            this.screenSystem.handleKeyDown(e)
            return
        }
        
        const pMotion = registry.motions.get(this.player)

        switch (e.key) {
            case "Escape":
                e.preventDefault()

                this.isPaused = !this.isPaused
                registry.screenStates.components[0].darkenScreenFactor = 0.9
                this.currentScreen = GAME_SCREEN.PAUSE_MENU
                this.reinitializeWorld()
                break
            case "w":
                if (!this.isPaused) {
                    pMotion.positionalVel[1] = -5
                }
                
                break
            case "s":
                if (!this.isPaused) {
                    pMotion.positionalVel[1] = 5
                }
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