from websockets import WebSocketServerProtocol

from ..managers import room_manager
from ..types.payloads import MotionPayload, OpponentMotionPayload


async def player_motion(ws: WebSocketServerProtocol, message: bytes):
    # Get the room associated with the client
    room = room_manager.client_room_map.get(ws.id)

    if room is None:
        raise Exception("Unable to find the client's room.")
    
    incoming_message = MotionPayload.from_bytes(message)
    outgoing_message = OpponentMotionPayload(incoming_message.position)

    # Source client is player 1
    if room.p1.ws_connection.id == ws.id and room.p2 is not None:
        await room.p2.ws_connection.send(outgoing_message.to_bytes())
    
    # Source client is player 2
    elif room.p1 is not None:
        await room.p1.ws_connection.send(outgoing_message.to_bytes())
