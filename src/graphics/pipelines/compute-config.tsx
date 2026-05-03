import type {StructInfo} from "@/graphics/shaders/shader-builder.tsx";

/** Configuration for a compute pipeline: how many particles, the parsed struct
 layout for the input/output buffers, the workgroup size from the shader,
 and optional initial data from a user-uploaded JSON file.
*/
export interface ComputeConfig {
    particleCount: number;
    initialData: any[] | null;
    inOutBufferStruct: StructInfo | null;
    workgroupSize: [number, number, number];
}