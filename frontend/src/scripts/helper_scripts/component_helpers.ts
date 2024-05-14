import { vec2 } from "gl-matrix"
import { ALIGNMENT, Text } from "../ecs_scripts/components"
import { registry } from "../ecs_scripts/ecs_registry"
import RenderSystem from "../ecs_scripts/render_system"

/**
 * Set the `content` field of the text component and adjust the scales of the
 * text's motion component 
 * 
 * @param component 
 * @param content 
 */
function setTextContent(renderer: RenderSystem, entity: number, content: string) {
    const text = registry.texts.get(entity)
    const motion = registry.motions.get(entity)

    const scale = text.scale
    text.content = content

    let overallWidth = 0
    let overallHeight = 0
    
    let glyph = renderer.characterMaps.get(content[0])
    if (glyph === undefined) throw Error(`Unrecognized character: ${content[0]} - ${content.charCodeAt(0)}`)
    
    for (const ch of content) {
        glyph = renderer.characterMaps.get(content[0])
        if (glyph === undefined) throw Error(`Unrecognized character: ${content[0]} - ${content.charCodeAt(0)}`)
        
        overallWidth += glyph.advance * scale
        overallHeight = Math.max(glyph.size[1] * scale, overallHeight)
    }

    vec2.set(motion.scale, overallWidth, overallHeight)
}

function setTextAlignment(entity: number, x_position: number, alignment: ALIGNMENT) {
    const motion = registry.motions.get(entity)

    switch (alignment) {
        case ALIGNMENT.LEFT:
            motion.position[0] = x_position + motion.scale[0] / 2
            break
        case ALIGNMENT.RIGHT:
            motion.position[0] = x_position - motion.scale[0] / 2
            break
        case ALIGNMENT.CENTER:
        default:
            motion.position[0] = x_position
            break
    }
}

export { setTextContent, setTextAlignment }