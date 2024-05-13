import { vec2, vec4 } from "gl-matrix"
import RenderSystem from "../ecs_scripts/render_system"
import { createRectangle, createText } from "../ecs_scripts/world_init"
import WorldSystem from "../ecs_scripts/world_system"
import { BaseScreen, ButtonCallback } from "./base_screen"
import { DelayedCallback, GAME_SCREEN } from "../ecs_scripts/components"
import { registry } from "../ecs_scripts/ecs_registry"
import { Entity } from "../ecs_scripts/ecs"

class PreGameScreen extends BaseScreen {
    private exitBtnPressedOnce: number = 0
    private exitIndicatorTextEntity : number = -1
    private exitDelayedCallbackEntity: number = -1

    protected initializeScreenEntities(world: WorldSystem, renderer: RenderSystem): void {
        super.initializeScreenEntities(world, renderer)

        const gl = renderer.gl

        /**
         * Middle countdown timer
         */
        const screenMidPoint = vec2.fromValues(gl.canvas.width / 2, renderer.gl.canvas.height / 2)

        const countdownTextEntity = createText(
            renderer, vec2.fromValues(screenMidPoint[0], screenMidPoint[1] - 0.65 * renderer.DEFAULT_FONTSIZE), 
            "Starting in...", this.WHITE, 0.55)
        const countdownValueEntity = createText(
            renderer,  vec2.fromValues(screenMidPoint[0], screenMidPoint[1] + 0.5 * renderer.DEFAULT_FONTSIZE),
            "3", this.WHITE, 0.5)
        this.screenEntities.push(...[countdownTextEntity, countdownValueEntity])

        /** 
         * Left side -> Player side
         * UI includes the player's title and total score
         */
        const quarterMidPoint = vec2.fromValues(renderer.gl.canvas.width / 4, renderer.gl.canvas.height / 2)

        const playerTextEntity = createText(
            renderer, vec2.fromValues(quarterMidPoint[0], quarterMidPoint[1] - 2 * renderer.DEFAULT_FONTSIZE),
            "Player", this.WHITE, 0.45)
        const playerScoreEntity = createText(
            renderer, vec2.fromValues(quarterMidPoint[0], quarterMidPoint[1] + renderer.DEFAULT_FONTSIZE),
            `Total Score: ${world.playerScore}`, this.WHITE, 0.3)
        const playerBGEntity = createRectangle(
            vec2.fromValues(gl.canvas.width / 4, gl.canvas.height / 2), 
            vec2.fromValues(gl.canvas.width / 2, gl.canvas.height), vec4.fromValues(0, 0, 0.23, 1))
        this.screenEntities.push(...[playerTextEntity, playerScoreEntity, playerBGEntity])

        /** 
         * Right side -> Opponent side
         * UI includes the opponent's title and total score
         */
        const opponentTextEntity = createText(
            renderer, vec2.fromValues(3 * quarterMidPoint[0], quarterMidPoint[1] - 2 * renderer.DEFAULT_FONTSIZE),
            "Opponent", this.WHITE, 0.45)
        const opponentScoreEntity = createText(
            renderer, vec2.fromValues(3 * quarterMidPoint[0], quarterMidPoint[1] + 1 * renderer.DEFAULT_FONTSIZE),
            `Total Score: ${world.opponentScore}`, this.WHITE, 0.3)
        const opponentBGEntity = createRectangle(
            vec2.fromValues(3 * gl.canvas.width / 4, gl.canvas.height / 2), 
            vec2.fromValues(gl.canvas.width / 2, gl.canvas.height), vec4.fromValues(0.23, 0, 0, 1))
        this.screenEntities.push(...[opponentTextEntity, opponentScoreEntity, opponentBGEntity])

        /**
         * Keyboard indicator for exiting
         */
        this.exitIndicatorTextEntity = createText(
            renderer, vec2.fromValues(renderer.gl.canvas.width / 2, 0.25 * renderer.DEFAULT_FONTSIZE),
            "Press the Esc key twice to exit the game.", this.HOVER_GREY, 0.3)

        this.screenEntities.push(this.exitIndicatorTextEntity)
    }

    protected bindKeyboardCallbacks(world: WorldSystem, renderer: RenderSystem): void {
        this.keyToCallback.set("Escape", (e) => {
            let y = -1

            if (this.exitBtnPressedOnce === 0) {
                this.exitBtnPressedOnce += 1
                registry.renderRequests.get(this.exitIndicatorTextEntity).color = this.RED
                
                // Create a delayed callback to reset the timer
                // for exiting the screen if it doesn't exist
                if (this.exitDelayedCallbackEntity === -1) {
                    this.exitDelayedCallbackEntity = Entity.generate()
                    
                    registry.delayedCallbacks.insert(
                        this.exitDelayedCallbackEntity, new DelayedCallback(1500, () => {
                            this.exitBtnPressedOnce = 0
                            registry.renderRequests.get(this.exitIndicatorTextEntity).color = this.HOVER_GREY
                            
                            registry.removeAllComponentsOf(this.exitDelayedCallbackEntity)
                            this.exitDelayedCallbackEntity = -1
                        }))
                }

            } else {
                world.currentScreen = GAME_SCREEN.MAIN_MENU
                world.reinitializeWorld()
                world.resetScore()
                
                this.exitBtnPressedOnce = 0
                this.cleanup()
            }
        })
    }

    protected clearScreenEntities(): void {
        super.clearScreenEntities()
        
        if (registry.delayedCallbacks.has(this.exitDelayedCallbackEntity))
            registry.removeAllComponentsOf(this.exitDelayedCallbackEntity)
        
        this.exitDelayedCallbackEntity = -1
        this.exitIndicatorTextEntity = -1
    }
}

export default PreGameScreen