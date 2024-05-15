from websockets import WebSocketServerProtocol

from .end_round import end_round
from ..managers import room_manager
from ..types import CollisionPayload
from ..ecs_systems.physics_system import PhysicSystem


async def collision(ws: WebSocketServerProtocol, message: bytes):
    room = room_manager.client_room_map[ws.id]

    # Determine player number of the client
    if room.p1.ws_connection.id == ws.id:
        index = 0
    else:
        index = 1

    # Check if the collision payload exists already or not
    if room.collision_payload_received[index]:
        return

    # Set the message and the received message flag of the client
    room.collision_payloads[index] = message
    room.collision_payload_received[index] = True

    # Check if there are two collision messages received already
    if not all(room.collision_payload_received):
        return
    
    # Calculate the result of the collision
    
    # Get the values from the payload
    p1_payload = CollisionPayload.from_bytes(room.collision_payloads[0])
    p2_payload = CollisionPayload.from_bytes(room.collision_payloads[1])
    
    # Check if the ball hits a win zone
    if p1_payload.tag is not None and p2_payload.tag is not None:
        return await end_round(p1_payload, p2_payload, room)

    # Calculate the result of the collision
    if p1_payload.ball_vel[0] < 0 and p2_payload.ball_vel[0] < 0:
        result = PhysicSystem.reflect_object(
            p1_payload.ball_pos,
            p1_payload.ball_vel,
            p1_payload.wall_pos,
            p1_payload.wall_scale,
        )
    elif p1_payload.ball_vel[0] > 0 and p2_payload.ball_vel[0] > 0:
        result = PhysicSystem.reflect_object(
            p2_payload.ball_pos,
            p2_payload.ball_vel,
            p2_payload.wall_pos,
            p2_payload.wall_scale,
        )
    else:
        raise Exception("Payload values doesn't match.")
    
    # Refresh the collision payload statuses
    room.collision_payload_received = [False, False]
    room.collision_payloads = [None, None]
    
    # Broadcast the message to the room
    await room.broadcast(result.to_bytes())
