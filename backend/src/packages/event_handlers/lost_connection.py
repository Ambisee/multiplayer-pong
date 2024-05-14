from websockets import WebSocketServerProtocol

from ..types import SERVER_EVENT
from ..managers import room_manager


async def lost_connection(ws: WebSocketServerProtocol):
    # Get the room of the client before removing the player
    room = room_manager.client_room_map[ws.id]
    
    # Remove the player from their room
    await room_manager.remove_player(ws.id)

    # Notify the other player in the room that
    # the opponent has disconnected
    if not room.is_room_empty():
        await room.p1.ws_connection.send(SERVER_EVENT.OP_DISCONNECT.value.to_bytes())
