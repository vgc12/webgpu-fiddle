import React, {useState} from "react";
import {Popup} from "@/components/ui/popup.tsx";
import type {render_settings} from "@/types.tsx";

export function RenderSettings({renderSettings, onConfirm}: {
    renderSettings: render_settings | null;
    onConfirm: (settings: render_settings) => void;
}) {
    const [vertexDrawCount, setVertexDrawCount] = useState(renderSettings?.vertexDrawCount ?? 6);
    const [particleCount, setParticleCount] = useState(renderSettings?.instanceCount ?? 1);
    const [particleData, setParticleData] = useState<any[] | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            if (!Array.isArray(parsed)) {
                setFileError("JSON must be an array");
                return;
            }
            setFileError(null);
            setParticleData(parsed);
        } catch {
            setFileError("Invalid JSON");
        }
    }

    return (
        <Popup title="Render Settings">
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Vertex Draw Count</label>
                <input
                    type="number"
                    value={vertexDrawCount}
                    onChange={e => setVertexDrawCount(Number(e.target.value))}
                    className="px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600
                               bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Particle Count</label>
                <input
                    type="number"
                    value={particleCount}
                    onChange={e => setParticleCount(Number(e.target.value))}
                    className="px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600
                               bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Initial Particle Data</label>
                <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileChange}
                    className="px-3 py-2 rounded border border-neutral-300 dark:border-neutral-600
                               bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500
                               file:mr-3 file:py-1 file:px-3 file:rounded file:border-0
                               file:bg-neutral-200 dark:file:bg-neutral-700 file:text-sm"
                />
                {fileError && <p className="text-xs text-red-500">{fileError}</p>}
                {particleData && <p className="text-xs text-green-500"> File loaded ({particleCount} particles)</p>}
            </div>
            <button
                className="mt-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
                onClick={() => onConfirm({vertexDrawCount, instanceCount: particleCount, initialData: particleData})}
            >
                Confirm
            </button>
        </Popup>
    );
}
