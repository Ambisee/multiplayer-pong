import { vec2, vec4 } from "gl-matrix"
import RenderSystem from "../ecs_scripts/render_system"
import { createText } from "../ecs_scripts/world_init"
import { BaseScreen } from "./base_screen"
import { registry } from "../ecs_scripts/ecs_registry"
import { ButtonBuilder } from "../ecs_scripts/ui_init"
import WorldSystem from "../ecs_scripts/world_system"
import { GAME_MODE, GAME_SCREEN } from "../ecs_scripts/components"
import { BLACK, RED, WHITE } from "../ecs_scripts/common"

class MainMenu extends BaseScreen {

    protected initializeScreenEntities(world: WorldSystem, renderer: RenderSystem): void {
        super.initializeScreenEntities(world, renderer)

        const localGL = renderer.gl

        // Create the title text
        const titleEntity = createText(
            renderer, 
            vec2.fromValues(localGL.canvas.width / 2, 0),
            "Neo Pong",
            WHITE,
            1.25
        )

        const titleMotion = registry.motions.get(titleEntity)
        titleMotion.position[1] += (0.75 * titleMotion.scale[1])

        // Create the start buttons 
        const sPlayBtnBuilder = new ButtonBuilder(renderer)
        const tPlayBtnBuilder = new ButtonBuilder(renderer)
        const mPlayBtnBuilder = new ButtonBuilder(renderer)

        // Button colors
        sPlayBtnBuilder.setColor(vec4.clone(WHITE), vec4.clone(BLACK))
        tPlayBtnBuilder.setColor(vec4.clone(WHITE), vec4.clone(BLACK))
        mPlayBtnBuilder.setColor(vec4.clone(WHITE), vec4.clone(BLACK))
        
        // Button size and positions
        const buttonDimension = vec2.fromValues(250, 50)
        const buttonPosition = vec2.fromValues(localGL.canvas.width / 2, localGL.canvas.height / 2)

        sPlayBtnBuilder.setMotion(buttonPosition, buttonDimension)
        tPlayBtnBuilder.setMotion(buttonPosition, buttonDimension)
        mPlayBtnBuilder.setMotion(buttonPosition, buttonDimension)

        // Button text
        sPlayBtnBuilder.setText("Singleplayer", 0.4)
        tPlayBtnBuilder.setText("Two-player", 0.4)
        mPlayBtnBuilder.setText("Multiplayer", 0.4)


        mPlayBtnBuilder.motionComponent.position[1] += 1.5 * mPlayBtnBuilder.motionComponent.scale[1]
        sPlayBtnBuilder.motionComponent.position[1] -= 1.5 * sPlayBtnBuilder.motionComponent.scale[1]

        // Button variant
        sPlayBtnBuilder.setFilledBox()
        tPlayBtnBuilder.setFilledBox()
        mPlayBtnBuilder.setFilledBox()

        const sPlayBtnTextRR = registry.renderRequests.get(sPlayBtnBuilder.buttonComponent.textEntity)
        const sPlayBtnBoxRR = registry.renderRequests.get(sPlayBtnBuilder.buttonComponent.associatedEntities[0])

        const mPlayBtnTextRR = registry.renderRequests.get(mPlayBtnBuilder.buttonComponent.textEntity)
        const mPlayBtnBoxRR = registry.renderRequests.get(mPlayBtnBuilder.buttonComponent.associatedEntities[0])

        const tPlayBtnTextRR = registry.renderRequests.get(tPlayBtnBuilder.buttonComponent.textEntity)
        const tPlayBtnBoxRR = registry.renderRequests.get(tPlayBtnBuilder.buttonComponent.associatedEntities[0])

        this.buttonToCallbacksMap = [
            // Single player button callbacks
            {
                entity: sPlayBtnBuilder.entity,
                onMouseDown: (e: MouseEvent) => {
                    world.play(GAME_MODE.SINGLEPLAYER)
                },
                onMouseEnter: (e) => {
                    vec4.copy(sPlayBtnTextRR.color, WHITE)
                    vec4.copy(sPlayBtnBoxRR.color, RED)
                    sPlayBtnBuilder.buttonComponent.isMouseHovering = true
                },
                onMouseExit: (e) => {
                    vec4.copy(sPlayBtnBoxRR.color, WHITE)
                    vec4.copy(sPlayBtnTextRR.color, BLACK)
                    sPlayBtnBuilder.buttonComponent.isMouseHovering = false
                }
            },

            // Two-player button callback
            {
                entity: tPlayBtnBuilder.entity,
                onMouseDown: (e: MouseEvent) => {
                    world.play(GAME_MODE.TWOPLAYER)
                },
                onMouseEnter: (e) => {
                    vec4.copy(tPlayBtnTextRR.color, WHITE)
                    vec4.copy(tPlayBtnBoxRR.color, RED)
                    registry.buttons.get(tPlayBtnBuilder.entity).isMouseHovering = true
                },
                onMouseExit: (e) => {
                    vec4.copy(tPlayBtnBoxRR.color, WHITE)
                    vec4.copy(tPlayBtnTextRR.color, BLACK)
                    registry.buttons.get(tPlayBtnBuilder.entity).isMouseHovering = false
                }
            },
            
            // Multiplayer button callback
            {
                entity: mPlayBtnBuilder.entity, 
                onMouseDown: (e: MouseEvent) => {
                    world.play(GAME_MODE.MULTIPLAYER)
                },
                onMouseEnter: (e) => {
                    vec4.copy(mPlayBtnTextRR.color, WHITE)
                    vec4.copy(mPlayBtnBoxRR.color, RED)
                    registry.buttons.get(mPlayBtnBuilder.entity).isMouseHovering = true
                },
                onMouseExit: (e) => {
                    vec4.copy(mPlayBtnBoxRR.color, WHITE)
                    vec4.copy(mPlayBtnTextRR.color, BLACK)
                    registry.buttons.get(mPlayBtnBuilder.entity).isMouseHovering = false
                }
            }
        ]

        this.screenEntities = [titleEntity, sPlayBtnBuilder.entity, mPlayBtnBuilder.entity, tPlayBtnBuilder.entity]
    }
}

export default MainMenu