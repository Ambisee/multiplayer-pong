import fs from "fs"
import path from "path"

interface ShaderSources {
    [key: string]: {
        vertexSource: {
            path: string,
            content: string
        },
        fragmentSource: {
            path: string,
            content: string
        }
    }
}

interface GlyphInfo {
    x: number,
    y: number,
    width: number,
    height: number,
    xoffset: number,
    yoffset: number,
    xadvance: number,
    page: number,
    chnl: number
}

interface FontData {
    [key: string]: {
        info: {
            count: number,
            lineHeight: number,
            size: number,
            glyphs: {
                [key: string]: GlyphInfo
            }
        },
        image: HTMLImageElement
    }
}

class StaticAssetManager {
    public fontData: FontData = {
        spaceMono: {
            info: {count: 0, lineHeight: 0, size: 0, glyphs: {}},
            image: new Image()
        }
    }
    public shaderSources: ShaderSources = {
        shape: {
            vertexSource: {
                path: "../../shaders/shape.vs.glsl",
                content: ""
            },
            fragmentSource: {
                path: "../../shaders/shape.fs.glsl",
                content: ""
            }
        },
        text: {
            vertexSource: {
                path: "../../shaders/text.vs.glsl",
                content: ""
            },
            fragmentSource: {
                path: "../../shaders/text.fs.glsl",
                content: ""
            }
        },
        screen: {
            vertexSource: {
                path: "../../shaders/screen.vs.glsl",
                content: ""
            },
            fragmentSource: {
                path: "../../shaders/screen.fs.glsl",
                content: ""
            }
        }
    }


    public constructor() {
        
    }

    public async retrieve() {
        // Retrieve shader sources
        
        // const sourceFetches: Promise<void>[] = []
        // for (const key in this.shaderSources) {
        //     const vSrc = this.shaderSources[key].vertexSource
        //     const fSrc = this.shaderSources[key].fragmentSource

        //     sourceFetches.push(...[
        //         fetch(vSrc.path).then((val) => val.text()).then(val => {vSrc.content = val}),
        //         fetch(fSrc.path).then((val) => val.text()).then(val => {fSrc.content = val})
        //     ])
        // }

        // await Promise.all(sourceFetches)

        this.shaderSources.shape.vertexSource.content = fs.readFileSync(path.join(__dirname, "../../shaders/shape.vs.glsl"), "utf-8")
        this.shaderSources.shape.fragmentSource.content = fs.readFileSync(path.join(__dirname, "../../shaders/shape.fs.glsl"), "utf-8")
        this.shaderSources.text.vertexSource.content = fs.readFileSync(path.join(__dirname, "../../shaders/text.vs.glsl"), "utf-8")
        this.shaderSources.text.fragmentSource.content = fs.readFileSync(path.join(__dirname, "../../shaders/text.fs.glsl"), "utf-8")
        this.shaderSources.screen.vertexSource.content = fs.readFileSync(path.join(__dirname, "../../shaders/screen.vs.glsl"), "utf-8")
        this.shaderSources.screen.fragmentSource.content = fs.readFileSync(path.join(__dirname, "../../shaders/screen.fs.glsl"), "utf-8")

        // Retrieve font related data
        this.fontData.spaceMono.info = JSON.parse(
            fs.readFileSync(path.join(__dirname, "../../assets/fonts/Space_mono.json"), "utf-8")
        )

        const fontFaceImage = new Image()
        await new Promise((resolve, reject) => {
            fontFaceImage.onload = (e) => resolve(e)
            fontFaceImage.onerror = (e) => reject(e)
            fontFaceImage.src = (new URL("../../assets/fonts/Space_mono.png", import.meta.url)).toString()
        })
        
        this.fontData.spaceMono.image = fontFaceImage
    }
}

const staticManager = new StaticAssetManager()

export {
    staticManager
}