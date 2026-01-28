import type {StructInfo} from "@/graphics/shader-builder.tsx";

export interface ComputeConfig {
    count: number;
    inOutBufferStruct: StructInfo | null;
    workgroupSize: [number, number, number];
}