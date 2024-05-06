from enum import Enum

from .player import Player


class RoomState(Enum):
    IDLE = 0
    GAME = IDLE + 1
    END = GAME + 1
    STATE_COUNT = END + 1


class Room:
    def __init__(self):
        self.p1: Player | None = Player()
        self.p2: Player | None = Player()

        self.state: RoomState = RoomState.IDLE
