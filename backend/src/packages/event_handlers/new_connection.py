import logging

import websockets

from ..managers.room_manager import room_manager
from ..objects.types import SERVER_EVENT


def create_connected_message():
    return SERVER_EVENT.CONNECTED.value.to_bytes(1, "little")


def create_countdown_start_message():
    return SERVER_EVENT.COUNTDOWN_START.value.to_bytes(1, "little")


async def new_connection_message(ws: websockets.WebSocketServerProtocol):
    # Log the new client's ID
    logging.info(f"APP: Client {ws.id} connected.")

    # Prepare and send the server's payload
    payload = create_connected_message()
    await ws.send(payload)

    # Assign the player a room
    room = await room_manager.add_player(ws)

    # Start the game timer if the room is ready
    if room.has_two_players():
        payload = create_countdown_start_message()
        await room.broadcast(payload)
