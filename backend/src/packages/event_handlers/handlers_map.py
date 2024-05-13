from .new_connection import new_connection_message
from ..objects.types import CLIENT_EVENT

handlers_map = {
    CLIENT_EVENT.CONNECT.value: new_connection_message,
}
