#version 300 es

precision highp float;

in vec2 tex_coord;

uniform vec4 color;
uniform sampler2D tex;

out vec4 out_color;

void main() {
    float alpha;
    float threshold = 0.1;
    vec4 pixel_color = texture(tex, tex_coord);


    if (pixel_color.r < threshold && pixel_color.g < threshold && pixel_color.b < threshold) {
        alpha = 0.0;
    } else {
        alpha = 1.0;
    }

    vec4 sampled = vec4(1, 1, 1, alpha);
    out_color = color * sampled;
}