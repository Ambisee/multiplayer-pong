#version 300 es

precision mediump float;

uniform sampler2D screen_texture;
uniform float darken_screen_factor;

in vec2 texcoord;

layout (location = 0) out vec4 color;

vec4 fade_color(vec4 in_color) 
{
	if (darken_screen_factor > 0.0) {
		in_color.xyz *= (1.0 - darken_screen_factor);
    }

    in_color.a = 1.0;
	return in_color;
}

void main()
{
    vec4 in_color = texture(screen_texture, texcoord);
    color = fade_color(in_color);
}