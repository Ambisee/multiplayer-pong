import { mat3, vec2 } from "gl-matrix"

import { registry } from "./ecs_registry"
import { Transform } from "./common"
import { GEOMETRY, EFFECTS, RenderRequest, Motion, RENDER_LAYER } from "./components"
import { staticManager } from "../helper_scripts/static_manager"

// Class for storing individual font glyph's information
class Character {
    public textureID: WebGLTexture  // the texture ID of the character
    public size: vec2               // the dimensions (x, y) of the character
    public advance: number          // the offset to advance to the next glyph 

    public constructor(
        textureID: WebGLTexture = new WebGLTexture(),
        size: vec2 = vec2.create(),
        advance: number = 0
    ) {
        this.textureID = textureID
        this.size = size
        this.advance = advance
    }
}

class RenderSystem {
    public gl: WebGL2RenderingContext
    public characterMaps: Map<string, Character> = new Map()
    public DEFAULT_FONTSIZE: number = 64 // in pixels
    
    private effects: Array<WebGLProgram>
    private vertexBuffers: Array<WebGLBuffer>
    private indexBuffers: Array<WebGLBuffer>

    private vao: WebGLVertexArrayObject
    private offscreenFramebuffer: WebGLFramebuffer
    private offscreenFrameTexture: WebGLTexture
    private offscreenFrameBufferDepth: WebGLRenderbuffer

    private shaderSources: Array<Array<string>> = [
        [
            staticManager.shaderSources.shape.vertexSource.content,
            staticManager.shaderSources.shape.fragmentSource.content
        ],
        [
            staticManager.shaderSources.text.vertexSource.content,
            staticManager.shaderSources.text.fragmentSource.content
        ],
        [
            staticManager.shaderSources.screen.vertexSource.content,
            staticManager.shaderSources.screen.fragmentSource.content
        ]
    ]

    public constructor(gl: WebGL2RenderingContext, displayWidth: number, displayHeight: number) {
        this.gl = gl
        this.vertexBuffers = []
        this.indexBuffers = []
    }

    public init() {
        this.vao = this.gl.createVertexArray()
        this.gl.bindVertexArray(this.vao)

        this.initializeFrameBuffers()
        this.initializeGeometryBuffers()
        this.initializeEffects()
        this.initializeTextures()

        this.gl.bindVertexArray(null)
    }

    public render() {
        // Bind to the framebuffer
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.offscreenFramebuffer)
        // this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)

        // Configure the viewport
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
        this.gl.depthRange(0.00001, 10)
        this.gl.clearColor(0, 0, 0, 1)
        this.gl.clearDepth(10)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
        this.gl.enable(this.gl.BLEND)
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
	    this.gl.disable(this.gl.DEPTH_TEST)

        // Render the objects onto the offscreen framebuffer
        this.draw(RENDER_LAYER.L0, RENDER_LAYER.U0)

        // Apply the screen texture onto the framebuffer and render onto screen
        this.drawToScreen()
        
