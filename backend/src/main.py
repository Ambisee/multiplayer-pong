import asyncio
import websockets


async def handle_client(ws: websockets.WebSocketServerProtocol):
    while True:
        await ws.recv()


async def main():
    async with websockets.serve(handle_client, "", 8000):
        asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
