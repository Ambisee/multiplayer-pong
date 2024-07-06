import { 
    NonCollidable, Collision, Motion, Player, RenderRequest, 
    Wall, Ball, Opponent, Text, Button, ScreenState, EndGameWall,
    DelayedCallback, AI, FieldEffect, GameState,
    BaseAnimation,
    NumberAnimation,
} from "./components"
import { ComponentContainer } from "./ecs"

class ECSRegistry {
    public players: ComponentContainer<Player> =  new ComponentContainer(Player)
    public motions: ComponentContainer<Motion> =  new ComponentContainer(Motion)
    public renderRequests: ComponentContainer<RenderRequest> = new ComponentContainer(RenderRequest)
    public collisions: ComponentContainer<Collision> = new ComponentContainer(Collision)
    public nonCollidables: ComponentContainer<NonCollidable> = new ComponentContainer(NonCollidable)
    public walls: ComponentContainer<Wall> = new ComponentContainer(Wall)
    public balls: ComponentContainer<Ball> = new ComponentContainer(Ball)
    public opponents: ComponentContainer<Opponent> = new ComponentContainer(Opponent)
    public texts: ComponentContainer<Text> = new ComponentContainer(Text)
    public buttons: ComponentContainer<Button> = new ComponentContainer(Button)
    public screenStates: ComponentContainer<ScreenState> = new ComponentContainer(ScreenState)
    public gameStates: ComponentContainer<GameState> = new ComponentContainer(GameState)
    public endGameWalls: ComponentContainer<EndGameWall> = new ComponentContainer(EndGameWall)
    public delayedCallbacks: ComponentContainer<DelayedCallback> = new ComponentContainer(DelayedCallback)
    public fieldEffects: ComponentContainer<FieldEffect> = new ComponentContainer(FieldEffect)
    public animations: ComponentContainer<BaseAnimation> = new ComponentContainer(BaseAnimation)
    public ais: ComponentContainer<AI> = new ComponentContainer(AI)

    private componentsList: ComponentContainer<any>[]

    public constructor() {
        this.componentsList = []
        
        this.componentsList.push(this.players)
        this.componentsList.push(this.motions)
        this.componentsList.push(this.renderRequests)
        this.componentsList.push(this.collisions)
        this.componentsList.push(this.nonCollidables)
        this.componentsList.push(this.walls)
        this.componentsList.push(this.balls)
        this.componentsList.push(this.opponents)
        this.componentsList.push(this.texts)
        this.componentsList.push(this.buttons)
        this.componentsList.push(this.screenStates)
        this.componentsList.push(this.animations)
        this.componentsList.push(this.gameStates)
        this.componentsList.push(this.endGameWalls)
        this.componentsList.push(this.fieldEffects)
        this.componentsList.push(this.delayedCallbacks)
        this.componentsList.push(this.ais)
    }

    public listAllComponents() {
        for (const container of this.componentsList) {
            if (container.components.length > 0) {
                console.log(`${container.toString()}: ${container.components.length} components registered`)
            }
        }
    }
    
    public removeAllComponentsOf(entity: number) {
        for (const container of this.componentsList) {
            if (container.has(entity)) {
                container.remove(entity)
            }
        }
    }

    public clearAllComponents() {
        for (const container of this.componentsList) {
            container.clear()
        }
    }
}

const registry = new ECSRegistry()
export { ECSRegistry, registry }
