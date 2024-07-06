import { vec2, vec4 } from "gl-matrix"
import { registry } from "./ecs_registry"
import { Entity } from "./ecs"
import { EFFECTS, EndGameWall, GEOMETRY, RENDER_LAYER, Text } from "./components"
import RenderSystem from "./render_system"
import { setTextContent } from "../helper_scripts/component_helpers"

function createRectangle(position: vec2, scale: vec2, color: vec4): number {
    const entity = Entity.generate()

    const motion = registry.motions.emplace(entity)
    motion.position = position
    motion.scale = scale

    const renderRequest = registry.renderRequests.emplace(entity)
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
    const leftWall = createWall(
        vec2.fromValues(-0.5, renderer.gl.canvas.height / 2),
        vec2.fromValues(1, renderer.gl.canvas.height)
    )

    // Right wall
    const rightWall = createWall(
        vec2.fromValues(renderer.gl.canvas.width + 0.5, renderer.gl.canvas.height / 2),
        vec2.fromValues(1, renderer.gl.canvas.height)
    )

    registry.endGameWalls.insert(leftWall, new EndGameWall(true))
    registry.endGameWalls.insert(rightWall, new EndGameWall(false))

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

    registry.balls.emplace(entity)

    return entity
}

function createText(renderer: RenderSystem, position: vec2, content: string, color: vec4, scale: number) {
    const entity = Entity.generate()

    const motion = registry.motions.emplace(entity)
    const text = registry.texts.emplace(entity)
    const renderRequest = registry.renderRequests.emplace(entity)

    motion.position = position
    text.scale = scale
    setTextContent(renderer, entity, content)

    renderRequest.effect = EFFECTS.TEXT
    renderRequest.geometry = GEOMETRY.TEXT
    renderRequest.renderLayer = RENDER_LAYER.L4
    renderRequest.color = vec4.clone(color)

    return entity
}

function createGameState(isMultiplayer: boolean = false) {
    const entity = Entity.generate()

    const gameState = registry.gameStates.emplace(entity)
    gameState.isGamePlaying = false
    gameState.isPaused = false
    gameState.isMultiplayer = isMultiplayer

    return gameState
}

function createDelayedCallback(callback: Function, timeMs: number) {
    const entity = Entity.generate()
    
    const delayedCallback = registry.delayedCallbacks.emplace(entity)
    delayedCallback.callback = callback
    delayedCallback.timeMs = timeMs

    return entity
}

export {
    createRectangle, createEllipse, createWall, createScreenBoundary, createBall,
    createText, createDelayedCallback, createGameState
}