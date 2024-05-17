import random

from websockets import WebSocketServerProtocol

from ..managers import room_manager
from ..types.payloads import RoundStartPayload
from ..ecs_systems.physics_system import PhysicSystem


async def start_round(ws: WebSocketServerProtocol):
    # Get the client's room
    room = room_manager.client_room_map.get(ws.id)
    if room is None:
        raise ValueError(f"Client {ws.id} disconnected during round start phase.")


    # Create a random ball position and velocity
    # Screen and dimensions when two browser tabs are open with equal widths and full height, and zoom in the browsers to 67%
    w_width = 959
    w_height = 851

    # ball_pos = [
    #     random.randrange(0.25 * w_width, 0.75 * w_width),
    #     random.randrange(PhysicSystem.BALL_RADIUS, w_height - PhysicSystem.BALL_RADIUS),
    # ]

    # ball_vel = [
    #     (-1)**round(random.random()) * 5,
    #     (-1)**round(random.random()) * 5
    # ]

    # Generate a random position and velocity to spawn the ball
    ball_pos = [w_width // 2, w_height // 2]
    ball_vel = [-5, 5]

    # Create the message
    payload = RoundStartPayload(ball_pos, ball_vel)

    # Make sure the collision payloads are properly reset
    room.collision_payload_received = [False, False]
    room.collision_payloads = [None, None]

    await room.broadcast(payload.to_bytes())
