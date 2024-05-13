import functools
import logging

import websockets

from ..event_handlers import handlers


def handle_message_loop(func):
    @functools.wraps(func)
    async def wrapped(ws: websockets.WebSocketServerProtocol):
        try:
            while True:
                await func(ws)
        except websockets.ConnectionClosed:
            logging.info(f"Client {ws.id} disconnected.")
    return wrapped


@handle_message_loop
async def handle_connection(ws: websockets.WebSocketServerProtocol):
    data = await ws.recv()
    
    handle_func = handlers.get(int.from_bytes(data))
    if handle_func is None:
        return

    await handle_func(ws)
