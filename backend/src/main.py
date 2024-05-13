import asyncio
import logging

import websockets

from packages.api.server import handle_connection


async def main():
    logging.info("APP: Booting up WebSocket server...")
    async with websockets.serve(handle_connection, "localhost", 8001, logger=None):
        await asyncio.Future()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("APP: App exited.")
