import RenderSystem from "./ecs_scripts/render_system"
import WorldSystem from "./ecs_scripts/world_system"
import PhysicSystem from "./ecs_scripts/physics_system"
import { staticManager } from "./helper_scripts/static_manager"
import { GAME_WINDOW_WIDTH, GAME_WINDOW_HEIGHT } from "./config"
import AISystem from "./ecs_scripts/ai_system"

const canvasElementID = "#webgl-context"
const siteState = {isStarted: false}

function getGL() {
    const canvasElement: HTMLCanvasElement | null = document.querySelector(canvasElementID)
    if (canvasElement === null) throw Error(`ERROR: Canvas element with id: ${canvasElementID} not found`)

    const gl: WebGL2RenderingContext | null = canvasElement.getContext("webgl2")
    if (gl === null) throw Error(`ERROR: Failed to get WebGL context from the canvas element`)

    // We want the dimensions to be of 1080p -> 16 : 9
    // const minLengthPerPixel = Math.min(window.innerWidth / 16, window.innerHeight / 9)
    // gl.canvas.width = minLengthPerPixel * 16
    // gl.canvas.height = minLengthPerPixel * 9

    gl.canvas.width = GAME_WINDOW_WIDTH
    gl.canvas.height = GAME_WINDOW_HEIGHT

    // gl.canvas.width = window.innerWidth
    // gl.canvas.height = window.innerHeight

    // window.addEventListener("resize", (e) => {
    //     gl.canvas.width = window.innerWidth
    //     gl.canvas.height = window.innerHeight
    // })

    return gl
}

function loop(
    renderer: RenderSystem,
    world: WorldSystem,
    physics: PhysicSystem,
    ai: AISystem,
    previousTime: number
) {
    const timeElapsed = Date.now() - previousTime

    world.step(timeElapsed)

    if (!world.isPaused) {
        ai.step(timeElapsed)
        physics.step(timeElapsed)
        world.handleCollision(timeElapsed)
        world.pushMultiplayerMessages(timeElapsed)
    }

    const newPreviousTime = Date.now()

    renderer.render()
    window.requestAnimationFrame(() => loop(
        renderer,
        world,
        physics,
        ai,
        newPreviousTime
    ))
}

async function initializeGame() {
    const gl: WebGL2RenderingContext | null = getGL()
    if (gl === null) return

    await staticManager.retrieve()

    const renderer: RenderSystem = new RenderSystem(gl, gl.canvas.width, gl.canvas.height)
    renderer.init()

    const world: WorldSystem = new WorldSystem(renderer)
    const physics: PhysicSystem = new PhysicSystem()
    const ai: AISystem = new AISystem()

    loop(renderer, world, physics, ai, Date.now())
}

function switchToGameWindow() {
    const fullscreenNoticeElements = document.querySelectorAll(".fullscreen-notice")
    for (let i = 0; i < fullscreenNoticeElements.length; i++) {
        fullscreenNoticeElements[i].classList.add("hidden")
    }

    document.getElementById("webgl-context").classList.remove("hidden")
}

async function main() {
    // Using parcel to access environment variables
    if (process.env.ENV === "dev") {
        switchToGameWindow()
        siteState.isStarted = true
        initializeGame()
        return
    }

    if (window.innerWidth >= GAME_WINDOW_WIDTH && window.innerHeight >= GAME_WINDOW_HEIGHT) {
        switchToGameWindow()
        siteState.isStarted = true
        initializeGame()
        return
    }
    
    const resizeObserver = new ResizeObserver((entries) => {
        const body = document.querySelector("body")
        if (body.clientWidth >= GAME_WINDOW_WIDTH && body.clientHeight >= GAME_WINDOW_HEIGHT) {
            switchToGameWindow()
            siteState.isStarted = true
            initializeGame()
            resizeObserver.unobserve(document.querySelector("body"))
        }
    })

    resizeObserver.observe(document.querySelector("body"))
}

main()