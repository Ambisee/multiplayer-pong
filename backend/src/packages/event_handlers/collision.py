from websockets import WebSocketServerProtocol

from ..managers import room_manager


async def collision(ws: WebSocketServerProtocol, message: bytes):
    room = room_manager.client_room_map[ws.id]

    # Determine player number of the client
    if room.p1.ws_connection.id == ws.id:
        index = 0
    else:
        index = 1

    # Set the message and the received message flag of the client
    room.collision_payloads[index] = message
    room.collision_payload_received[index] = True

    # Check if there are two collision messages received already
    if not all(room.collision_payload_received):
        return
    
    # Calculate the result of the collision
    
