import random

from websockets import WebSocketServerProtocol

from ..types import SERVER_EVENT
from ..managers import room_manager
from ..helpers import array_to_bytes
from ..ecs_systems.physics_system import PhysicSystem


def create_start_round_message(position: bytes, velocity: bytes):
    b_event = SERVER_EVENT.ROUND_START.value.to_bytes(1, "little")
    
    return b_event + position + velocity


async def start_round(ws: WebSocketServerProtocol):
    # Create a random ball position and velocity
    w_width = 1280
    w_height = 720

    ball_pos = array_to_bytes([
        random.randrange(0.25 * w_width, 0.75 * w_width),
        random.randrange(PhysicSystem.BALL_RADIUS, w_height - PhysicSystem.BALL_RADIUS),
    ])

    ball_vel = array_to_bytes([
        (-1)**round(random.random()) * 5,
        (-1)**round(random.random()) * 5
    ])

    # Generate a random position and velocity to spawn the ball
    ball_pos = array_to_bytes([w_width // 2, w_height // 2])
    ball_vel = array_to_bytes([1, 1])
    
    # Create the message
    payload = create_start_round_message(ball_pos, ball_vel)
    room = room_manager.client_room_map[ws.id]

    # Make sure the collision payloads are properly reset
    room.collision_payload_received = [False, False]
    room.collision_payloads = [None, None]

    await room.broadcast(payload)
