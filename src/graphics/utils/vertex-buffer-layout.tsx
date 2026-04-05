import type {VertexAttribute} from "@/graphics/utils/vertex-attribute.tsx";

export interface VertexBufferLayout {
    arrayStride: number;
    stepMode: GPUVertexStepMode;
    attributes: VertexAttribute[];
}