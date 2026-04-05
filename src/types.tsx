import type {ShaderConfig} from "@/graphics/shaders/shader-config.tsx";

export type dark_mode_props = {
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
}

const TABS = {
    compute: 'compute',
    vertex: 'vertex',
    fragment: 'fragment',
} as const;

export type tab_id = typeof TABS[keyof typeof TABS];

export type render_settings = {
    vertexDrawCount: number;
    instanceCount: number;
    initialData: any[] | null;
}

export type template_def = {
    name: string;
    description: string;
    shaderType: 'canvas' | 'particle';
    shaderConfig: ShaderConfig;
    defaultRenderSettings: render_settings;
}
