
import { GAME_SCREEN } from "./components"
import { BaseScreen, ButtonCallback } from "../screens/base_screen"
import MainMenu from "../screens/main_menu"
import WorldSystem from "./world_system"
import { registry } from "./ecs_registry"
import { BoundingBox } from "./common"
import PauseMenu from "../screens/pause_menu"
import PreGameScreen from "../screens/pre_game_screen"
import PostGameScreen from "../screens/post_game_screen"
import {GAME_WINDOW_HEIGHT, GAME_WINDOW_WIDTH} from "../config"

type ScreenMap = Map<GAME_SCREEN, BaseScreen>

interface MousePosition {
    x: number 
    y: number
}

class ScreenSystem {
    // private tabIndex: number
    private windowWidth: number
    private windowHeight: number

    public screenEntities: number[]
    public buttonToCallbacksMap: ButtonCallback[]
    public keyToCallback: Map<string, (e: KeyboardEvent) => void>

    public gameScreenToRender: ScreenMap

    public constructor(
        windowWidth: number = GAME_WINDOW_WIDTH, 
        windowHeight: number = GAME_WINDOW_HEIGHT
    ) {
        this.windowWidth = windowWidth
        this.windowHeight = windowHeight

        this.screenEntities = []
        this.buttonToCallbacksMap = []
        this.keyToCallback = new Map()
        
        this.gameScreenToRender = new Map()
        
        this.gameScreenToRender.set(
            GAME_SCREEN.MAIN_MENU, new MainMenu(this.screenEntities, this.buttonToCallbacksMap, this.keyToCallback))
        this.gameScreenToRender.set(
            GAME_SCREEN.PAUSE_MENU, new PauseMenu(this.screenEntities, this.buttonToCallbacksMap, this.keyToCallback))
        this.gameScreenToRender.set(
            GAME_SCREEN.PRE_GAME_SCREEN, new PreGameScreen(this.screenEntities, this.buttonToCallbacksMap, this.keyToCallback))
        this.gameScreenToRender.set(
            GAME_SCREEN.POST_GAME_SCREEN, new PostGameScreen(this.screenEntities, this.buttonToCallbacksMap, this.keyToCallback))
    }

    public getMousePositionOnCanvas(e: MouseEvent) {
        return {
            x: e.x - window.innerWidth / 2 + this.windowWidth / 2,
            y: e.y - window.innerHeight / 2 + this.windowHeight / 2
        }
    }

    public checkMouseOverUI(e: MouseEvent) {
        // Array to collect the entities the mouse is hovering over
        const mouseOverEntities = []
        const {x, y} = this.getMousePositionOnCanvas(e)

        for (let i = 0; i < registry.buttons.length(); i++) {
            const entity = registry.buttons.entities[i]
            const component = registry.buttons.components[i]

            if (this.isMouseOver(entity, x, y)) {
                // this.tabIndex = i // Assuming that the number of buttons matches the length of the buttonToCallbacksMap array
                mouseOverEntities.push(entity)
                component.isMouseHovering = true
                component.onMouseEnter(e)
            } else {
                component.isMouseHovering = false
                component.onMouseExit(e)
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

        // if (e.key == "Tab") {
        //     if (this.tabIndex === -1) {
        //         this.tabIndex = 0
        //     } else {
        //         const prevButton = registry.buttons.get(this.buttonToCallbacksMap[this.tabIndex].entity)
                
        //         prevButton.onMouseExit()
        //         prevButton.isMouseHovering = false
                
        //         this.tabIndex = (this.tabIndex + 1) % this.buttonToCallbacksMap.length
        //     }
            
        //     const curButton = registry.buttons.get(this.buttonToCallbacksMap[this.tabIndex].entity)
        //     curButton.onMouseEnter()
        //     curButton.isMouseHovering = true
        // }
    }

    public checkMouseDown(e: MouseEvent) {
        if (e.button !== 0) {
            return
        }

        const {x, y} = this.getMousePositionOnCanvas(e)

        for (let i = 0; i < registry.buttons.length(); i++) {
            const component = registry.buttons.components[i]
            const entity = registry.buttons.entities[i]

            if (component.isMouseHovering && this.isMouseOver(entity, x, y)) {
                component.onMouseDown(e)
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