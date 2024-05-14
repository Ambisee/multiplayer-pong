class BaseMessage {
    public constructor() {

    }

    public toMessage(): Uint8Array {
        return new Uint8Array(2)
    }
}

export { BaseMessage }