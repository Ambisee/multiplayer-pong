class MultiplayerSystem {
    public websocket: WebSocket
    
    public constructor(url: string) {
        this.websocket = new WebSocket(url)
    }

    public async init() {
        
    }
}

export default MultiplayerSystem