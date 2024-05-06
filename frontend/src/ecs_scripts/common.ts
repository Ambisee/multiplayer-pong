import { mat3, vec2 } from "gl-matrix"

class BoundingBox {
    public top: number
    public bottom: number
    public left: number
    public right: number
    public width: number
    public height: number

    public constructor(
        top: number,
        bottom: number,
        left: number,
        right: number,
        width: number,
        height: number
    ) {
        this.top = top
        this.bottom = bottom
        this.right = right
        this.left = left
        this.width = width
        this.height = height
    }

    public static getBoundingBox(position: vec2, size: vec2) {
        return new BoundingBox(
            position[1] - size[1] / 2,
            position[1] + size[1] / 2,
            position[0] - size[0] / 2,
            position[0] + size[0] / 2,
            size[0],
            size[1]
        )
    }
}

class Transform {
    public matrix: mat3    
    
    public constructor() {
        this.matrix = mat3.create()
    }

    public translate(displacement: vec2) {
        mat3.translate(this.matrix, this.matrix, displacement)
    }

    public scale(scale: vec2) {
        let scaling = vec2.create()
        vec2.scale(scaling, scale, 0.5)

        mat3.scale(this.matrix, this.matrix, scaling)
    }

    public rotate(radians: number) {
        mat3.rotate(this.matrix, this.matrix, radians)
    }

    public toMat3() {
        return this.matrix
    }
}

function clamp(value: number, minValue: number, maxValue: number) {
    return Math.max(minValue, Math.min(value, maxValue))
}

export { 
    Transform, BoundingBox,
    clamp
}