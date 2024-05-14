from uuid import UUID
from enum import Enum

import websockets

from .player import Player
from ..types import Vec2


class ROOM_STATE(Enum):
    IDLE = 0
    GAME = IDLE + 1
    END = GAME + 1
    STATE_COUNT = END + 1


class Room:
    p1: Player | None
    p2: Player | None
    ball_pos: Vec2
    ball_vel: Vec2
    
    collision_payloads: list[bytes] = [b"", b""]
    collision_payload_received: list[bool] = [False, False]

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

    def add_player(self, ):
        if self.p1 is None:
            self.p1 = None
        elif self.p2 is None:
            self.p2 = None

    def remove_player(self, ws_id: UUID):
        # elif self.p1 is not None and self.p1.ws_connection.id == ws_id:
        if self.p1.ws_connection.id == ws_id:
            self.p1 = self.p2
            self.p2 = None

        # if self.p2 is not None and self.p2.ws_connection.id == ws_id:
        elif self.p2 is not None and self.p2.ws_connection.id == ws_id:
            self.p2 = None

    async def broadcast(self, message: bytes):
        targets = []

        if self.p1 is not None:
            targets.append(self.p1.ws_connection)

        if self.p2 is not None:
            targets.append(self.p2.ws_connection)

        websockets.broadcast(targets, message)
