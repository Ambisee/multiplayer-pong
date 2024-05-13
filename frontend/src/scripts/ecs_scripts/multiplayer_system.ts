import { BaseMessage } from "../messages/base_message"
import ConnectMessage from "../messages/connect_message"

class MultiplayerSystem {
    private url: string
    private websocket: WebSocket
    private eventHandlerMap: Map<number, Function[]>

    public constructor(url: string) {
        this.url = url
        this.eventHandlerMap = new Map([
            
        ])
    }

    public init() {
        this.websocket = new WebSocket(this.url)

        this.websocket.addEventListener("message", async (e) => {
            const rawData: Blob = e.data
            const data = await rawData.arrayBuffer()
            const dataBytes = new Uint8Array(data)

            const code = dataBytes[0]
        })

        this.websocket.addEventListener("error", (e) => {
            console.error("Failed to establish a websocket connection.")
            alert("Failed to establish a websocket connection. Please exit the game and try again")
        })

        this.websocket.addEventListener("open", (e) => {
            this.websocket.send((new ConnectMessage()).toMessage())
        })
    }

    public sendMessage<T extends BaseMessage>(message: T) {
        this.websocket.send(message.toMessage()) 
    }
}

export default MultiplayerSystem