import type {VertexAttribute} from "@/components/graphics/vertex-attribute.tsx";

export interface VertexBufferLayout {
    arrayStride: number;
    stepMode: GPUVertexStepMode;
    attributes: VertexAttribute[];
}