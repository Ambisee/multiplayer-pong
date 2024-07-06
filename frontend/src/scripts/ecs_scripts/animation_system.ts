import { cubicBezier, triangular } from "../helper_scripts/math_helper"
import { clamp } from "./common"
import { BaseAnimation, ANIMATION_TIMING_FUNCTION, ANIMATION_DIRECTION } from "./components"
import { registry } from "./ecs_registry"

class AnimationSystem {
    private directionMap: Map<ANIMATION_DIRECTION, Function>
    private timingFuncMap: Map<ANIMATION_TIMING_FUNCTION, Function>

    public constructor() {
        this.directionMap = new Map([
            [ANIMATION_DIRECTION.FORWARD, this.forwardDirection.bind(this)],
            [ANIMATION_DIRECTION.ALTERNATE, this.alternateDirection.bind(this)]
        ])

        this.timingFuncMap = new Map([
            [ANIMATION_TIMING_FUNCTION.EASE, this.easeTimingFunc.bind(this)],
            [ANIMATION_TIMING_FUNCTION.LINEAR, this.linearTimingFunc.bind(this)],
        ])
    }

    public step(elapsedTimeMs: number) {
        for (let i = registry.animations.length() - 1; i >= 0; i--) {
            const e = registry.animations.entities[i]
            const comp = registry.animations.get(e)

            if (comp.internalIteration >= comp.iterations) {
                registry.animations.remove(e)
                continue
            }

            comp.internalTime += elapsedTimeMs
            this.runAnimation(comp)
        }
    }

    private forwardDirection(comp: BaseAnimation) {
        if (comp.internalTime > comp.duration) {
            comp.internalIteration++
            comp.internalTime = comp.duration
            return true
        }

        return false
    }

    private alternateDirection(comp: BaseAnimation) {
        if (comp.internalTime > 2 * comp.duration) {
            comp.internalTime = 2 * comp.duration
            comp.internalIteration++
            return true
        }

        return false
    }

    private linearTimingFunc(comp: BaseAnimation) {
        const alpha = triangular(comp.internalTime, comp.duration)
        comp.interpolate(alpha)
    }

    private easeTimingFunc(comp: BaseAnimation) {
        const alpha = cubicBezier(triangular(comp.internalTime, comp.duration))
       comp.interpolate(alpha)
    }

    private runAnimation(comp: BaseAnimation) {
        const directionFunc = this.directionMap.get(comp.direction)
        const timingFunc = this.timingFuncMap.get(comp.timingFunction)

        if (directionFunc === undefined || timingFunc === undefined) {
            return
        }

        const iterationComplete = directionFunc(comp)
        timingFunc(comp)

        if (iterationComplete) {
            comp.internalTime = 0
        }
    }
}

export default AnimationSystem
