import type {StructInfo} from "@/graphics/shader-builder.tsx";

export interface ComputeConfig {
    particleCount: number;
    initialData: any[] | null;
    inOutBufferStruct: StructInfo | null;
    workgroupSize: [number, number, number];
}