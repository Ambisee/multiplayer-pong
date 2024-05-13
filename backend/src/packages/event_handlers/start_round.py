import random

from websockets import WebSocketServerProtocol

from ..objects.types import SERVER_EVENT
from ..managers import room_manager
from ..helpers import array_to_bytes


def create_start_round_message(position, velocity):
    b_event = SERVER_EVENT.ROUND_START.value.to_bytes(1, "little")
    b_position = array_to_bytes(position)
    b_velocity = array_to_bytes(velocity)

    return b_event + b_position + b_velocity


async def start_round(ws: WebSocketServerProtocol):
    # Create a random ball position and velocity
    w_width = 1280
    w_height = 720

    ball_radius = 50

    ball_pos = array_to_bytes([
        random.randrange(0.25 * w_width, 0.75 * w_width),
        random.randrange(ball_radius, w_height - ball_radius),
    ])

    ball_vel = array_to_bytes([
        (-1)**round(random.random()) * 5,
        (-1)**round(random.random()) * 5
    ])
    
    payload = create_start_round_message(ball_pos, ball_vel)
    room = room_manager.client_room_map[ws.id]

    await room.broadcast(payload)
