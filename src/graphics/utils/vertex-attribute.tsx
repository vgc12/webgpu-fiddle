// A single vertex attribute: maps a shader location to a byte offset and GPU format.
export interface VertexAttribute {
    shaderLocation: number;
    offset: number;
    format: GPUVertexFormat;
}