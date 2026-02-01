import type {shader_config} from "@/graphics/shader_config.tsx";

export interface IRenderer {
    start(): void;

    stop(): void;

    recompileShaders(newShaderConfig: shader_config): Promise<void>;

    recompileShaders(newShaderConfig: shader_config, options?: any): Promise<void>;

    destroy(): void;
}