from .new_connection import new_connection_message
from .collision import collision
from .player_motion import player_motion
from ..types import CLIENT_EVENT

handlers_map = {
    CLIENT_EVENT.CONNECT.value: new_connection_message,
    CLIENT_EVENT.COLLISION.value: collision,
    CLIENT_EVENT.MOTION.value: player_motion
}
