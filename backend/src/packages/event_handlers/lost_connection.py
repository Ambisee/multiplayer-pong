import json

from websockets import WebSocketServerProtocol

from ..objects.types import EVENT
from ..managers import room_manager


async def lost_connection(ws: WebSocketServerProtocol):
    # Remove the player from their room
    room = room_manager.client_room_map[ws.id]

    await room_manager.remove_player(ws.id)

    await room.p1.ws_connection.send(json.dumps({
        "event": EVENT.PLAYER_DISCONNECT,
        "payload": ws.id
    }))
