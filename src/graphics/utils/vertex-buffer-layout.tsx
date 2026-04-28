import type {VertexAttribute} from "@/graphics/utils/vertex-attribute.tsx";

// Describes how vertex data is laid out in a GPU buffer: stride between vertices,
// whether to step per-vertex or per-instance, and the list of attributes.
export interface VertexBufferLayout {
    arrayStride: number;
    stepMode: GPUVertexStepMode;
    attributes: VertexAttribute[];
}