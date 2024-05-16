import os
import asyncio
import logging

import websockets
from dotenv import load_dotenv

from packages.api.server import handle_connection


async def main():
    logging.info("APP: Booting up WebSocket server...")
    async with websockets.serve(
        handle_connection,
        os.getenv("SERVER_HOST", "localhost"),
        int(os.getenv("SERVER_PORT", 8001)),
        logger=None
    ):
        await asyncio.Future()


if __name__ == "__main__":
    if os.path.exists("../../.env"):
        load_dotenv("../../.env")
        
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s]\t %(message)s")

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("APP: App exited.")
