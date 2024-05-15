import { vec2 } from "gl-matrix"
import { BaseMessage } from "./base_message"
import { CLIENT_EVENT } from "./message_enum"
import { shortToArray } from "../helper_scripts/messaging_helpers"

class MotionMessage extends BaseMessage {
    private velocity: vec2

    public constructor(velocity: vec2) {
        super()
        this.velocity = velocity
    }

    public toMessage(): Uint8Array {
        const x = this.velocity[0]
        const y = this.velocity[1]

        return new Uint8Array([
            // code
            CLIENT_EVENT.MOTION,
            
            // position
            ...shortToArray(x),
            ...shortToArray(y)
        ])
    }
}

export default MotionMessage