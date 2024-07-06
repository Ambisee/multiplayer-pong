import { vec2 } from "gl-matrix"
import { triangular, cubicBezier } from "../../src/scripts/helper_scripts/math_helper"

describe("Math Helper tests", () => {
    describe("Triangular function", () => {
        it.each([
            [1, 1, 1],
            [0, 2, 1],
            [0.1097, 1.8903, 1],
            [0.5, 7.5, 5]
        ])("should produce the correct output", (expected, x, xPeak) => {
            const result = triangular(
                x, xPeak
            )

            expect(result).toBeCloseTo(expected, 4)
        })
    })

    describe("Cubic Bezier function", () => {
        it.each([
            [0.784, 0.7, vec2.fromValues(...[0.5, 0]), vec2.fromValues(...[0.5, 1])],
            [0.2149, 0.599, vec2.fromValues(...[1, 0]), vec2.fromValues(...[1, 0])],
        ])("should produce the correct output", (expected, x, p1, p2) => {
            const result = cubicBezier(x, p1, p2)

            expect(result).toBeCloseTo(expected, 4)
        })
    })
})