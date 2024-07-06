import { MAX_PADDLE_VELOCITY, PADDLE_ACCELERATION } from "../config"
import { isWorldSlippery } from "../helper_scripts/component_helpers"
import { AI_TYPE, DIRECTION, FIELD_EFFECTS } from "./components"
import { registry } from "./ecs_registry"

class AISystem {
    private activationInterval: number = 100

    private aiTypeToHandler: Map<AI_TYPE, (entity: number) => void>
    private elapsedInternalTimer: number
    
    public constructor() {
        this.aiTypeToHandler = new Map()
        this.elapsedInternalTimer = this.activationInterval

        this.aiTypeToHandler.set(AI_TYPE.OPPONENT, this.activateOpponentAI.bind(this))
    }

    public step(elapsedTimeMs: number) {
        this.elapsedInternalTimer -= elapsedTimeMs
        
        if (this.elapsedInternalTimer > 0) {
            return
        }

        for (const entity of registry.ais.entities) {
            const aiType = registry.ais.get(entity)
            const handler = this.aiTypeToHandler.get(aiType.type)
            
            if (handler !== undefined) {
                handler(entity)
            }
        }

        this.elapsedInternalTimer = this.activationInterval
    }
    
    private setOpponentDirection(entity: number, direction: DIRECTION) {
        let value = MAX_PADDLE_VELOCITY
        if (isWorldSlippery()) {
            value = PADDLE_ACCELERATION
        }

        switch (direction) {
            case DIRECTION.UP:
                this.moveOpponentDirection(entity, -value)
                break
            case DIRECTION.DOWN:
                this.moveOpponentDirection(entity, value)
                break
            case DIRECTION.STOP:
                this.moveOpponentDirection(entity, 0)
                break
            default:
                break
        }
    }

    private moveOpponentDirection(entity: number, value: number) {
        // Check if the game environment is slippery
        const opMotion = registry.motions.get(entity)
        let target = opMotion.positionalVel

        if (isWorldSlippery()) {
            target = opMotion.positionalAccel
        }

        // Process motion
        target[1] = value
    }

    private activateOpponentAI(entity: number) {
        if (registry.balls.length() < 1) return

        // Retrieve the ball's information
        const ballEntity = registry.balls.entities[0] // There might be more than one ball entity (during a nerf or buff)
        const ballMotion = registry.motions.get(ballEntity)

        // Retrieve opponent's motion
        const opMotion = registry.motions.get(entity)

        if (ballMotion.position[1] < opMotion.position[1]) {
            // Ball is above the paddle
            this.setOpponentDirection(entity, DIRECTION.UP)
        } else if (ballMotion.position[1] > opMotion.position[1]) {
            // Ball is below the paddle
            this.setOpponentDirection(entity, DIRECTION.DOWN)
        }
        else {
            this.setOpponentDirection(entity, DIRECTION.STOP)
        }
    }
}

export default AISystem