import asyncio
import functools
import logging

import websockets

from ..event_handlers import handlers
from ..event_handlers.lost_connection import lost_connection


def handle_unfinished_task(task: asyncio.Task):
    if task.exception():
        logging.error(f"{type(task.exception())}: {task.exception()}")
        return
    
    if task.result() is None:
        return

    logging.info(task.result())


def handle_message_loop(func):
    @functools.wraps(func)
    async def wrapped(ws: websockets.WebSocketServerProtocol):
        try:
            while True:
                await func(ws)
        except ValueError as value_e:
            logging.error(type(value_e), value_e)
        except websockets.ConnectionClosed:
            await lost_connection(ws)
            logging.info(f"Client {ws.id} disconnected.")
    return wrapped


@handle_message_loop
async def handle_connection(ws: websockets.WebSocketServerProtocol):
    data = await ws.recv()

    # Get a handler function by message type
    handle_func = handlers.get(data[0])
    if handle_func is None:
        return

    # Process the message
    handle_result = await handle_func(ws, data)
    
    # Handle the result of the handler call
    if not isinstance(handle_result, asyncio.Task):
        return

    handle_result.add_done_callback(handle_unfinished_task)
