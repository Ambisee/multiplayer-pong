import { vec2, vec4 } from "gl-matrix"
import RenderSystem from "../ecs_scripts/render_system"
import { createText } from "../ecs_scripts/world_init"
import { BaseScreen } from "./base_screen"
import { registry } from "../ecs_scripts/ecs_registry"
import { ButtonBuilder } from "../ecs_scripts/ui_init"
import WorldSystem from "../ecs_scripts/world_system"
import { GAME_SCREEN } from "../ecs_scripts/components"

class MainMenu extends BaseScreen {

    protected initializeScreenEntities(world: WorldSystem, renderer: RenderSystem): void {
        super.initializeScreenEntities(world, renderer)

        const localGL = renderer.gl

        // Create the title text
        const titleEntity = createText(
            renderer, 
            vec2.fromValues(localGL.canvas.width / 2, 0),
            "Neo Pong",
            this.WHITE,
            1.25
        )

        const titleMotion = registry.motions.get(titleEntity)
        titleMotion.position[1] += (0.75 * titleMotion.scale[1])

        // Create the start buttons 
        const sPlayBtnBuilder = new ButtonBuilder(renderer)
        const mPlayBtnBuilder = new ButtonBuilder(renderer)

        // Button colors
        sPlayBtnBuilder.setColor(vec4.clone(this.WHITE), vec4.clone(this.BLACK))
        mPlayBtnBuilder.setColor(vec4.clone(this.WHITE), vec4.clone(this.BLACK))
        
        // Button size and positions
        const buttonDimension = vec2.fromValues(100, 25)
        const buttonPosition = vec2.fromValues(localGL.canvas.width / 2, localGL.canvas.height / 2)

        sPlayBtnBuilder.setMotion(buttonPosition, buttonDimension)
        mPlayBtnBuilder.setMotion(buttonPosition, buttonDimension)
        mPlayBtnBuilder.setPadding(50, 0)

        // Button text
        sPlayBtnBuilder.setText("Play", 0.4)
        mPlayBtnBuilder.setText("Play online", 0.4)

        mPlayBtnBuilder.motionComponent.position[1] += 0.75 * mPlayBtnBuilder.motionComponent.scale[1]
        sPlayBtnBuilder.motionComponent.position[1] -= 0.75 * sPlayBtnBuilder.motionComponent.scale[1]

        // Button variant
        sPlayBtnBuilder.setFilledBox()
        mPlayBtnBuilder.setFilledBox()

        const sPlayBtnTextRR = registry.renderRequests.get(sPlayBtnBuilder.buttonComponent.textEntity)
        const sPlayBtnBoxRR = registry.renderRequests.get(sPlayBtnBuilder.buttonComponent.associatedEntities[0])

        const mPlayBtnTextRR = registry.renderRequests.get(mPlayBtnBuilder.buttonComponent.textEntity)
        const mPlayBtnBoxRR = registry.renderRequests.get(mPlayBtnBuilder.buttonComponent.associatedEntities[0])

        this.buttonToCallbacksMap = [
            // Single player button callbacks
            {
                entity: sPlayBtnBuilder.entity,
                onMouseDown: (e: MouseEvent) => {
                    world.currentScreen = GAME_SCREEN.GAME_SCREEN
                    world.reinitializeWorld()
                    world.resetScore()
                },
                onMouseEnter: (e) => {
                    vec4.copy(sPlayBtnTextRR.color, this.WHITE)
                    vec4.copy(sPlayBtnBoxRR.color, this.RED)
                    sPlayBtnBuilder.buttonComponent.isMouseHovering = true
                },
                onMouseExit: (e) => {
                    vec4.copy(sPlayBtnBoxRR.color, this.WHITE)
                    vec4.copy(sPlayBtnTextRR.color, this.BLACK)
                    sPlayBtnBuilder.buttonComponent.isMouseHovering = false
                }
            },
            
            // Multiplayer button callback
            {
                entity: mPlayBtnBuilder.entity, 
                onMouseDown: (e: MouseEvent) => {
                    world.currentScreen = GAME_SCREEN.GAME_SCREEN
                    world.reinitializeWorld()
                    world.resetScore()
                },
                onMouseEnter: (e) => {
                    vec4.copy(mPlayBtnTextRR.color, this.WHITE)
                    vec4.copy(mPlayBtnBoxRR.color, this.RED)
                    registry.buttons.get(mPlayBtnBuilder.entity).isMouseHovering = true
                },
                onMouseExit: (e) => {
                    vec4.copy(mPlayBtnBoxRR.color, this.WHITE)
                    vec4.copy(mPlayBtnTextRR.color, this.BLACK)
                    registry.buttons.get(mPlayBtnBuilder.entity).isMouseHovering = false
                }
            }
        ]

        this.screenEntities = [titleEntity, sPlayBtnBuilder.entity, mPlayBtnBuilder.entity]
    }
}

export default MainMenu