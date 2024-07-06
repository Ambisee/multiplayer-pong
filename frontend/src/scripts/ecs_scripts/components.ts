import { INITIAL_BALL_VEL_MAG } from "../config"
import { BoundingBox, clamp } from "./common"
import { Component } from "./ecs"
import { vec2, vec3, vec4 } from "gl-matrix"

type NDVector = number | vec2 | vec3 | vec4

class Motion extends Component {
    public scale: vec2
    public rotation: number
    public position: vec2
    public prevPosition: vec2

    public maxVelMag: number
    public positionalVel: vec2
    public positionalAccel: vec2
    public rotationalVel: number

    public constructor(
        scale: vec2             = vec2.fromValues(0, 0),
        rotation: number        = 0,
        position: vec2          = vec2.fromValues(0, 0),
        positionalVel: vec2     = vec2.fromValues(0, 0),
        maxVelMag: number       = Infinity,
        positionalAccel: vec2   = vec2.fromValues(0, 0),
        rotationalVel: number   = 0,
    ) {
        super()

        this.scale = scale
        this.rotation = rotation
        this.position = position
        this.prevPosition = position
        this.positionalVel = positionalVel
        this.maxVelMag = maxVelMag
        this.positionalAccel = positionalAccel
        this.rotationalVel = rotationalVel
    }
}

class Player extends Component {}
class Opponent extends Component {}
class Ball extends Component {}
class NonCollidable extends Component {}
class Wall extends Component {}

class AI extends Component {
    public type: AI_TYPE

    public constructor(type: AI_TYPE = AI_TYPE.OPPONENT) {
        super()

        this.type = type
    }
}

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

class FieldEffect extends Component {
    public type: FIELD_EFFECTS
    public cleanUpCallback: () => void

