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
            vec4.fromValues(1, 1, 1, 1),
            1.25
        )

        const titleMotion = registry.motions.get(titleEntity)
        titleMotion.position[1] += (0.75 * titleMotion.scale[1])

        // Create the start buttons 
        const sPlayBtnBuilder = new ButtonBuilder(renderer)
        const mPlayBtnBuilder = new ButtonBuilder(renderer)

        // Button colors
        sPlayBtnBuilder.setColor(vec4.fromValues(0.75, 0.75, 0.75, 1), vec4.fromValues(1, 1, 1, 1))
        mPlayBtnBuilder.setColor(vec4.fromValues(0.75, 0.75, 0.75, 1), vec4.fromValues(0, 0, 0, 1))
        
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
        sPlayBtnBuilder.setBorderedBox(1)
        mPlayBtnBuilder.setFilledBox()

        this.buttonToCallbacksMap = [
            {
                entity: sPlayBtnBuilder.entity, 
                onMouseDown: (e: MouseEvent) => {
                    world.currentScreen = GAME_SCREEN.GAME_SCREEN
                    world.reinitializeWorld()
                },
                onMouseEnter: (e) => {
                    registry.buttons.get(sPlayBtnBuilder.entity).isMouseHovering = true
                },
                onMouseExit: (e) => {
                    registry.buttons.get(sPlayBtnBuilder.entity).isMouseHovering = false
                }
            },
            {
                entity: mPlayBtnBuilder.entity, 
                onMouseDown: (e: MouseEvent) => {
                    world.currentScreen = GAME_SCREEN.GAME_SCREEN
                    world.reinitializeWorld()
                },
                onMouseEnter: (e) => {
                    registry.buttons.get(mPlayBtnBuilder.entity).isMouseHovering = true
                },
                onMouseExit: (e) => {
                    registry.buttons.get(mPlayBtnBuilder.entity).isMouseHovering = false
                }
            }
        ]

        this.screenEntities = [titleEntity, sPlayBtnBuilder.entity, mPlayBtnBuilder.entity]
    }
}

export default MainMenu