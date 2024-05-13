from uuid import UUID

import websockets

from .player import Player
from .types import Vec2, ROOM_STATE


class Room:
    p1: Player | None
    p2: Player | None
    ball_pos: Vec2
    ball_vel: Vec2
    
    collision_payloads: list[bytes] = [b"", b""]
    collision_payload_received = list[bool] = [False, False]

    def __init__(self, p1=None, p2=None, ball_pos=(0, 0), ball_vel=(0, 0)):
        self.p1: Player = p1
        self.p2: Player = p2

        self.ball_pos = ball_pos
        self.ball_vel = ball_vel

        self.state: ROOM_STATE = ROOM_STATE.IDLE

    def is_room_empty(self):
        return self.p1 is None and self.p2 is None

    def has_two_players(self):
        return self.p1 is not None and self.p2 is not None

    def remove_player(self, ws_id: UUID):
        if self.p2 is not None and self.p2.ws_connection.id == ws_id:
            self.p2 = None

        elif self.p1 is not None and self.p1.ws_connection.id == ws_id:
            self.p1 = self.p2
            self.p2 = None

    async def broadcast(self, message: bytes):
        targets = []

        if self.p1 is not None:
            targets.append(self.p1)

        if self.p2 is not None:
            targets.append(self.p2)

        websockets.broadcast(targets, bytes)
