import { vec2 } from "gl-matrix"

import { BoundingBox, clamp } from "./common"
import { registry } from "./ecs_registry"
import { Entity } from "./ecs"
import { Collision, GEOMETRY, Motion } from "./components"

class PhysicSystem {
    public constructor() {

    }

    public step(elapsedTimeMs: number) {
        this.processMovement()
        this.checkCollision()
    }

    public static reflectObject(reflectedMotion: Motion, reflectorMotion: Motion) {
        let direction = vec2.create()
        vec2.subtract(direction, reflectorMotion.position, reflectedMotion.position)
        let incomingAngle = Math.atan2(direction[1], direction[0])

        const bb = BoundingBox.getBoundingBox(reflectorMotion.position, reflectorMotion.scale)
        const topRightAngle = Math.atan2(bb.top - reflectorMotion.position[1], bb.right - reflectorMotion.position[0])
        const topLeftAngle = Math.atan2(bb.top - reflectorMotion.position[1], bb.left - reflectorMotion.position[0])
        const bottomRightAngle = Math.atan2(bb.bottom - reflectorMotion.position[1], bb.right - reflectorMotion.position[0])
        const bottomLeftAngle = Math.atan2(bb.bottom - reflectorMotion.position[1], bb.left - reflectorMotion.position[0])

        // Reverse the reflected object's velocity and push them out of the bounding box
        // of the reflector object
        if (
            incomingAngle >= bottomRightAngle && incomingAngle <= bottomLeftAngle ||
            incomingAngle >= topLeftAngle && incomingAngle <= topRightAngle
        ) {
            reflectedMotion.positionalVel[1] *= -1
            
            if (direction[1] >= 0) {
                reflectedMotion.position[1] = bb.top - reflectedMotion.scale[1] / 2
            } else {
                reflectedMotion.position[1] = bb.bottom + reflectedMotion.scale[1] / 2
            }
        } else {
            reflectedMotion.positionalVel[0] *= -1

            if (direction[0] >= 0) {
                reflectedMotion.position[0] = bb.left - reflectedMotion.scale[0] / 2
            } else {
                reflectedMotion.position[0] = bb.right + reflectedMotion.scale[0] / 2
            }
        }
    }

    private processMovement() {
        for (const motion of registry.motions.components) {
            motion.rotation += motion.rotationalVel
            vec2.add(motion.position, motion.position, motion.positionalVel)
        }
    }

    private checkCollision() {
        // Get the first entity to check against
        for (let i = 0; i < registry.motions.length(); i++) {
            let e1 = registry.motions.entities[i]
            if (registry.nonCollidables.has(e1)) continue
            
            // Loop through the entities following the 
            // current entity being checked against
            for (let j = i + 1; j < registry.motions.length(); j++) {
                let e2 = registry.motions.entities[j]
                if (registry.nonCollidables.has(e2)) continue

                if (this.aabbDetection(e1, e2)) {
                    // let m = registry.motions.get(e1)
                    // let m1 = registry.motions.get(e2)
                    // console.log(BoundingBox.getBoundingBox(m.position, m.scale))
                    // console.log(BoundingBox.getBoundingBox(m1.position, m1.scale))

                    registry.collisions.insert(Entity.generate(), new Collision(e1, e2))
                    registry.collisions.insert(Entity.generate(), new Collision(e2, e1))
                }
            }
        }
    }

    private aabbBoxToBox(motion1: Motion, motion2: Motion) {
        const bb1 = BoundingBox.getBoundingBox(motion1.position, motion1.scale)
        const bb2 = BoundingBox.getBoundingBox(motion2.position, motion2.scale)

        return (
            bb1.left <= bb2.right &&
            bb2.left <= bb1.right &&
            bb1.top <= bb2.bottom &&
            bb2.top <= bb1.bottom
        )
    }

    private aabbCircleToBox(circle_m: Motion, box_m: Motion) {
        const bb = BoundingBox.getBoundingBox(box_m.position, box_m.scale)
        
        const center = circle_m.position
        const r = circle_m.scale[0] / 2

        let minDist = 0
        let e = Math.max(0, bb.left - center[0]) + Math.max(0, center[0] - bb.right)
        if (e > r) return false
        minDist += (e * e)

        e = Math.max(0, bb.top - center[1]) + Math.max(0, center[1] - bb.bottom)
        if (e > r) return false
        minDist += (e * e)

        return minDist <= (r * r)
    }

    private aabbCircleToCircle(m1: Motion, m2: Motion) {
        let c1 = m1.position
        let r1 = m1.scale[0] / 2
        let c2 = m2.position
        let r2 = m2.scale[0] / 2

        let diff = vec2.distance(c1, c2)

        return diff <= r1 + r2
    }

    private aabbDetection(entity1: number, entity2: number) {
        let m1 = registry.motions.get(entity1)
        let m2 = registry.motions.get(entity2)
        let shape1 = GEOMETRY.GEOMETRY_COUNT
        let shape2 = GEOMETRY.GEOMETRY_COUNT

        if (registry.renderRequests.has(entity1))
            shape1 = registry.renderRequests.get(entity1).geometry
        
        if (registry.renderRequests.has(entity2))
             shape2 = registry.renderRequests.get(entity2).geometry

        switch (shape1) {
            case GEOMETRY.RECTANGLE:
                switch (shape2) {
                    case GEOMETRY.RECTANGLE:
                        return this.aabbBoxToBox(m1, m2)
                    case GEOMETRY.CIRCLE:
                        return this.aabbCircleToBox(m2, m1)
                    default:
                        return this.aabbBoxToBox(m1, m2)
                }
                break
            
            case GEOMETRY.CIRCLE:
                switch (shape2) {
                    case GEOMETRY.RECTANGLE:
                        return this.aabbCircleToBox(m1, m2)
                    case GEOMETRY.CIRCLE:
                        return this.aabbCircleToCircle(m1, m2)
                    default:
                        return this.aabbCircleToBox(m1, m2)
                }
                break

            default:
                return this.aabbBoxToBox(m1, m2)
        }
    }
}

export default PhysicSystem