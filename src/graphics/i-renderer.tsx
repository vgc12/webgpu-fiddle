import type {ShaderConfig} from "@/graphics/shader_config.tsx";

export interface IRenderer {
    start(): void;

    stop(): void;

    recompileShaders(newShaderConfig: ShaderConfig): Promise<void>;

    recompileShaders(newShaderConfig: ShaderConfig, options?: any): Promise<void>;

    destroy(): void;
}