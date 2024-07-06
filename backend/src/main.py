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
        os.getenv("SERVER_HOST", "10.0.0.180"),
        int(os.getenv("SERVER_PORT", 8001)),
        logger=None
    ):
        await asyncio.Future()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s]\t %(message)s")
    
    if os.path.exists('../.env'):
        logging.info("Setup environment variables...")
        os.unsetenv("SERVER_HOST")
        os.unsetenv("SERVER_PORT")
        
        load_dotenv()
        

    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("APP: App exited.")
