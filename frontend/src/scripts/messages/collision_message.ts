import { vec2 } from "gl-matrix"
import { BaseMessage } from "./base_message"
import { CLIENT_EVENT } from "./message_enum"
import { shortToArray } from "../helper_scripts/messaging_helpers"

class CollisionMessage extends BaseMessage {
    private ball_position: vec2
    private ball_velocity: vec2
    private wall_position: vec2
    private wall_scale: vec2
    private tag: number
    
    public constructor(
        ball_position: vec2,
        ball_velocity: vec2,
        wall_position: vec2,
        wall_scale: vec2,
        tag: number
    ) {
        super()
        this.ball_position = ball_position
        this.ball_velocity = ball_velocity
        this.wall_position = wall_position
        this.wall_scale = wall_scale
        this.tag = tag
    }

    public toMessage(): ArrayBuffer {
        return new Uint8Array([
            // code
            CLIENT_EVENT.COLLISION,

            // ball_pos
            ...shortToArray(this.ball_position[0]),
            ...shortToArray(this.ball_position[1]),

            // ball_vel
            ...shortToArray(this.ball_velocity[0]),
            ...shortToArray(this.ball_velocity[1]),

            // wall_pos
            ...shortToArray(this.wall_position[0]),
            ...shortToArray(this.wall_position[1]),

            // wall_scale
            ...shortToArray(this.wall_scale[0]),
            ...shortToArray(this.wall_scale[1]),

            // tags
            ...shortToArray(this.tag)
        ])
    }
}