#version 300 es

precision highp float;
layout (location = 0) in vec3 in_pos;

out vec2 texcoord;

void main() {
    gl_Position = vec4(in_pos.xy, 1, 1);
    texcoord = 0.5 * (in_pos.xy + vec2(1, 1));
}