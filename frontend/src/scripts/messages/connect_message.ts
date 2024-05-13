import { BaseMessage } from "./base_message"
import { CLIENT_EVENT } from "./message_enum"

class ConnectMessage extends BaseMessage {
    public constructor() {
        super()
    }

    public toMessage(): ArrayBufferLike {
        // CONNECT code = 0
        return new Uint8Array([CLIENT_EVENT.CONNECT])
    }
}

export default ConnectMessage