    public constructor(type: FIELD_EFFECTS, cleanUpCallback: () => void = () => {}) {
        super()

        this.type = type
        this.cleanUpCallback = cleanUpCallback
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

class BaseAnimation extends Component {
    // Instance-specific constants
    public callback: (value: NDVector) => void
    public from: NDVector
    public to: NDVector
    public duration: number
    public iterations: number
    public timingFunction: ANIMATION_TIMING_FUNCTION
    public direction: ANIMATION_DIRECTION

    // Instance-maintained values
    public internalTime: number
    public internalIteration: number
    public isPaused: boolean

    public constructor(
        callback: (value: NDVector) => void = () => {}, 
        from: NDVector = undefined,
        to: NDVector = undefined,
        duration: number = 1000,
        iterations: number = 1,
        timingFunction: ANIMATION_TIMING_FUNCTION = ANIMATION_TIMING_FUNCTION.EASE,
        direction: ANIMATION_DIRECTION = ANIMATION_DIRECTION.FORWARD,
        isPaused: boolean = false
    ) {
        super()

        this.callback = callback
        this.from = from
        this.to = to
        this.duration = duration
        this.iterations = iterations
        this.timingFunction = timingFunction
        this.direction = direction
        
        this.isPaused = isPaused
        this.internalTime = 0
        this.internalIteration = 0
    }

    public interpolate(alpha: number) {}
}

class NumberAnimation extends BaseAnimation {
    public callback: (value: number) => void
    public from: number
    public to: number

    public constructor(
        callback: (value: number) => void = () => {}, 
        from: number = undefined,
        to: number = undefined,
        duration: number = 1000,
        iterations: number = 1,
        timingFunction: ANIMATION_TIMING_FUNCTION = ANIMATION_TIMING_FUNCTION.EASE,
        direction: ANIMATION_DIRECTION = ANIMATION_DIRECTION.FORWARD,
        isPaused: boolean = false
    ) {
        super(callback, from, to, duration, iterations, timingFunction, direction, isPaused)
    }

    public interpolate(alpha: number) {
        const y = (1 - alpha) * this.from + (alpha) * this.to
        this.callback(y)
    }
}

class Vec2Animation extends BaseAnimation {
    public callback: (value: vec2) => void
    public from: vec2
    public to: vec2

    public constructor(
        callback: (value: vec2) => void = () => {}, 
        from: vec2 = undefined,
        to: vec2 = undefined,
        duration: number = 1000,
        iterations: number = 1,
        timingFunction: ANIMATION_TIMING_FUNCTION = ANIMATION_TIMING_FUNCTION.EASE,
        direction: ANIMATION_DIRECTION = ANIMATION_DIRECTION.FORWARD,
        isPaused: boolean = false
    ) {
        super(callback, from, to, duration, iterations, timingFunction, direction, isPaused)
    }

    public interpolate(alpha: number) {
        const y = vec2.create()
        vec2.add(
            y, vec2.scale(vec2.create(), this.from, 1 -alpha),
            vec2.scale(vec2.create(), this.to, alpha))
        
        this.callback(y)
    }
}

class Vec3Animation extends BaseAnimation {
    public callback: (value: vec3) => void
    public from: vec3
    public to: vec3

    public constructor(
        callback: (value: vec3) => void = () => {}, 
        from: vec3 = undefined,
        to: vec3 = undefined,
        duration: number = 1000,
        iterations: number = 1,
        timingFunction: ANIMATION_TIMING_FUNCTION = ANIMATION_TIMING_FUNCTION.EASE,
        direction: ANIMATION_DIRECTION = ANIMATION_DIRECTION.FORWARD,
        isPaused: boolean = false
    ) {
        super(callback, from, to, duration, iterations, timingFunction, direction, isPaused)
    }

    public interpolate(alpha: number) {
        const y = vec3.create()
        vec3.add(
            y, vec3.scale(vec3.create(), this.from, 1 -alpha),
            vec3.scale(vec3.create(), this.to, alpha))
        
        this.callback(y)
    }
}

class Vec4Animation extends BaseAnimation {
    public callback: (value: vec4) => void
    public from: vec4
    public to: vec4

    public constructor(
        callback: (value: vec4) => void = () => {}, 
        from: vec4 = undefined,
        to: vec4 = undefined,
        duration: number = 1000,
        iterations: number = 1,
        timingFunction: ANIMATION_TIMING_FUNCTION = ANIMATION_TIMING_FUNCTION.EASE,
        direction: ANIMATION_DIRECTION = ANIMATION_DIRECTION.FORWARD,
        isPaused: boolean = false
    ) {
        super(callback, from, to, duration, iterations, timingFunction, direction, isPaused)
    }

    public interpolate(alpha: number) {
        const y = vec4.create()
        vec4.add(
            y, vec4.scale(vec4.create(), this.from, 1 - alpha),
            vec4.scale(vec4.create(), this.to, alpha))

        this.callback(y)
    }
}

class GameState extends Component {
    public isPaused: boolean            // Defines whether the game is paused
    public isGamePlaying: boolean       // Defines whether the game is playing (countdown phase => isGamePlaying = true; isPaused = false)
    public isMultiplayer: boolean       // Defines whether the game is in multiplayer mode

    public currentBallVelMag: number    // Defines the current ball velocity

    public constructor(
        isPaused: boolean = false, 
        isGamePlaying: boolean = false, 
        isMultiplayer: boolean = false,
        currentBallVelMag: number = 1,
    ) {
        super()
        
        this.isPaused = isPaused
        this.isGamePlaying = isGamePlaying
        this.isMultiplayer = isMultiplayer
        this.currentBallVelMag = currentBallVelMag
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
    public isCancelled: boolean
    public callback: Function

    public constructor(
        timeMs: number = 0,
        callback: Function = () => {},
        isCancelled: boolean = false
    ) {
        super()

        this.timeMs = timeMs
        this.callback = callback
        this.isCancelled = isCancelled
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

enum DIRECTION {
    STOP = 0,
    UP = STOP + 1,
    DOWN = UP + 1
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

enum AI_TYPE {
    NONE = 0,
    OPPONENT = NONE + 1,
    AI_TYPE_COUNT = OPPONENT + 1
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

enum FIELD_EFFECTS {
    // Buff
    POWER_PADDLE = 0,
    DAMPENING_FIELD = POWER_PADDLE + 1,
    SPIN_SHOTS = DAMPENING_FIELD + 1,
    
    // Debuff
    SHRINKING_PADDLE = SPIN_SHOTS + 1,
    HALLUCINATION = SHRINKING_PADDLE + 1,
    
    // Field Modifier
    NO_EFFECT = HALLUCINATION + 1,
    LOW_FRICTION = NO_EFFECT + 1,
    SHOT_IN_THE_DARK = LOW_FRICTION + 1,
    FIELD_EFFECTS_COUNT = SHOT_IN_THE_DARK + 1
}

enum ANIMATION_DIRECTION {
    FORWARD = 0,
    ALTERNATE = FORWARD + 1,
    ANIMATION_DIRECTION_COUNT = ALTERNATE + 1,
}

enum ANIMATION_TIMING_FUNCTION {
    EASE = 0,
    LINEAR = EASE + 1,
    ANIMATION_TIMING_FUNCTION_COUNT = LINEAR + 1
}

enum GAME_MODE {
    SINGLEPLAYER = 0,
    TWOPLAYER = SINGLEPLAYER + 1,
    MULTIPLAYER = TWOPLAYER + 1,
    GAME_MODE_COUNT = MULTIPLAYER + 1
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
    Text, Button, ScreenState, EndGameWall, DelayedCallback, AI, FieldEffect, GameState,
    BaseAnimation, NumberAnimation, Vec2Animation, Vec3Animation, Vec4Animation
}

export {
    AI_TYPE, GEOMETRY, EFFECTS, TEXTURE, ALIGNMENT, RENDER_LAYER, GAME_SCREEN, GAME_MODE,
    DIRECTION, FIELD_EFFECTS, ANIMATION_TIMING_FUNCTION, ANIMATION_DIRECTION
}

export {type NDVector}