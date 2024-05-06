import { vec2, vec4 } from "gl-matrix"
import { Text, Button, Motion, RENDER_LAYER } from "./components"
import RenderSystem from "./render_system"
import { createRectangle, createText } from "./world_init"
import { Entity } from "./ecs"
import { registry } from "./ecs_registry"


class ButtonBuilder {
    public entity: number
    public buttonComponent: Button
    public motionComponent: Motion
    public renderer: RenderSystem
    public buttonColor: vec4
    public textColor: vec4
    public buttonPadding: vec2


    public constructor(renderer: RenderSystem) {
        this.renderer = renderer

        this.entity = Entity.generate()
        this.buttonComponent = registry.buttons.emplace(this.entity)
        this.motionComponent = registry.motions.emplace(this.entity)
        this.buttonColor = vec4.fromValues(1, 1, 1, 0)
        this.textColor = vec4.fromValues(1, 1, 1, 0)
        this.buttonPadding = vec2.fromValues(0, 0)

        registry.nonCollidables.emplace(this.entity)
    }

    public setMotion(position: vec2 = undefined, scale: vec2 = undefined) {
        if (position !== undefined) {
            vec2.set(this.motionComponent.position, position[0], position[1])
        }

        if (scale !== undefined) {
            vec2.set(this.motionComponent.scale, scale[0], scale[1])
        }
    }

    public setColor(buttonColor: vec4, textColor: vec4) {
        vec4.set(this.buttonColor, buttonColor[0], buttonColor[1], buttonColor[2], buttonColor[3])
        vec4.set(this.textColor, textColor[0], textColor[1], textColor[2], textColor[3])
    }

    public setText(content: string, fontscale: number) {
        // Create the text entity
        const textEntity = createText(
            this.renderer,
            this.motionComponent.position,
            content,
            this.textColor,
            fontscale
        )

        // Modify button size if text overflows the button's bounding box
        const textMotion = registry.motions.get(textEntity)
        const renderRequest = registry.renderRequests.get(textEntity)

        renderRequest.renderLayer = RENDER_LAYER.L4
        this.motionComponent.scale[0] = Math.max(this.motionComponent.scale[0], textMotion.scale[0])
        this.motionComponent.scale[1] = Math.max(this.motionComponent.scale[1], textMotion.scale[1])

        this.buttonComponent.textEntity = textEntity
    }

    public setPadding(xPadding: number, yPadding: number) {
        vec2.subtract(this.motionComponent.scale, this.motionComponent.scale, this.buttonPadding)

        vec2.set(this.buttonPadding, xPadding, yPadding)
        vec2.scaleAndAdd(this.motionComponent.scale, this.motionComponent.scale, this.buttonPadding, 2)
    }

    public setBorderedBox(borderThickness: number) {
        this.clearAssociatedEntities()
        
        const motion = this.motionComponent
        const leftBorder = createRectangle(
            vec2.fromValues(motion.position[0] - motion.scale[0] / 2, motion.position[1]),
            vec2.fromValues(borderThickness, motion.scale[1]),
            this.buttonColor
        )
        const rightBorder = createRectangle(
            vec2.fromValues(motion.position[0] + motion.scale[0] / 2, motion.position[1]),
            vec2.fromValues(borderThickness, motion.scale[1]),
            this.buttonColor
        )
        const topBorder = createRectangle(
            vec2.fromValues(motion.position[0], motion.position[1] - motion.scale[1] / 2),
            vec2.fromValues(motion.scale[0], borderThickness),
            this.buttonColor
        )
        const bottomBorder = createRectangle(
            vec2.fromValues(motion.position[0], motion.position[1] + motion.scale[1] / 2),
            vec2.fromValues(motion.scale[0], borderThickness),
            this.buttonColor
        )

        this.buttonComponent.associatedEntities = [leftBorder, rightBorder, topBorder, bottomBorder]
    }

    public setFilledBox() {
        this.clearAssociatedEntities()
        
        const filledBoxEntity = createRectangle(
            this.motionComponent.position,
            this.motionComponent.scale,
            this.buttonColor
        )

        this.buttonComponent.associatedEntities = [filledBoxEntity]
    }

    public setMouseDownCallback(callback: Function) {
        this.buttonComponent.onMouseDown = callback
    }
    
    public setMouseEnterCallback(callback: Function) {
        this.buttonComponent.onMouseEnter = callback
    }
    
    public setMouseExitCallback(callback: Function) {
        this.buttonComponent.onMouseExit = callback
    }

    public setRenderLayer(renderLayer: RENDER_LAYER) {
        if (!registry.renderRequests.has(this.buttonComponent.textEntity)) {
            throw Error("No text entity associated")
        }
        registry.renderRequests.get(this.buttonComponent.textEntity).renderLayer = RENDER_LAYER.U4

        for (const e of this.buttonComponent.associatedEntities) {
            registry.renderRequests.get(e).renderLayer = renderLayer
        }
    }

    public getButtonEntity() {
        return this.entity
    }

    private clearAssociatedEntities() {
        if (this.buttonComponent.associatedEntities.length === 0) {
            return
        }

        this.buttonComponent.associatedEntities.forEach((value) => {
            registry.removeAllComponentsOf(value)
        })

        this.buttonComponent.associatedEntities.length = 0
    }
}

export { ButtonBuilder }