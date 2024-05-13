class BaseMessage {
    public constructor() {

    }

    public toMessage(): ArrayBuffer {
        return new ArrayBuffer(2)
    }
}

export { BaseMessage }