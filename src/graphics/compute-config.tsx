import type {StructInfo} from "@/graphics/shader-builder.tsx";

export interface ComputeConfig {
    particleCount: number;
    inOutBufferStruct: StructInfo | null;
    workgroupSize: [number, number, number];
}