#version 300 es 

layout (location = 0) in vec3 in_position;

uniform mat3 transform;
uniform mat3 projection;

void main() {
    vec3 transformed_pos = projection * transform * vec3(in_position.xy, 1);
    
    gl_Position = vec4(transformed_pos.xy, in_position.z, 1);
}