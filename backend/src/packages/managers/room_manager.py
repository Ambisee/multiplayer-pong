from uuid import UUID
from asyncio import Queue

from websockets import WebSocketServerProtocol

from ..objects.room import Room
from ..objects.player import Player


class RoomManager:
    client_room_map: dict[UUID, Room]
    room_queue: Queue[Room]
    
    def __init__(self):
        self.room_queue = Queue()
        self.client_room_map = {}

    async def get_queue_room(self, ws: WebSocketServerProtocol):
        room = None
        while not self.room_queue.empty():
            room = await self.room_queue.get()
            
            if not room.is_room_empty():
                break
            
        if room is None:
            return await self.create_new_room()

        return room

    async def create_new_room(self):
        # Create a new room
        room = Room()

        # Place room in the queue
        await self.room_queue.put(room)
        return room
        
    async def add_player(self, ws: WebSocketServerProtocol):
        room = await self.get_queue_room(ws)

        if room.p1 is None:
            room.p1 = Player(ws_connection=ws)
        else:
            room.p2 = Player(ws_connection=ws)

        self.client_room_map[ws.id] = room
        return room
    
    async def remove_player(self, ws_id: UUID):
        room = self.client_room_map.get(ws_id)
        if room is None:
            return False
    
        if room.has_two_players():
            await self.room_queue.put(room)

        room.remove_player(ws_id)
        self.client_room_map.pop(ws_id)

        return True


room_manager = RoomManager()
