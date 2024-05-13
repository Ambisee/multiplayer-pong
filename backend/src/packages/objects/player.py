from websockets import WebSocketServerProtocol

from ..objects.types import Vec2


class Player:
    position: Vec2
    score: int
    ws_connection: WebSocketServerProtocol

    def __init__(self, position=[0, 0], score=0, ws_connection=None):
        self.position = position
        self.score = score
        self.ws_connection = ws_connection
