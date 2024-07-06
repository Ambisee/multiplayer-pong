import { vec2 } from "gl-matrix"

/**
 * Calculates the y-value of a triangular function. The triangular
 * function will be increasing when `x` is in the range `[0, peak)`
 * and decreasing when `x` is in the range `(peak, 2 * peak]`. The function
 * will return 1 when `x = peak`
 * 
 * Formula:
 * > y(x) = 
 * 
 * @param x A real number value 
 * @param xPeak An x-value where the function returns 1
 * @param amplitude The amplitude of the wave function
 * @returns y-value within the range of `[0,1]`
 */
function triangular(
    x: number, 
    xPeak: number
) {
    if (x < 0 || x > 2 * xPeak) {
        throw Error("x-value must be between 0 and twice the value of xPeak")
    }

    return - Math.abs(x / xPeak - 1) + 1
}

/**
 * Calculate the y-value on the cubic bezier wave function
 * with the given x-value in the domain of [0, 1].
 * 
 * #### Note
 * The cubic bezier function internally has the
 * first and last control points defined as:
 * 
 * - `p0 = [0, 0]`
 * - `p3 = [1, 1]`
 * 
 * `p1` and `p2` by default are the 
 * intermediate control points that define the `ease`
 * timing function (as defined in CSS)
 * 
 * @param x 
 * @param p1 
 * @param p2 
 * @returns 
 */
function cubicBezier(
    x: number, 
    p1: vec2 = [0.25, 0.1],
    p2: vec2 = [0.25, 1], 
) {
    if (x < 0 || x > 1) {
        throw Error("x-value must be between 0 and 1")
    }

    const p0 = [0, 0]
    const p3 = [1, 1]

    return (
        Math.pow(1 - x, 3) * p0[1] +
        3 * x * Math.pow(1 - x, 2) * p1[1] +
        3 * (1 - x) * Math.pow(x, 2) * p2[1] +
        Math.pow(x, 3) * p3[1]
    )
}

function clampVec2(vector: vec2, scale: number) {
    const normalVector = vec2.normalize(vec2.create(), vector)
    return vec2.scale(normalVector, normalVector, Math.min(scale, vec2.length(vector)))
}

function setVec2Magnitude(vector: vec2, scale: number) {
    const normalVector = vec2.normalize(vec2.create(), vector)
    return vec2.scale(normalVector, normalVector, scale)
}

export { triangular, cubicBezier, clampVec2, setVec2Magnitude }
