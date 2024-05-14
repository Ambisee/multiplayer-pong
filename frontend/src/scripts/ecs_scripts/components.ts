import { BoundingBox } from "./common"
import { Component, ComponentContainer } from "./ecs"
import { vec2, vec3, vec4 } from "gl-matrix"

class Motion extends Component {
    public scale: vec2
    public rotation: number
    public position: vec2

    public positionalVel: vec2
    public rotationalVel: number

    public constructor(
        scale: vec2             = vec2.fromValues(0, 0),
        rotation: number        = 0,
        position: vec2          = vec2.fromValues(0, 0),
        positionalVel: vec2    = vec2.fromValues(0, 0),
        rotationalVel: number  = 0,
    ) {
        super()

        this.scale = scale
        this.rotation = rotation
        this.position = position
        this.positionalVel = positionalVel
        this.rotationalVel = rotationalVel
    }
}

class Player extends Component {}
class Opponent extends Component {}
class Ball extends Component {}
class NonCollidable extends Component {}
class Wall extends Component {}

class Text extends Component {
    public content: string
    
    /** 
     * Scaling factor applied to the default fontsize.
     * i.e. the resulting fontsize is `scale * 64px` (64px is the default fontsize)
     */
    public scale: number

    public constructor(
        content: string             = "",
        scale: number               = 1
    ) {
        super()

        this.content = content
        this.scale = scale
    }
}

class EndGameWall extends Component {
    public isLeft: boolean

    public constructor(isLeft: boolean = false) {
        super()

        this.isLeft = isLeft
    }
}

class Button extends Component {
    public isMouseHovering: boolean
    public textEntity: number
    public associatedEntities: number[]
    public onMouseDown: Function
    public onMouseEnter: Function
    public onMouseExit: Function

    public constructor(
        isMouseHovering: boolean = false,
        textEntity: number = NaN,
        associatedEntities: number[] = [],
        onMouseDown: Function = () => {},
        onMouseEnter: Function = () => {},
        onMouseExit: Function = () => {}
    ) {
        super()

        this.isMouseHovering = isMouseHovering
        this.textEntity = textEntity
        this.associatedEntities = associatedEntities
        this.onMouseDown = onMouseDown
        this.onMouseEnter = onMouseEnter
        this.onMouseExit = onMouseExit
    }
}

class Collision extends Component {
    public entity: number
    public entityOther: number

    public constructor(entity: number, entity_other: number) {
        super()

        this.entity = entity
        this.entityOther = entity_other
    }
}

class ScreenState extends Component {
    /** The degree of darkening of the screen. 
     * Value must be a float between 0 and 1
     * - 0 -> no darkening
     * - 1 -> maximum darkening (everything becomes black)
    */
    public darkenScreenFactor: number

    public constructor(darkenScreenFactor: number = 0) {
        super()

        this.darkenScreenFactor = darkenScreenFactor
    }
}

class DelayedCallback extends Component {
    public timeMs: number
    public isStarted: boolean
    public callback: Function

    public constructor(
        timeMs: number = 0,
        callback: Function = () => {},
        isStarted: boolean = true
    ) {
        super()

        this.timeMs = timeMs
        this.callback = callback
        this.isStarted = true
    }
}

enum GEOMETRY {
    RECTANGLE = 0,
    CIRCLE = RECTANGLE + 1,
    TEXT = CIRCLE + 1,
    SCREEN = TEXT + 1,
    GEOMETRY_COUNT = SCREEN + 1
}

enum EFFECTS {
    TRIANGLE = 0,
    TEXT = TRIANGLE + 1,
    SCREEN = TEXT + 1,
    EFFECTS_COUNT = SCREEN + 1,
}

enum TEXTURE {
    TEXTURE_COUNT = 0
}

enum RENDER_LAYER {
    // Lower layers - Rendered on the framebuffer
    L0 = 0,
    L1 = L0 + 1,
    L2 = L1 + 1,
    L3 = L2 + 1,
    L4 = L3 + 1,

    // Upper layers - Rendered on the screen after the framebuffer
    U0 = L4 + 1,
    U1 = U0 + 1,
    U2 = U1 + 1,
    U3 = U2 + 1,
    U4 = U3 + 1,

    RENDER_LAYER_COUNT = U4 + 1,
}

enum GAME_SCREEN {
    MAIN_MENU = 0,
    GAME_SCREEN = MAIN_MENU + 1,
    PRE_GAME_SCREEN = GAME_SCREEN + 1,
    POST_GAME_SCREEN = PRE_GAME_SCREEN + 1,
    PAUSE_MENU = POST_GAME_SCREEN + 1,
    END_SCREEN = PAUSE_MENU + 1,
    GAME_SCREEN_COUNT = END_SCREEN + 1
}

enum ALIGNMENT {
    LEFT = 0,
    CENTER = LEFT + 1,
    RIGHT = CENTER + 1
}

class RenderRequest extends Component {
    public effect: EFFECTS
    public geometry: GEOMETRY
    public renderLayer: RENDER_LAYER
    public color: vec4
    
    public constructor(
        effect: EFFECTS = EFFECTS.TRIANGLE, 
        geometry: GEOMETRY = GEOMETRY.RECTANGLE, 
        renderLayer: RENDER_LAYER = RENDER_LAYER.L0,
        color: vec4 = vec4.fromValues(0, 0, 0, 0)
    ) {
        super()
        this.effect = effect
        this.geometry = geometry
        this.renderLayer = renderLayer
        this.color = color
    }
}

export {
    Motion, Player, RenderRequest, NonCollidable, Collision, Wall, Ball, Opponent, 
    Text, Button, ScreenState, EndGameWall, DelayedCallback,
    GEOMETRY, EFFECTS, TEXTURE, ALIGNMENT, RENDER_LAYER, GAME_SCREEN
}