#version 300 es

precision highp float;
uniform vec4 color;

out vec4 out_color;

void main() {
    out_color = color;
}