import { vec2, vec4 } from "gl-matrix"
import { registry } from "./ecs_registry"
import { Entity } from "./ecs"
import { EFFECTS, GEOMETRY, RENDER_LAYER, Text } from "./components"
import RenderSystem from "./render_system"

function createRectangle(position: vec2, scale: vec2, color: vec4): number {
    let entity = Entity.generate()

    let motion = registry.motions.emplace(entity)
    motion.position = position
    motion.scale = scale

    let renderRequest = registry.renderRequests.emplace(entity)
    renderRequest.color = color

    return entity
}

function createEllipse(position: vec2, scale: vec2, color: vec4): number {
    let entity = Entity.generate()

    let motion = registry.motions.emplace(entity)
    motion.position = position
    motion.scale = scale

    let renderRequest = registry.renderRequests.emplace(entity)
    renderRequest.geometry = GEOMETRY.CIRCLE
    renderRequest.color = color

    return entity
}

function createWall(position: vec2, scale: vec2) {
    let entity = Entity.generate()

    let motion = registry.motions.emplace(entity)
    let wall = registry.walls.emplace(entity)

    motion.position = position
    motion.scale = scale

    return entity
}

function createScreenBoundary(renderer: RenderSystem) {
    // Left wall
    createWall(
        vec2.fromValues(-0.5, renderer.gl.canvas.height / 2),
        vec2.fromValues(1, renderer.gl.canvas.height)
    )

    // Right wall
    createWall(
        vec2.fromValues(renderer.gl.canvas.width + 0.5, renderer.gl.canvas.height / 2),
        vec2.fromValues(1, renderer.gl.canvas.height)
    )

    // Top wall
    createWall(
        vec2.fromValues(renderer.gl.canvas.width / 2, -1),
        vec2.fromValues(renderer.gl.canvas.width, 2)
    )

    // Bottom wall
    createWall(
        vec2.fromValues(renderer.gl.canvas.width / 2, renderer.gl.canvas.height + 1),
        vec2.fromValues(renderer.gl.canvas.width, 1)
    )
}

function createBall(position: vec2, scale: vec2, color: vec4) {
    let entity = Entity.generate()
    let motion = registry.motions.emplace(entity)
    
    motion.position = position
    motion.scale = scale

    let renderRequest = registry.renderRequests.emplace(entity)
    renderRequest.geometry = GEOMETRY.CIRCLE
    renderRequest.effect = EFFECTS.TRIANGLE
    renderRequest.renderLayer = RENDER_LAYER.L0
    renderRequest.color = color

    return entity
}

function createText(renderer: RenderSystem, position: vec2, content: string, color: vec4, scale: number) {
    const entity = Entity.generate()

    const motion = registry.motions.emplace(entity)
    motion.position = position
    
    let overallWidth = 0
    let overallHeight = 0
    
    let glyph = renderer.characterMaps.get(content[0])
    if (glyph === undefined) throw Error(`Unrecognized character: ${content[0]} - ${content.charCodeAt(0)}`)
    
    for (const ch of content) {
        glyph = renderer.characterMaps.get(content[0])
        if (glyph === undefined) throw Error(`Unrecognized character: ${content[0]} - ${content.charCodeAt(0)}`)
        
        overallWidth += glyph.advance * scale
        overallHeight = Math.max(glyph.size[1] * scale, overallHeight)
    }
            
    motion.scale = vec2.fromValues(overallWidth, overallHeight)
    const text = registry.texts.insert(entity, new Text(content, color, scale))
    const renderRequest = registry.renderRequests.emplace(entity)

    renderRequest.effect = EFFECTS.TEXT
    renderRequest.geometry = GEOMETRY.TEXT
    renderRequest.renderLayer = RENDER_LAYER.L2
    renderRequest.color = vec4.create()

    return entity
}

export {
    createRectangle, createEllipse, createWall, createScreenBoundary, createBall,
    createText
}