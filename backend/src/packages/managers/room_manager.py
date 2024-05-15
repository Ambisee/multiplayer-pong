from uuid import UUID
from asyncio import Queue

from websockets import WebSocketServerProtocol

from ..objects.room import Room


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
                return room
            
        return await self.create_new_room()

    async def create_new_room(self):
        # Create a new room
        room = Room()

        # Place room in the queue
        await self.room_queue.put(room)
        return room
        
    async def add_player(self, ws: WebSocketServerProtocol):
        # Get a room from the queue
        room = await self.get_queue_room(ws)

        # Add the player into the room
        room.add_player(ws)

        # Map the client id to the room
        self.client_room_map[ws.id] = room
        return room
    
    async def remove_player(self, ws_id: UUID):
        # Get the client's room
        room = self.client_room_map.get(ws_id)
        if room is None:
            return False
    
        # Place the room back into the queue if it originally has two players
        if room.has_two_players():
            await self.room_queue.put(room)

        # Remove the player from the room and the room mappings
        room.remove_player(ws_id)
        self.client_room_map.pop(ws_id)

        return True


room_manager = RoomManager()
