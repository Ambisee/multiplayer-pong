import logging

import websockets

from ..managers.room_manager import room_manager
from ..types import SERVER_EVENT


def create_connected_message(is_player1: bool):
    code = SERVER_EVENT.CONNECTED.value.to_bytes(1, "little")
    if is_player1:
        payload = (0).to_bytes()
    else:
        payload = (1).to_bytes()

    return code + payload


def create_countdown_start_message():
    return SERVER_EVENT.COUNTDOWN_START.value.to_bytes(1, "little")


async def new_connection_message(ws: websockets.WebSocketServerProtocol):
    # Log the new client's ID
    logging.info(f"APP: Client {ws.id} connected.")

    # Assign the player a room
    room = await room_manager.add_player(ws)
    if room.p1.ws_connection.id == ws.id:
        is_player1 = True
    else:
        is_player1 = False

    # Prepare and send the server's payload
    payload = create_connected_message(is_player1)
    await ws.send(payload)

    # Start the game timer if the room is ready
    if room.has_two_players():
        payload = create_countdown_start_message()
        await room.broadcast(payload)