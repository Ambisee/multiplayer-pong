import asyncio

from .start_round import start_round
from ..types.payloads import \
    CollisionPayload, RoundEndPayload, CountdownStartPayload, ResultPayload
from ..objects.room import Room


async def next_step(room: Room):
    await asyncio.sleep(1.5)
    
    # During the timeout, a player may have disconnected
    if not room.has_two_players():
        return

    # A player has won the game
    if room.game_end() != -1:
        await room.broadcast(ResultPayload(room.p1.score, room.p2.score).to_bytes())
        return f"Room {room.room_id}: Game finished."
    
    await room.broadcast(CountdownStartPayload().to_bytes())
    await asyncio.sleep(3)
    await start_round(room.p1.ws_connection)

    return None


async def end_round(p1_payload: CollisionPayload, p2_payload: CollisionPayload, room: Room):
    # P1 and P2 payloads states that ball hits different side wall (unable to determine who won)
    if p1_payload.tag == p2_payload.tag:
        raise Exception("Payload values contains conflicting values for the walls' tags")

    # Ball hits left wall -> Player 2 won
    if p1_payload.tag == CollisionPayload.LEFT_WALL and p2_payload.tag == CollisionPayload.RIGHT_WALL:
        room.p2.score += 1

    # Ball hits right wall -> Player 1 won
    elif p1_payload.tag == CollisionPayload.RIGHT_WALL and p2_payload.tag == CollisionPayload.LEFT_WALL:
        room.p1.score += 1

    payload = RoundEndPayload(room.p1.score, room.p2.score)
    await room.broadcast(payload.to_bytes())

    return asyncio.create_task(next_step(room))
