from dataclasses import dataclass

from ..types import SERVER_EVENT
from ..types import Vec2


class IncomingPayload:
    LEFT_WALL = 0
    RIGHT_WALL = 1

    @staticmethod
    def from_bytes(payload):
        pass


class OutgoingPayload:
    def to_bytes(self) -> bytes:
        pass


@dataclass
class CountdownStartPayload(OutgoingPayload):
    def to_bytes(self) -> bytes:
        return SERVER_EVENT.COUNTDOWN_START.value.to_bytes()


@dataclass
class CollisionPayload(IncomingPayload):
    ball_pos: Vec2
    ball_vel: Vec2
    wall_pos: Vec2
    wall_scale: Vec2
    tag: int | None

    @staticmethod
    def from_bytes(payload):
        if len(payload) < 17:
            raise Exception("Expected payload size of at least 17 bytes.")

        result = CollisionPayload(
            [
                int.from_bytes(payload[1:3], byteorder="little", signed=True),
                int.from_bytes(payload[3:5], byteorder="little", signed=True)
            ],
            [
                int.from_bytes(payload[5:7], byteorder="little", signed=True),
                int.from_bytes(payload[7:9], byteorder="little", signed=True)
            ],
            [
                int.from_bytes(payload[9:11], byteorder="little", signed=True),
                int.from_bytes(payload[11:13], byteorder="little", signed=True)
            ],
            [
                int.from_bytes(payload[13:15], byteorder="little", signed=True),
                int.from_bytes(payload[15:17], byteorder="little", signed=True)
            ],
            -1
        )

        if len(payload) > 17:
            tag = int.from_bytes(payload[17:])
            result.tag = tag
        else:
            result.tag = None

        return result


@dataclass
class CollisionMotionPayload(OutgoingPayload):
    ball_vel: Vec2
    ball_pos: Vec2

    def to_bytes(self):
        b_posx = self.ball_pos[0].to_bytes(2, byteorder="little", signed=True)
        b_posy = self.ball_pos[1].to_bytes(2, byteorder="little", signed=True)
        b_velx = self.ball_vel[0].to_bytes(2, byteorder="little", signed=True)
        b_vely = self.ball_vel[1].to_bytes(2, byteorder="little", signed=True)

        return SERVER_EVENT.COLLISION_MOTION.value.to_bytes() + b_posx + b_posy + b_velx + b_vely


@dataclass
class MotionPayload(IncomingPayload):
    position: Vec2

    @staticmethod
    def from_bytes(payload):
        if len(payload) != 5:
            raise Exception("Expected payload size of 5 bytes.")

        return MotionPayload([
            int.from_bytes(payload[1:3], byteorder="little", signed=True),
            int.from_bytes(payload[3:5], byteorder="little", signed=True)
        ])


@dataclass
class OpponentMotionPayload(OutgoingPayload):
    position: Vec2

    def to_bytes(self):
        vel_x = self.position[0].to_bytes(2, byteorder='little', signed=True)
        vel_y = self.position[1].to_bytes(2, byteorder='little', signed=True)

        return SERVER_EVENT.OP_MOTION.value.to_bytes() + vel_x + vel_y


@dataclass
class RoundStartPayload(OutgoingPayload):
    ball_pos: Vec2
    ball_vel: Vec2

    def to_bytes(self) -> bytes:
        ball_pos_bytes = \
            self.ball_pos[0].to_bytes(2, byteorder="little", signed=True) + \
            self.ball_pos[1].to_bytes(2, byteorder="little", signed=True)

        ball_vel_bytes = \
            self.ball_vel[0].to_bytes(2, byteorder="little", signed=True) + \
            self.ball_vel[1].to_bytes(2, byteorder="little", signed=True)

        return \
            SERVER_EVENT.ROUND_START.value.to_bytes() + \
            ball_pos_bytes + \
            ball_vel_bytes


@dataclass
class RoundEndPayload(OutgoingPayload):
    p1_score: int
    p2_score: int

    def to_bytes(self) -> bytes:
        return (
            SERVER_EVENT.ROUND_END.value.to_bytes() + self.p1_score.to_bytes() + self.p2_score.to_bytes()
        )


@dataclass
class ResultPayload(RoundEndPayload):
    def to_bytes(self) -> bytes:
        return (
            SERVER_EVENT.RESULT.value.to_bytes() + self.p1_score.to_bytes() + self.p2_score.to_bytes()
        )
