import { AI_TYPE } from "./components"
import { registry } from "./ecs_registry"

class AISystem {
    private activationInterval: number = 250

    private aiTypeToHandler: Map<AI_TYPE, (entity: number) => void>
    private elapsedInternalTimer: number
    
    public constructor() {
        this.aiTypeToHandler = new Map()
        this.elapsedInternalTimer = this.activationInterval

        this.aiTypeToHandler.set(AI_TYPE.OPPONENT, this.activateOpponentAI)
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

    public activateOpponentAI(entity: number) {
        if (registry.balls.length() < 1) return

        // Retrieve the ball's information
        const ballEntity = registry.balls.entities[0] // There might be more than one ball entity (during a nerf or buff)
        const ballMotion = registry.motions.get(ballEntity)

        // Retrieve opponent's motion
        const opMotion = registry.motions.get(entity)

        if (ballMotion.position[1] < opMotion.position[1]) {
            opMotion.positionalVel[1] = -5;
        } else if (ballMotion.position[1] > opMotion.position[1]) {
            opMotion.positionalVel[1] = 5;
        } else {
            opMotion.positionalVel[1] = 0;
        }
    }
}

export default AISystem