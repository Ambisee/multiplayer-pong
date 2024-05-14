import { vec2, vec4 } from "gl-matrix"
import RenderSystem from "../ecs_scripts/render_system"
import { createRectangle, createText } from "../ecs_scripts/world_init"
import WorldSystem from "../ecs_scripts/world_system"
import { BaseScreen } from "./base_screen"
import { ButtonBuilder } from "../ecs_scripts/ui_init"
import { GAME_SCREEN, RENDER_LAYER } from "../ecs_scripts/components"
import { registry } from "../ecs_scripts/ecs_registry"
import { BoundingBox } from "../ecs_scripts/common"

class PostGameScreen extends BaseScreen {
    public initializeScreenEntities(world: WorldSystem, renderer: RenderSystem): void {
        super.initializeScreenEntities(world, renderer)

        const didPlayerWin = world.playerScore > world.opponentScore
        let textColor = didPlayerWin ? this.WHITE : this.RED

        /**
         * Title
         */
        const titleContent = didPlayerWin ? "You win!" : "You lose!"
        const titleE = createText(
            renderer, vec2.fromValues(renderer.gl.canvas.width / 2, 0.65 * renderer.DEFAULT_FONTSIZE), 
            titleContent, textColor, 0.65
        )
        this.screenEntities.push(titleE)

        /**
         * Left side -> Player side
         * UI includes the player's title and total score
         */
        const oneEighthMidePoint = vec2.fromValues(renderer.gl.canvas.width / 8, renderer.gl.canvas.height / 2)

        const playerTextEntity = createText(
            renderer, vec2.fromValues(3 * oneEighthMidePoint[0], oneEighthMidePoint[1] - 1.5 * renderer.DEFAULT_FONTSIZE),
            "Player", textColor, 0.45)
        const playerScoreEntity = createText(
            renderer, vec2.fromValues(3 * oneEighthMidePoint[0], oneEighthMidePoint[1]),
            `${world.playerScore}`, textColor, 1.5)
        this.screenEntities.push(...[playerTextEntity, playerScoreEntity])

        
        /**
         * Left side -> Player side
         * UI includes the player's title and total score
         */

        textColor = !didPlayerWin ? this.WHITE : this.RED

        const opponentTextEntity = createText(
            renderer, vec2.fromValues(5 * oneEighthMidePoint[0], oneEighthMidePoint[1] - 1.5 * renderer.DEFAULT_FONTSIZE),
            "Opponent", textColor, 0.45)
        const opponentScoreEntity = createText(
            renderer, vec2.fromValues(5 * oneEighthMidePoint[0], oneEighthMidePoint[1]),
            `${world.opponentScore}`, textColor, 1.5)
        this.screenEntities.push(...[opponentTextEntity, opponentScoreEntity])

        const scoreDividerEntity = createRectangle(
            vec2.fromValues(4 * oneEighthMidePoint[0], oneEighthMidePoint[1]),
            vec2.fromValues(35, 10), this.WHITE
        )

        const opponentM = registry.motions.get(opponentTextEntity)
        const opponentBB = BoundingBox.getBoundingBox(opponentM.position, opponentM.scale)

        /**
         * Buttons
         */
        const playAgainBtnBuilder = new ButtonBuilder(renderer)
        const quitBtnBuilder = new ButtonBuilder(renderer)

        // Button color
        playAgainBtnBuilder.setColor(this.WHITE, this.BLACK)
        quitBtnBuilder.setColor(this.WHITE, this.BLACK)

        // Button motion
        const buttonSize = vec2.fromValues(125, 50)
        const buttonPos = vec2.fromValues(opponentBB.right, renderer.gl.canvas.height - 100)
        playAgainBtnBuilder.setMotion(buttonPos, buttonSize)
        quitBtnBuilder.setMotion(buttonPos, buttonSize)

        // Button text
        playAgainBtnBuilder.setText("Play again", 0.35)
        quitBtnBuilder.setText("Quit", 0.35)

        playAgainBtnBuilder.motionComponent.position[0] -= 3.25 * playAgainBtnBuilder.motionComponent.scale[0] / 2
        quitBtnBuilder.motionComponent.position[0] -= quitBtnBuilder.motionComponent.scale[0] / 2

        playAgainBtnBuilder.setPadding(10, 0)

        playAgainBtnBuilder.setFilledBox()
        quitBtnBuilder.setFilledBox()

        // Button render layer
        playAgainBtnBuilder.setRenderLayer(RENDER_LAYER.U0)
        quitBtnBuilder.setRenderLayer(RENDER_LAYER.U0)

        // button callbacks
        this.buttonToCallbacksMap = [
            {
                entity: playAgainBtnBuilder.entity,
                onMouseDown: (e) => {
                    registry.screenStates.components[0].darkenScreenFactor = 0
                    
                    /**
                     * Send a rematch request to the server and wait for the opponent's response
                     * 
                     * If opponent has already responded, immediately switch to the game screen and
                     * start the countdown
                     */
                },
                onMouseEnter: (e) => {
                    registry.buttons.get(playAgainBtnBuilder.entity).isMouseHovering = true
                    
                    // Change color to red
                    const textRR = registry.renderRequests.get(playAgainBtnBuilder.buttonComponent.textEntity)
                    vec4.copy(textRR.color, this.WHITE)

                    playAgainBtnBuilder.buttonComponent.associatedEntities.forEach((value) => {
                        const assocRR = registry.renderRequests.get(value)
                        vec4.copy(assocRR.color, this.RED)
                    })
                },
                onMouseExit: (e) => {
                    registry.buttons.get(playAgainBtnBuilder.entity).isMouseHovering = false

                    // Change color to white
                    const textRR = registry.renderRequests.get(playAgainBtnBuilder.buttonComponent.textEntity)
                    vec4.copy(textRR.color, this.BLACK)

                    playAgainBtnBuilder.buttonComponent.associatedEntities.forEach((value) => {
                        const assocRR = registry.renderRequests.get(value)
                        vec4.copy(assocRR.color, this.WHITE)
                    })
                },
            },
            {
                entity: quitBtnBuilder.entity,
                onMouseDown: (e) => {
                    registry.screenStates.components[0].darkenScreenFactor = 0
                    world.currentScreen = GAME_SCREEN.MAIN_MENU
                    world.isPaused = false
                    world.reinitializeWorld()
                    world.closeMultiplayer()
                    world.resetScore()
                    this.cleanup()
                },
                onMouseEnter: (e) => {
                    registry.buttons.get(quitBtnBuilder.entity).isMouseHovering = true
                    
                    // Change color to red
                    const textRR = registry.renderRequests.get(quitBtnBuilder.buttonComponent.textEntity)
                    vec4.copy(textRR.color, this.WHITE)

                    quitBtnBuilder.buttonComponent.associatedEntities.forEach((value) => {
                        const assocRR = registry.renderRequests.get(value)
                        vec4.copy(assocRR.color, this.RED)
                    })
                },
                onMouseExit: (e) => {
                    registry.buttons.get(quitBtnBuilder.entity).isMouseHovering = false

                    // Change color to white
                    const textRR = registry.renderRequests.get(quitBtnBuilder.buttonComponent.textEntity)
                    vec4.copy(textRR.color, this.BLACK)

                    quitBtnBuilder.buttonComponent.associatedEntities.forEach((value) => {
                        const assocRR = registry.renderRequests.get(value)
                        vec4.copy(assocRR.color, this.WHITE)
                    })
                },
            }
        ]

        this.screenEntities.push(...[scoreDividerEntity, playAgainBtnBuilder.entity, quitBtnBuilder.entity])
    }
}

export default PostGameScreen