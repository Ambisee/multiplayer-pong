from websockets import WebSocketServerProtocol

from ..types import Vec2


class Player:
    position: Vec2
    score: int
    ws_connection: WebSocketServerProtocol

    def __init__(self, position=None, score=0, ws_connection=None):
        self.score = score
        self.ws_connection = ws_connection
        
        if position is None:
            self.position = [0, 0]
        else:
            self.position = position
