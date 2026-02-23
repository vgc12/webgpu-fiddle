import '../style.css'
import {useState} from "react";
import {useDarkMode} from "@/components/use-dark-mode.tsx";
import {ShaderWorkspace} from "@/components/shader-workspace.tsx";

const TABS = {
    compute: 'compute',
    vertex: 'vertex',
    fragment: 'fragment',
} as const;

export type tab_id = typeof TABS[keyof typeof TABS];


function ShaderSelector({
                            onSelect,
                        }: {
    onSelect: (type: 'canvas' | 'particle') => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-xl min-w-[300px]">
                <h2 className="text-lg font-semibold mb-4">Select Shader Type</h2>
                <div className="flex flex-col gap-3">
                    <button
                        className="px-4 py-3 rounded border border-neutral-300 dark:border-neutral-600
                       hover:bg-neutral-100 dark:hover:bg-neutral-700 text-left"
                        onClick={() => onSelect('canvas')}
                    >
                        <div className="font-medium">Canvas Shader</div>
                        <div className="text-sm text-neutral-500">Full-screen fragment shader</div>
                    </button>
                    <button
                        className="px-4 py-3 rounded border border-neutral-300 dark:border-neutral-600
                       hover:bg-neutral-100 dark:hover:bg-neutral-700 text-left"
                        onClick={() => onSelect('particle')}
                    >
                        <div className="font-medium">Particle Shader</div>
                        <div className="text-sm text-neutral-500">Compute + vertex/fragment pipeline</div>
                    </button>
                </div>
            </div>
        </div>
    );
}

function App() {
    useDarkMode();

    const [shaderType, setShaderType] = useState<'canvas' | 'particle' | null>(null);

    if (shaderType === null) {
        return <ShaderSelector onSelect={setShaderType}/>;
    }

    return (
        <ShaderWorkspace
            key={shaderType}
            shaderType={shaderType}
            onChangeType={() => setShaderType(null)}
        />
    );
}

export default App