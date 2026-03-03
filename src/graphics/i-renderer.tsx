import type {ShaderConfig} from "@/graphics/shader-config.tsx";

export interface IRenderer {
    readonly device: GPUDevice | null;

    start(): Promise<void>;

    stop(): void;

    resize(width: number, height: number): void;

    recompileShaders(newShaderConfig: ShaderConfig): Promise<void>;

    recompileShaders(newShaderConfig: ShaderConfig, options?: any): Promise<void>;

    destroy(): void;
}