        // Render the objects onto the screen
        this.gl.enable(this.gl.BLEND)
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)
        this.draw(RENDER_LAYER.U0, RENDER_LAYER.RENDER_LAYER_COUNT)
    }

    public drawToScreen() {
        this.gl.bindVertexArray(this.vao)

        // Get the screen's vbo, ibo, and program
        const program = this.effects[EFFECTS.SCREEN]
        const vbo = this.vertexBuffers[GEOMETRY.SCREEN]
        const ibo = this.indexBuffers[GEOMETRY.SCREEN]

        this.gl.useProgram(program)

        // Prepare the screen's framebuffer
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height)
        this.gl.depthRange(0.00001, 10)
        this.gl.clearColor(0, 0, 0, 1)
        this.gl.clearDepth(10)
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT)
        
        this.gl.disable(this.gl.BLEND)
	    this.gl.disable(this.gl.DEPTH_TEST)

        // Bind the buffers
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo)
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo)

        // Configure the vertex attribute pointer
        const positionLoc = this.gl.getAttribLocation(program, "in_pos")
        this.gl.enableVertexAttribArray(positionLoc)
        this.gl.vertexAttribPointer(positionLoc, 3, this.gl.FLOAT, false, 0, 0)

        // Set uniform data
        let darkenScreenFactor = 0
        if (registry.screenStates.length() > 0) {
            darkenScreenFactor = registry.screenStates.components[0].darkenScreenFactor
        }

        const darkenScreenFactorLoc = this.gl.getUniformLocation(program, "darken_screen_factor")
        this.gl.uniform1f(darkenScreenFactorLoc, darkenScreenFactor)

        // Bind the textures
        this.gl.activeTexture(this.gl.TEXTURE0)
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.offscreenFrameTexture)

        this.gl.drawElements(this.gl.TRIANGLES, 3, this.gl.UNSIGNED_SHORT, 0)

        // Unbind the offscreen framebuffer
        this.gl.bindTexture(this.gl.TEXTURE_2D, null)
        this.gl.bindVertexArray(null)
    }

    public draw(low: RENDER_LAYER, high: RENDER_LAYER) {
        if (registry.renderRequests.length() < 1) {
            return
        }

        // Sort the render requests by their layer
        registry.renderRequests.sort((a, b) => {
            const rr1 = registry.renderRequests.get(a)
            const rr2 = registry.renderRequests.get(b)

            return rr1.renderLayer - rr2.renderLayer
        }, false)


        // Find the set of entities to be rendered based on the given `low` and `high`
        let start = -1
        let end = -1

        if (registry.renderRequests.components[0].renderLayer > low) {
            start = 0
        }

        for (let i = 0; i < registry.renderRequests.length(); i++) {
            const component = registry.renderRequests.components[i]
            
            // Found the index of the first entity to be rendered
            if (component.renderLayer === low && start === -1) {
                start = i
                continue
            }
            
            // Found the index of the first entity NOT to be rendered
            if (component.renderLayer === high && end === -1) {
                end = i
                break
            }
        }
        

        // Validating the start and the end index values
        if (start === -1) 
            start = registry.renderRequests.length()
        if (end === -1)
            end = registry.renderRequests.length()
        
        // Render based on the render layers
        for (let i = start; i < end; i++) {
            const entity = registry.renderRequests.entities[i]

            if (!registry.motions.has(entity)) {
                continue
            }

            let renderRequest = registry.renderRequests.get(entity)
            let motion = registry.motions.get(entity)

            switch (renderRequest.geometry) {
                case GEOMETRY.RECTANGLE:
                case GEOMETRY.CIRCLE:
                    this.drawShapes(entity, renderRequest, motion)
                    break
                case GEOMETRY.TEXT:
                    this.drawText(entity, renderRequest, motion)
                    break
                default:
                    break
            }
        }        
    }

    public drawText(entity: number, renderRequest: RenderRequest, motion: Motion) {
        let program: WebGLProgram
        let vbo: WebGLBuffer
        let ibo: WebGLBuffer

        // Setup the program and buffers
        program = this.effects[renderRequest.effect]
        vbo = this.vertexBuffers[renderRequest.geometry]
        ibo = this.indexBuffers[renderRequest.geometry]
        
        // Bind the buffers
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo)
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo)

        // Get shader locations
        this.gl.useProgram(program)
        const transformLoc = this.gl.getUniformLocation(program, "transform")
        const projectionLoc = this.gl.getUniformLocation(program, "projection")
        const colorLoc = this.gl.getUniformLocation(program, "color")
        const positionLoc = this.gl.getAttribLocation(program, "in_position")

        if (transformLoc === null) throw Error("transformLoc")
        if (projectionLoc === null) throw Error("projectionLoc")
        if (colorLoc === null) throw Error("colorLoc")
        if (positionLoc === null) throw Error("positionLoc")

        // Get text information
        const text = registry.texts.get(entity)
        let glyph = this.characterMaps.get(text.content[0])
        if (glyph === undefined) throw Error(`Unrecognized character: ${text.content[0]} - ${text.content.charCodeAt(0)}`)
        
        // Render the text with the `position` attribute of their Motion component
        // as the center
        let x = motion.position[0] - motion.scale[0] / 2 + glyph.size[0] * text.scale / 2
        let y = motion.position[1]

        // Setup the text color in the shader
        this.gl.uniform4fv(colorLoc, renderRequest.color)

        // Setup the vertex attribute pointer
        this.gl.vertexAttribPointer(positionLoc, 4, this.gl.FLOAT, false, 0, 0)
        this.gl.enableVertexAttribArray(positionLoc)

        // Prepare the projection matrix
        const projectionMatrix = this.createProjectionMatrix()

        // Render each character
        for (const char of text.content) {
            // Get the glyph of the character
            glyph = this.characterMaps.get(char)
            if (glyph === undefined) throw Error(`Unrecognized character: ${char} - ${char.charCodeAt(0)}`)
            
            // Prepare the transformation matrix
            const transform = new Transform()
            transform.translate(vec2.fromValues(x, y))
            transform.rotate(motion.rotation)
            transform.scale(vec2.scale(vec2.create(), glyph.size, text.scale))

            let maxDimension = 0.5 * Math.max(glyph.size[0], glyph.size[1])
            let scaledWidth = glyph.size[0] / maxDimension // Scaled width onto the range [0, 2]
            let scaledHeight = glyph.size[1] / maxDimension // Scaled width onto the range [0, 2]

            const vertices = [
                -1, -1, 0.0, 0.0,
                -1, 1, 0.0, 1.0,
                1, 1, 1.0, 1.0,
                -1, -1, 0.0, 0.0,
                1, 1, 1.0, 1.0,
                1, -1, 1.0, 0.0,
            ]
            
            this.gl.bindTexture(this.gl.TEXTURE_2D, glyph.textureID)
            this.gl.activeTexture(this.gl.TEXTURE0)
            this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(vertices))

            this.gl.uniformMatrix3fv(transformLoc, false, transform.matrix)
            this.gl.uniformMatrix3fv(projectionLoc, false, projectionMatrix)

            this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0)

            x += (glyph.advance * text.scale)
        }
    }

    public drawShapes(entity: number, renderRequest: RenderRequest, motion: Motion) {
        let program: WebGLProgram
        let vbo: WebGLBuffer
        let ibo: WebGLBuffer

        // Select the programs and buffers
        program = this.effects[renderRequest.effect]
        vbo = this.vertexBuffers[renderRequest.geometry]
        ibo = this.indexBuffers[renderRequest.geometry]

        // Setup the program and buffers
        this.gl.useProgram(program)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vbo)
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ibo)

        // Define the transformation matrix
        let trans = new Transform()
        trans.translate(motion.position)
        trans.rotate(motion.rotation)
        trans.scale(motion.scale)

        // Configure program accordingly
        if (renderRequest.effect == EFFECTS.TRIANGLE) {
            const vertexLoc = this.gl.getAttribLocation(program, "in_position")
            this.gl.vertexAttribPointer(vertexLoc, 3, this.gl.FLOAT, false, 0, 0)
            this.gl.enableVertexAttribArray(vertexLoc)

            const projectionLoc = this.gl.getUniformLocation(program, "projection")
            const transformLoc = this.gl.getUniformLocation(program, "transform")
            const colorLoc = this.gl.getUniformLocation(program, "color")

            const projMatrix = this.createProjectionMatrix()
            const transMatrix = trans.toMat3()
            const color = renderRequest.color

            this.gl.uniformMatrix3fv(projectionLoc, false, projMatrix)
            this.gl.uniformMatrix3fv(transformLoc, false, transMatrix)
            this.gl.uniform4fv(colorLoc, color)
        }

        // Size of the index buffers -> in bytes
        const size: number = this.gl.getBufferParameter(this.gl.ELEMENT_ARRAY_BUFFER, this.gl.BUFFER_SIZE)
        const idx_count: number = size / 2 // divide by 2 since an index is 2 bytes

        this.gl.drawElements(this.gl.TRIANGLES, idx_count, this.gl.UNSIGNED_SHORT, 0)
    }

    private initializeFrameBuffers() {
        // Create a framebuffer
        this.offscreenFramebuffer = this.gl.createFramebuffer()
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.offscreenFramebuffer)
        
        // Initialize the framebuffer's texture
        this.offscreenFrameTexture = this.gl.createTexture()
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.offscreenFrameTexture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.canvas.width, this.gl.canvas.height, 
            0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)

        // Initialize the depth of the framebuffer
        this.offscreenFrameBufferDepth = this.gl.createRenderbuffer()
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this.offscreenFrameBufferDepth)
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D,
            this.offscreenFrameTexture, 0)
        this.gl.renderbufferStorage(
            this.gl.RENDERBUFFER, this.gl.DEPTH_COMPONENT16, this.gl.canvas.width, this.gl.canvas.height)
        this.gl.framebufferRenderbuffer(
            this.gl.FRAMEBUFFER, this.gl.DEPTH_ATTACHMENT, this.gl.RENDERBUFFER, this.offscreenFrameBufferDepth)

        // Check the status of the framebuffer
        if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE)
            throw Error("Failed to initialize the framebuffer.")
    }

    private initializeGeometryBuffers() {
        // Create the buffers
        let vBuffer: WebGLBuffer | null
        let iBuffer: WebGLBuffer | null
        let localGL: WebGL2RenderingContext = this.gl
        
        localGL.bindBuffer(localGL.ARRAY_BUFFER, null)
        localGL.bindBuffer(localGL.ELEMENT_ARRAY_BUFFER, null)

        for (let i = 0; i < GEOMETRY.GEOMETRY_COUNT; i++) {
            vBuffer = localGL.createBuffer()
            iBuffer = localGL.createBuffer()

            if (vBuffer === null || iBuffer === null) {
                return
            }

            this.vertexBuffers.push(vBuffer)
            this.indexBuffers.push(iBuffer)
        }
        
        //////////////////////////////////
        // 1. Initialize buffer for rectangles
        let vertices = [
            1.0, 1.0, 1,
            1.0, -1.0, 1,
            -1.0, -1.0, 1,
            -1.0, 1.0, 1
        ]
        let indices = [0, 1, 2, 0, 2, 3]

        localGL.bindBuffer(localGL.ARRAY_BUFFER, this.vertexBuffers[GEOMETRY.RECTANGLE])
        localGL.bindBuffer(localGL.ELEMENT_ARRAY_BUFFER, this.indexBuffers[GEOMETRY.RECTANGLE])

        localGL.bufferData(localGL.ARRAY_BUFFER, new Float32Array(vertices), localGL.STATIC_DRAW)
        localGL.bufferData(localGL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), localGL.STATIC_DRAW)

        ///////////////////////////////
        // 2. Initialize buffer for circle
        vertices = [0, 0, 1]
        indices = []

        // Populate the vertices array
        const numPartition = 30;

        for (let i = 0; i < numPartition; i++) {
            vertices.push(Math.cos(i * 2 * Math.PI / numPartition)) // Push the x-coordinate of the current point
            vertices.push(Math.sin(i * 2 * Math.PI / numPartition)) // Push the y-coordinate of the current point
            vertices.push(1)                                        // Push the z-coordinate of the current point
        }

        for (let i = 0; i < numPartition; i++) {
            indices.push(...[0, 1 + i % numPartition, 1 + (i + 1) % numPartition])
        }

        localGL.bindBuffer(localGL.ARRAY_BUFFER, this.vertexBuffers[GEOMETRY.CIRCLE])
        localGL.bindBuffer(localGL.ELEMENT_ARRAY_BUFFER, this.indexBuffers[GEOMETRY.CIRCLE])

        localGL.bufferData(localGL.ARRAY_BUFFER, new Float32Array(vertices), localGL.STATIC_DRAW)
        localGL.bufferData(localGL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), localGL.STATIC_DRAW)

        ///////////////////////////////////
        // 3. Initialize buffer for characters
        indices = [0,1,2,3,4,5,6]

        localGL.bindBuffer(localGL.ARRAY_BUFFER, this.vertexBuffers[GEOMETRY.TEXT])
        localGL.bindBuffer(localGL.ELEMENT_ARRAY_BUFFER, this.indexBuffers[GEOMETRY.TEXT])

        localGL.bufferData(localGL.ARRAY_BUFFER, new Float32Array(4 * 6), localGL.DYNAMIC_DRAW) // 6 * sizeof(vec4)
        localGL.bufferData(localGL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), localGL.DYNAMIC_DRAW) // 6 indices

        //////////////////////////////////
        // 4. Initialize buffer for screen

        vertices = [
            -1, -6, 0,
            6, -1, 0,
            -1, 6, 0
        ]
        indices = [0, 1, 2]

        localGL.bindBuffer(localGL.ARRAY_BUFFER, this.vertexBuffers[GEOMETRY.SCREEN])
        localGL.bindBuffer(localGL.ELEMENT_ARRAY_BUFFER, this.indexBuffers[GEOMETRY.SCREEN])

        localGL.bufferData(localGL.ARRAY_BUFFER, new Float32Array(vertices), localGL.STATIC_DRAW)
        localGL.bufferData(localGL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), localGL.STATIC_DRAW)
    }

    private initializeEffects() {
        const localGL = this.gl
        this.effects = []

        for (let i = 0; i < EFFECTS.EFFECTS_COUNT; i++) {
            const program = localGL.createProgram()
            const vShader = localGL.createShader(localGL.VERTEX_SHADER)
            const fShader = localGL.createShader(localGL.FRAGMENT_SHADER)

            if (vShader === null || fShader === null || program === null) {
                throw Error(`Failed to compile a shader program at index ${i}.`)
            }

            localGL.shaderSource(vShader, this.shaderSources[i][0])
            localGL.shaderSource(fShader, this.shaderSources[i][1])
            
            localGL.compileShader(vShader)
            localGL.compileShader(fShader)

            let shaderLog = localGL.getShaderInfoLog(vShader)
            if (shaderLog !== null && shaderLog.length > 0) throw Error(shaderLog)
            
            shaderLog = localGL.getShaderInfoLog(fShader)
            if (shaderLog !== null && shaderLog.length > 0) throw Error(shaderLog)

            localGL.attachShader(program, vShader)
            localGL.attachShader(program, fShader)

            localGL.linkProgram(program)
            
            localGL.deleteShader(vShader)
            localGL.deleteShader(fShader)

            this.effects.push(program)
        }
    }

    private initializeTextures() {
        ///////////////////////////////////////////////
        // Initialize character glyphs texture
        const fontBitmapCanvas = document.createElement("canvas")
        fontBitmapCanvas.width = staticManager.fontData.spaceMono.image.width
        fontBitmapCanvas.height = staticManager.fontData.spaceMono.image.height

        const ctx = fontBitmapCanvas.getContext("2d", { willReadFrequently: true })
        if (ctx === null) throw Error("Failed to initialize the context of the bitmap canvas.")

        ctx.drawImage(staticManager.fontData.spaceMono.image, 0, 0)

        for (const [char, glyph] of Object.entries(staticManager.fontData.spaceMono.info.glyphs)) {
            // Create a WebGL texture
            const texture = this.gl.createTexture()
            if (texture === null) throw Error("Failed to create a glyph texture.")

            // Get the image buffer data of the character from the font face
            const glyphData = ctx.getImageData(glyph.x, glyph.y, glyph.width, glyph.height)

            // Bind the glyph texture
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
            this.gl.texImage2D(
                this.gl.TEXTURE_2D, 0, this.gl.RGBA, glyphData.width, glyphData.height,
                0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, glyphData
            )

            // Set the texture options
            if (this.isPowerOf2(glyphData.width) && this.isPowerOf2(glyphData.height)) {
                this.gl.generateMipmap(this.gl.TEXTURE_2D)
            } else {
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)
            }

            // Store the glyph information
            this.characterMaps.set(char, new Character(
                texture, vec2.fromValues(glyph.width, glyph.height), glyph.xadvance
            ))
        }

        this.gl.bindTexture(this.gl.TEXTURE_2D, null)
    }

    private createProjectionMatrix() {
        const left = 0;
        const top = 0;

        const right = this.gl.canvas.width;
        const bottom =  this.gl.canvas.height;

        const sx = 2 / (right - left);
        const sy = 2 / (top - bottom);
        const tx = -(right + left) / (right - left);
        const ty = -(top + bottom) / (top - bottom);
        
        return mat3.fromValues(
            sx, 0, 0,
            0, sy, 0,
            tx, ty, 1
        )
    }

    private isPowerOf2(value: number) {
        return (value & (value - 1)) === 0
    }
}


export default RenderSystem