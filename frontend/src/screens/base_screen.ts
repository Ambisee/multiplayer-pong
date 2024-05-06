import { registry } from "../ecs_scripts/ecs_registry"
import RenderSystem from "../ecs_scripts/render_system"
import WorldSystem from "../ecs_scripts/world_system"

interface ButtonCallback {
    entity: number,
    onMouseDown: (e: MouseEvent, ...args: unknown[]) => void,
    onMouseEnter: (e: MouseEvent, ...args: unknown[]) => void,
    onMouseExit: (e: MouseEvent, ...args: unknown[]) => void
}

class BaseScreen {
    public screenEntities: number[] // A reference to an array that stores the screen entity ids
    public buttonToCallbacksMap: ButtonCallback[] // A reference to an array that stores the 
    public keyToCallback: Map<string, (e: KeyboardEvent) => void> // A reference to a map between keycodes and callbacks
    protected world: WorldSystem

    public constructor(
        screenEntities: number[], 
        buttonToCallbacksMap: ButtonCallback[], 
        keyToCallback: Map<string, (e: KeyboardEvent) => void>
    ) {
        this.screenEntities = screenEntities
        this.buttonToCallbacksMap = buttonToCallbacksMap
        this.keyToCallback = keyToCallback
    }
    
    public init(world: WorldSystem, renderer: RenderSystem) {
        this.initializeScreenEntities(world, renderer)
        this.bindUIElementCallbacks()
        this.bindKeyboardCallbacks(world, renderer)
    }

    protected initializeScreenEntities(world: WorldSystem, renderer: RenderSystem) {
        // Clear the previous screen entities
        this.clearScreenEntities()

        // ...
    }
    
    protected bindUIElementCallbacks() {
        // Exit function when there are no callback in the list
        if (this.buttonToCallbacksMap.length < 1) {
            return
        }

        // Bind the callbacks to each button
        for (const {entity, onMouseDown, onMouseEnter, onMouseExit} of this.buttonToCallbacksMap) {
            const button = registry.buttons.get(entity)
            button.onMouseDown = onMouseDown
            button.onMouseEnter = onMouseEnter
            button.onMouseExit = onMouseExit
        }
    }

    protected bindKeyboardCallbacks(world: WorldSystem, renderer: RenderSystem) {
    
    }
    
    protected cleanupButtonEntity(entity: number) {
        const button = registry.buttons.get(entity)

        // Clear the text of the button
        registry.removeAllComponentsOf(button.textEntity)
        
        // Clear other elements of the button
        for (const associatedEntity of button.associatedEntities) {
            registry.removeAllComponentsOf(associatedEntity)
        }
    }

    protected clearScreenEntities() {
        // Remove all components associated with the screen's entities
        for (const entity of this.screenEntities) {
            if (registry.buttons.has(entity)) {
                this.cleanupButtonEntity(entity)
            }

            registry.removeAllComponentsOf(entity)
        }

        // Clear the screen entities array (since this.screenEntities is a reference, we can't do `... = []`)
        this.screenEntities.length = 0
        this.buttonToCallbacksMap.length = 0
    }

    public cleanup() {
        // Remove all components associated with the screen entities
        this.clearScreenEntities()

        // Remove all of the keyboard bindings
        this.keyToCallback.clear()
    }
}

export { BaseScreen }
export type { ButtonCallback }