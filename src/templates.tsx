import {
    RaymarchShaderConfig,
    GolShaderConfig,
    ParticleShaderConfig,
    BlankShaderConfig,
    BlankParticleConfig
} from "@/graphics/shaders/shader-builder.tsx";
import type {template_def} from "@/types.tsx";

export const TEMPLATES: template_def[] = [
    {
        name: 'Blank Canvas',
        description: 'A blank full-screen vertex & fragment shader',
        shaderType: 'canvas',
        shaderConfig: BlankShaderConfig,
        defaultRenderSettings: {vertexDrawCount: 3, instanceCount: 1, initialData: null}
    },
    {
        name: 'Canvas SDF',
        description: 'Full-screen vertex & fragment shader demonstrating ray marching',
        shaderType: 'canvas',
        shaderConfig: RaymarchShaderConfig,
        defaultRenderSettings: {vertexDrawCount: 3, instanceCount: 1, initialData: null},
    },
    {
        name: 'Blank Particle',
        description: 'A blank particle template with an input & output buffer',
        shaderType: 'particle',
        shaderConfig: BlankParticleConfig,
        defaultRenderSettings: {vertexDrawCount: 6, instanceCount: 2500, initialData: null}
    },
    {
        name: 'Particle Simulation',
        description: 'Compute + vertex/fragment particle pipeline',
        shaderType: 'particle',
        shaderConfig: ParticleShaderConfig,
        defaultRenderSettings: {vertexDrawCount: 6, instanceCount: 2000, initialData: null},
    },
    {
        name: 'Game of Life',
        description: "Conway's Game of Life via compute shader",
        shaderType: 'particle',
        shaderConfig: GolShaderConfig,
        defaultRenderSettings: {vertexDrawCount: 6, instanceCount: 1024 * 1024, initialData: null},
    },
];
