import { Collision } from "../src/scripts/ecs_scripts/components"
import { ECSRegistry } from "../src/scripts/ecs_scripts/ecs_registry"

describe("ECS registry tests", () => {
    let registry: ECSRegistry
    let entity1: number
    let entity2: number
    
    beforeAll(() => {
        entity1 = 0
        entity2 = 1
    })

    beforeEach(() => {
        registry = new ECSRegistry()

        registry.motions.emplace(entity1)
        registry.players.emplace(entity1)
    })

    it("should allow creation and insertion of components", () => {
        expect(registry.motions.length()).toEqual(1)
        expect(registry.players.length()).toEqual(1)
        expect(registry.collisions.length()).toEqual(0)
    })

    it("should clear all components when requested", () => {
        registry.motions.emplace(entity2)

        registry.collisions.insert(entity1, new Collision(entity1, entity2), true)
        registry.collisions.insert(entity2, new Collision(entity2, entity1), true)

        expect(registry.collisions.length()).toEqual(2)
        expect(registry.motions.has(entity1)).toBe(true)

        registry.clearAllComponents()

        expect(registry.motions.length()).toEqual(0)
        expect(registry.players.length()).toEqual(0)
        expect(registry.collisions.length()).toEqual(0)

        expect(registry.motions.has(entity1)).toBe(false)
        expect(registry.players.has(entity1)).toBe(false)
        expect(registry.collisions.has(entity1)).toBe(false)
    })
})