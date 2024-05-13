import { vec2 } from "gl-matrix"
import { BaseMessage } from "./base_message"
import { CLIENT_EVENT } from "./message_enum"
import { shortToArray } from "../helper_scripts/messaging_helpers"

class MotionMessage extends BaseMessage {
    private position: vec2

    public constructor(position: vec2) {
        super()
        this.position = position
    }

    public toMessage(): ArrayBuffer {
        const x = this.position[0]
        const y = this.position[1]

        return new Uint8Array([
            // code
            CLIENT_EVENT.DISCONNECT,
            
            // position
            ...shortToArray(x),
            ...shortToArray(y)
        ])
    }
}

export default MotionMessage