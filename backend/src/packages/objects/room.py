import asyncio
from asyncio import Task
from uuid import UUID
from typing import List

from websockets import WebSocketServerProtocol

from .player import Player


class Room:
    id_count: int = 0

    p1: Player | None
    p2: Player | None
    room_id: str
    
    win_threshold: int = 5

    collision_payloads: list[bytes] = [None, None]
    collision_payload_received: list[bool] = [False, False]

    def __init__(self, p1=None, p2=None, ball_pos=(0, 0), ball_vel=(0, 0)):
        self.room_id = str(Room.id_count)
        self.p1: Player = p1
        self.p2: Player = p2

        Room.id_count += 1

    def is_room_empty(self):
        return self.p1 is None and self.p2 is None

    def has_two_players(self):
        return self.p1 is not None and self.p2 is not None

    def add_player(self, ws: WebSocketServerProtocol):
        if self.p1 is None:
            self.p1 = Player(ws_connection=ws)
        elif self.p2 is None:
            self.p2 = Player(ws_connection=ws)

    def remove_player(self, ws_id: UUID):
        if self.p1 is not None and self.p1.ws_connection.id == ws_id:
            self.p1 = self.p2
            self.p2 = None

        elif self.p2 is not None and self.p2.ws_connection.id == ws_id:
            self.p2 = None

    def reset_score(self):
        if self.p1 is not None:
            self.p1.score = 0
        if self.p2 is not None:
            self.p2.score = 0

    def game_end(self):
        if self.p1.score >= self.win_threshold:
            return 0  # Some values that represent PLAYER 1
        elif self.p2.score >= self.win_threshold:
            return 1  # Some values that represent PLAYER 2
    
        return -1

    async def broadcast(self, message: bytes):
        targets: List[Task[None]] = []

        # Create an asynchronous task for sending the message to each player
        if self.p1 is not None:
            targets.append(asyncio.create_task(self.p1.ws_connection.send(message)))

        if self.p2 is not None:
            targets.append(asyncio.create_task(self.p2.ws_connection.send(message)))

        await asyncio.wait(targets)
