import RenderSystem from "./render_system"
import WorldSystem from "./world_system"
import PhysicSystem from "./physics_system"
import { staticManager } from "../helper_scripts/static_manager"

const canvasElementID = "#webgl-context"

function getGL() {
    const canvasElement: HTMLCanvasElement | null = document.querySelector(canvasElementID)
    if (canvasElement === null) throw Error(`ERROR: Canvas element with id: ${canvasElementID} not found`)

    const gl: WebGL2RenderingContext | null = canvasElement.getContext("webgl2")
    if (gl === null) throw Error(`ERROR: Failed to get WebGL context from the canvas element`)

    gl.canvas.width = window.innerWidth
    gl.canvas.height = window.innerHeight

    window.addEventListener("resize", (e) => {
        gl.canvas.width = window.innerWidth
        gl.canvas.height = window.innerHeight
    })

    return gl
}

function loop(
    renderer: RenderSystem,
    world: WorldSystem,
    physics: PhysicSystem,
    previousTime: number
) {
    const timeElapsed = Date.now() - previousTime

    world.step(timeElapsed)
    
    if (!world.isPaused) {
        physics.step(timeElapsed)
        world.handleCollision(timeElapsed)
    }

    const newPreviousTime = Date.now()

    renderer.render()
    window.requestAnimationFrame(() => loop(
        renderer,
        world,
        physics,
        newPreviousTime
    ))
}

async function main() {
    const gl: WebGL2RenderingContext | null = getGL()
    if (gl === null) return

    await staticManager.retrieve()

    const renderer: RenderSystem = new RenderSystem(gl, gl.canvas.width, gl.canvas.height)
    renderer.init()

    const world: WorldSystem = new WorldSystem(renderer)
    const physics: PhysicSystem = new PhysicSystem()

    loop(renderer, world, physics, Date.now())
}

main()