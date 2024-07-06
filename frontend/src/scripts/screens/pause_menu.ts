import { vec2, vec4 } from "gl-matrix"
import RenderSystem from "../ecs_scripts/render_system"
import { createText } from "../ecs_scripts/world_init"
import WorldSystem from "../ecs_scripts/world_system"
import { BaseScreen } from "./base_screen"
import { ButtonBuilder } from "../ecs_scripts/ui_init"
import { GAME_SCREEN, RENDER_LAYER } from "../ecs_scripts/components"
import { registry } from "../ecs_scripts/ecs_registry"
import { RED, WHITE } from "../ecs_scripts/common"

class PauseMenu extends BaseScreen {
    
    protected initializeScreenEntities(world: WorldSystem, renderer: RenderSystem): void {
        super.initializeScreenEntities(world, renderer)

        const localGL = renderer.gl

        // Create the title
        const titleEntity = createText(
            renderer, vec2.fromValues(localGL.canvas.width / 2, 0),
            "Pause", vec4.fromValues(1, 1, 1, 1), 1.25)

        const titleMotion = registry.motions.get(titleEntity)
        titleMotion.position[1] += (0.75 * titleMotion.scale[1])

        registry.renderRequests.get(titleEntity).renderLayer = RENDER_LAYER.U0

        // Create the resume and exit button
        const resumeBtnBuilder = new ButtonBuilder(renderer)
        const quitBtnBuilder = new ButtonBuilder(renderer)

        // Button colors
        resumeBtnBuilder.setColor(vec4.fromValues(0.75, 0.75, 0.75, 1), vec4.fromValues(1, 1, 1, 1))
        quitBtnBuilder.setColor(vec4.fromValues(0.75, 0.75, 0.75, 1), vec4.fromValues(1, 1, 1, 1))

        // Button positions and sizes
        const buttonPosition = vec2.fromValues(localGL.canvas.width / 2, localGL.canvas.height / 2)
        const buttonSize = vec2.fromValues(125, 50)

        resumeBtnBuilder.setMotion(buttonPosition, buttonSize)
        quitBtnBuilder.setMotion(buttonPosition, buttonSize)

        // Button text
        resumeBtnBuilder.setText("Resume", 0.4)
        quitBtnBuilder.setText("Quit", 0.4)

        resumeBtnBuilder.motionComponent.position[1] -= 0.75 * resumeBtnBuilder.motionComponent.scale[1]
        quitBtnBuilder.motionComponent.position[1] += 0.75 * quitBtnBuilder.motionComponent.scale[1]

        resumeBtnBuilder.setBorderedBox(1)
        quitBtnBuilder.setBorderedBox(1)

        resumeBtnBuilder.setRenderLayer(RENDER_LAYER.U0)
        quitBtnBuilder.setRenderLayer(RENDER_LAYER.U0)

        // Button callbacks
        this.buttonToCallbacksMap = [
            {
                entity: resumeBtnBuilder.entity,
                onMouseDown: (e) => {
                    registry.screenStates.components[0].darkenScreenFactor = 0
                    world.currentScreen = GAME_SCREEN.GAME_SCREEN
                    
                    if (registry.gameStates.length() > 0) {
                        registry.gameStates.components[0].isPaused = false
                    }

                    this.cleanup()
                },
                onMouseEnter: (e) => {
                    registry.buttons.get(resumeBtnBuilder.entity).isMouseHovering = true
                    
                    // Change color to red
                    const textRR = registry.renderRequests.get(resumeBtnBuilder.buttonComponent.textEntity)
                    vec4.copy(textRR.color, RED)

                    resumeBtnBuilder.buttonComponent.associatedEntities.forEach((value) => {
                        const assocRR = registry.renderRequests.get(value)
                        vec4.copy(assocRR.color, RED)
                    })
                },
                onMouseExit: (e) => {
                    registry.buttons.get(resumeBtnBuilder.entity).isMouseHovering = false

                    // Change color to white
                    const textRR = registry.renderRequests.get(resumeBtnBuilder.buttonComponent.textEntity)
                    vec4.copy(textRR.color, WHITE)

                    resumeBtnBuilder.buttonComponent.associatedEntities.forEach((value) => {
                        const assocRR = registry.renderRequests.get(value)
                        vec4.copy(assocRR.color, WHITE)
                    })
                },
            },
            {
                entity: quitBtnBuilder.entity,
                onMouseDown: (e) => {
                    registry.screenStates.components[0].darkenScreenFactor = 0
                    world.currentScreen = GAME_SCREEN.MAIN_MENU
                    world.resetScore()
                    world.reinitializeWorld()
                    world.closeMultiplayer()
                    this.cleanup()
                },
                onMouseEnter: (e) => {
                    registry.buttons.get(quitBtnBuilder.entity).isMouseHovering = true

                    // Change color to red
                    const textRR = registry.renderRequests.get(quitBtnBuilder.buttonComponent.textEntity)
                    vec4.copy(textRR.color, RED)

                    quitBtnBuilder.buttonComponent.associatedEntities.forEach((value) => {
                        const assocRR = registry.renderRequests.get(value)
                        vec4.copy(assocRR.color, RED)
                    })
                },
                onMouseExit: (e) => {
                    registry.buttons.get(quitBtnBuilder.entity).isMouseHovering = false

                    // Change color to white
                    const textRR = registry.renderRequests.get(quitBtnBuilder.buttonComponent.textEntity)
                    vec4.copy(textRR.color, WHITE)

                    quitBtnBuilder.buttonComponent.associatedEntities.forEach((value) => {
                        const assocRR = registry.renderRequests.get(value)
                        vec4.copy(assocRR.color, WHITE)
                    })
                },
            },
        ]

        this.screenEntities = [titleEntity, resumeBtnBuilder.entity, quitBtnBuilder.entity]
    }

    public bindKeyboardCallbacks(world: WorldSystem, renderer: RenderSystem): void {
        this.keyToCallback.set("Escape", (e) => {
            registry.screenStates.components[0].darkenScreenFactor = 0
            world.currentScreen = GAME_SCREEN.GAME_SCREEN
            document.body.style.cursor = "default"
            
            if (registry.gameStates.length() > 0) {
                registry.gameStates.components[0].isPaused = false
            }

            this.cleanup()
        })
    }
}

export default PauseMenu