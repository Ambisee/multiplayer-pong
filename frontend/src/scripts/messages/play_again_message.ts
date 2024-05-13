import { BaseMessage } from "./base_message"
import { CLIENT_EVENT } from "./message_enum"

class PlayAgainMessage extends BaseMessage {
    public constructor() {
        super()
    }

    public toMessage(): ArrayBuffer {
        return new Uint8Array([CLIENT_EVENT.PLAY_AGAIN])
    }
}