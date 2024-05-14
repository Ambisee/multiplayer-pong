from math import atan2

from ..types.payloads import CollisionMotionPayload


class PhysicSystem:
    BALL_RADIUS = 50

    def __init__(self):
        pass

    @staticmethod
    def reflect_object(
        b_pos,
        b_vel,
        w_pos,
        w_scale
    ):
        w_top = w_pos[1] - w_scale[1] / 2
        w_bottom = w_pos[1] + w_scale[1] / 2
        w_right = w_pos[0] + w_scale[0] / 2
        w_left = w_pos[0] - w_scale[0] / 2

        incoming_angle = atan2(w_pos[1] - b_pos[1], w_pos[0] - b_pos[0])

        topright_angle = atan2(w_top - b_pos[1], w_right - b_pos[0])
        topleft_angle = atan2(w_top - b_pos[1], w_left - b_pos[0])
        bottomright_angle = atan2(w_bottom - b_pos[1], w_right - b_pos[0])
        bottomleft_angle = atan2(w_bottom - b_pos[1], w_left - b_pos[0])

        if (incoming_angle >= bottomright_angle and incoming_angle <= bottomleft_angle) or (
                incoming_angle >= topleft_angle and incoming_angle <= topright_angle):
            
            result = CollisionMotionPayload([b_vel[0], -b_vel[1]], [b_pos[0], b_pos[1]])

            if w_pos[1] - b_pos[1] >= 0:
                result.b_pos[1] = w_top - PhysicSystem.BALL_RADIUS
            else:
                result.b_pos[1] = w_bottom + PhysicSystem.BALL_RADIUS
        else:
            result = CollisionMotionPayload([-b_vel[0], b_vel[1]], [b_pos[0], b_pos[1]])

            if w_pos[0] - b_pos[0] >= 0:
                result.b_pos[0] = w_left - PhysicSystem.BALL_RADIUS
            else:
                result.b_pos[0] = w_right + PhysicSystem.BALL_RADIUS

        return result
