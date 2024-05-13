import { ComponentContainer } from "../src/scripts/ecs_scripts/ecs"
import { EFFECTS, GEOMETRY, Motion, Player, RENDER_LAYER, RenderRequest } from "../src/scripts/ecs_scripts/components"
import { vec2 } from "gl-matrix"

describe("ECS tests", () => {
    describe("ComponentContainer tests", () => {
        let motions: ComponentContainer<Motion>
        let players: ComponentContainer<Player>
        
        beforeEach(() => {
            motions = new ComponentContainer(Motion)
        })

        it("should have a working constructor", () => {
            let m1 = motions.emplace(0)
            expect(m1).toBeInstanceOf(Motion)
        })

        it("should have a working `has` method", () => {
            let m1 = new Motion()
            motions.insert(0, m1)
            
            expect(motions.has(0)).toEqual(true)
            expect(motions.has(1)).toEqual(false)
        })

        it("should have a working `insert` method", () => {
            // General insertion of components
            let m1 = new Motion()
            motions.insert(0, m1)
            motions.emplace(1)
            
            expect(motions.entities.length).toEqual(2)
            expect(motions.components.length).toEqual(2)

            // Trying to insert duplicate component
            let m3 = new Motion()
            expect(() => motions.insert(1, m3)).toThrow(Error)
            
            expect(motions.entities.length).toEqual(2)
            expect(motions.components.length).toEqual(2)
            expect(motions.get(0)).toBe(m1)

            // Trying to insert duplicate component with the bypass
            expect(motions.insert(1, m3, true)).toBeInstanceOf(Motion)

            expect(motions.entities.length).toEqual(3)
            expect(motions.components.length).toEqual(3)
        })

        it("should have a working `get` method", () => {
            let m1 = new Motion()
            motions.insert(0, m1)
            let m2 = new Motion()
            motions.insert(1, m2)

            expect(motions.get(0)).toBe(m1)
            expect(motions.get(1)).toBe(m2)

            expect(() => motions.get(3)).toThrow(Error)
        })

        it("should have a working `remove` method", () => {
            let m0 = motions.emplace(0)
            let m1 = motions.emplace(1)
            let m2 = motions.emplace(2)

            m0.position = vec2.fromValues(1920, 1280)
            m0.position = vec2.fromValues(860, 640)
            m0.position = vec2.fromValues(10, 10)

            motions.remove(1)
            
            expect(motions.entities.length).toEqual(2)
            expect(motions.entities).toEqual([0, 2])
            expect(motions.get(2)).toBe(m2)
        })

        it("should have a working `toString` method", () => {
            let players = new ComponentContainer(Player)

            expect(players.toString()).toEqual("ComponentContainer<Player>")
            expect(motions.toString()).toEqual("ComponentContainer<Motion>")
        })

        it.each([0, 1, 5])("should have a working `sort` method", (numComponents) => {
            const renderRequests = new ComponentContainer(RenderRequest)

            for (let i = 0; i < numComponents; i++) {
                renderRequests.insert(i, new RenderRequest(
                    EFFECTS.EFFECTS_COUNT,
                    GEOMETRY.GEOMETRY_COUNT,
                    Math.round(100 * Math.random()) % RENDER_LAYER.RENDER_LAYER_COUNT
                ))
            }

            renderRequests.sort((a, b) => {
                const rr1 = renderRequests.get(a)
                const rr2 = renderRequests.get(b)

                return rr1.renderLayer - rr2.renderLayer
            })

            // Check if the components are really sorted
            for (let i = 1; i < numComponents; i++) {
                const inOrder = renderRequests.components[i - 1].renderLayer <= renderRequests.components[i].renderLayer
                expect(inOrder).toBe(true)
            }
        })
    })
})