import type {VertexAttribute} from "@/graphics/vertex-attribute.tsx";

export interface VertexBufferLayout {
    arrayStride: number;
    stepMode: GPUVertexStepMode;
    attributes: VertexAttribute[];
}