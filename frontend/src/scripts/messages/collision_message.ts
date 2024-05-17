import { vec2 } from "gl-matrix"
import { BaseMessage } from "./base_message"
import { CLIENT_EVENT } from "./message_enum"
import { shortToArray } from "../helper_scripts/messaging_helpers"

class CollisionMessage extends BaseMessage {
    public ballPosition: vec2
    public ballVelocity: vec2
    public wallPosition: vec2
    public wallScale: vec2
    public tag: number
    
    public constructor(
        ballPosition: vec2,
        ballVelocity: vec2,
        wallPosition: vec2,
        wallScale: vec2,
        tag?: number
    ) {
        super()
        this.ballPosition = ballPosition
        this.ballVelocity = ballVelocity
        this.wallPosition = wallPosition
        this.wallScale = wallScale
        this.tag = tag
    }

    public toMessage(): Uint8Array {
        const payloadArray = [
            // code
            CLIENT_EVENT.COLLISION,

            // ball_pos
            ...shortToArray(this.ballPosition[0]),
            ...shortToArray(this.ballPosition[1]),

            // ball_vel
            ...shortToArray(this.ballVelocity[0]),
            ...shortToArray(this.ballVelocity[1]),

            // wall_pos
            ...shortToArray(this.wallPosition[0]),
            ...shortToArray(this.wallPosition[1]),

            // wall_scale
            ...shortToArray(this.wallScale[0]),
            ...shortToArray(this.wallScale[1]),
        ]

        if (this.tag !== undefined) {
            payloadArray.push(this.tag & 0xFF)
        }
        
        return new Uint8Array(payloadArray)
    }
}

export default CollisionMessage