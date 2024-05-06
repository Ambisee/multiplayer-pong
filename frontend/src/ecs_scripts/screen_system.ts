
import { GAME_SCREEN } from "./components"
import { BaseScreen, ButtonCallback } from "../screens/base_screen"
import MainMenu from "../screens/main_menu"
import WorldSystem from "./world_system"
import { registry } from "./ecs_registry"
import { BoundingBox } from "./common"
import PauseMenu from "../screens/pause_menu"

type ScreenMap = Map<GAME_SCREEN, BaseScreen>

class ScreenSystem {
    public screenEntities: number[]
    public buttonToCallbacksMap: ButtonCallback[]
    public keyToCallback: Map<string, (e: KeyboardEvent) => void>

    public gameScreenToRender: ScreenMap

    public constructor() {
        this.screenEntities = []
        this.buttonToCallbacksMap = []
        this.keyToCallback = new Map()
        
        this.gameScreenToRender = new Map()
        this.gameScreenToRender.set(
            GAME_SCREEN.MAIN_MENU, new MainMenu(this.screenEntities, this.buttonToCallbacksMap, this.keyToCallback))
        this.gameScreenToRender.set(
            GAME_SCREEN.PAUSE_MENU, new PauseMenu(this.screenEntities, this.buttonToCallbacksMap, this.keyToCallback))


        this.gameScreenToRender.get(GAME_SCREEN.PAUSE_MENU)
    }

    public checkMouseOverUI(e: MouseEvent) {
        // Array to collect the entities the mouse is hovering over
        const mouseOverEntities = []

        for (let i = 0; i < registry.buttons.length(); i++) {
            const entity = registry.buttons.entities[i]
            const component = registry.buttons.components[i]

            if (this.isMouseOver(entity, e.x, e.y)) {
                mouseOverEntities.push(entity)
                component.isMouseHovering = true
                component.onMouseEnter()
            } else {
                component.isMouseHovering = false
                component.onMouseExit()
            }
        }

        if (mouseOverEntities.length < 1) {
            document.body.style.cursor = "default"
        } else {
            document.body.style.cursor = "pointer"
        }
    }

    public handleKeyDown(e: KeyboardEvent) {
        const callback = this.keyToCallback.get(e.key)
        if (callback !== undefined) callback(e)
    }

    public checkMouseDown(e: MouseEvent) {
        for (const component of registry.buttons.components) {
            if (component.isMouseHovering) {
                component.onMouseDown()
            }
        }

        document.body.style.cursor = "default"
    }

    private isMouseOver(entity: number, mouseX: number, mouseY: number) {
        const motion = registry.motions.get(entity)
        const bb = BoundingBox.getBoundingBox(motion.position, motion.scale)

        return (
            mouseX <= bb.right && mouseX >= bb.left &&
            mouseY <= bb.bottom && mouseY >= bb.top
        )
    }
}

export default ScreenSystem