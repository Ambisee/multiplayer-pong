import { BaseMessage } from "../messages/base_message"
import ConnectMessage from "../messages/connect_message"
import { SERVER_EVENT } from "../messages/message_enum"

type HandlerCallback = (message: Uint8Array) => void

class MultiplayerSystem {
    private url: string
    private websocket: WebSocket
    private eventHandlerMap: HandlerCallback[]

    public isInitialized: boolean


    public constructor(url: string) {
        this.url = url
        this.isInitialized = false
        this.eventHandlerMap = Array(SERVER_EVENT.SERVER_EVENT_COUNT)
    }

    public setHandler(serverEvent: SERVER_EVENT, handlerCallback: HandlerCallback) {
        if (serverEvent < SERVER_EVENT.SERVER_EVENT_COUNT) {
            this.eventHandlerMap[serverEvent] = handlerCallback
        }
    }

    public init() {
        this.websocket = new WebSocket(this.url)

        this.websocket.addEventListener("message", async (e) => {
            const rawData: Blob = e.data
            const data = await rawData.arrayBuffer()
            const dataBytes = new Uint8Array(data)

            const code = dataBytes[0]

            if (code < SERVER_EVENT.SERVER_EVENT_COUNT) {
                this.eventHandlerMap[code](dataBytes)
            } else {
                throw Error("Unrecognized event code.")
            }
        })

        this.websocket.addEventListener("error", (e) => {
            console.error("Failed to establish a websocket connection.")
            alert("Failed to establish a websocket connection. Please exit the game and try again")
        })

        this.websocket.addEventListener("open", (e) => {
            this.websocket.send((new ConnectMessage()).toMessage())
        })

        this.isInitialized = true
    }

    public close() {
        this.websocket.close()
        this.isInitialized = false
    }

    public sendMessage<T extends BaseMessage>(message: T) {
        this.websocket.send(message.toMessage()) 
    }
}

export default MultiplayerSystem
export type { HandlerCallback }