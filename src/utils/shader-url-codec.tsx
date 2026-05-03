import {compressToEncodedURIComponent, decompressFromEncodedURIComponent} from "lz-string";
import {TEMPLATES} from "@/templates.tsx";
import type {render_settings, tab_id} from "@/types.tsx";

/** Compact representation of an array where most values are zero. Stores only non-zero entries as [index, value] pairs. */
type sparse_data = { length: number; entries: [number, any][] };

/** The full state encoded into a shareable URL: template name, render settings, and all shader source code. */
export type shared_shader_state = {
    template: string;
    renderSettings: { vertexDrawCount: number; instanceCount: number; sparseData?: sparse_data };
    shaders: Record<tab_id, string>;
}

/**
 * Converts an array to sparse representation by keeping only non-zero, non-null entries.
 * Returns undefined if data is null.
 * @param data - The full initial data array, or null if none was uploaded.
 */
function toSparse(data: any[] | null): sparse_data | undefined {
    if (!data) return undefined;
    const entries: [number, any][] = [];
    for (let i = 0; i < data.length; i++) {
        const v = data[i];
        if (v !== 0 && v !== null) entries.push([i, v]);
    }
    return { length: data.length, entries };
}

/**
 * Reconstructs a full array from its sparse representation, filling gaps with zeros.
 * @param sparse - The sparse data containing the original length and non-zero entries.
 */
export function fromSparse(sparse: sparse_data): any[] {
    const data = new Array(sparse.length).fill(0);
    for (const [i, v] of sparse.entries) {
        data[i] = v;
    }
    return data;
}

/**
 * Encodes the current workspace state into a shareable URL. The template name, render settings
 * sparse initial data, and all shader source code are JSON-serialized, compressed
 * with lz-string, and appended as a URL hash fragment.
 * @param templateName - The name of the active template.
 * @param renderSettings - Current render settings including any uploaded initial data.
 * @param userShaders - The user's shader source code for each tab.
 */
export function encodeShareUrl(
    templateName: string,
    renderSettings: render_settings,
    userShaders: Record<tab_id, string>,
): string {
    const payload: shared_shader_state = {
        template: templateName,
        renderSettings: {
            vertexDrawCount: renderSettings.vertexDrawCount,
            instanceCount: renderSettings.instanceCount,
            sparseData: toSparse(renderSettings.initialData),
        },
        shaders: userShaders,
    };

    const compressed = compressToEncodedURIComponent(JSON.stringify(payload));
    return `${window.location.origin}${window.location.pathname}#share/${compressed}`;
}


/**
 * Decodes a shared workspace state from the current URL's hash fragment.
 * Returns null if no share fragment is present, the data is malformed, or
 * the referenced template does not exist.
 */
export function decodeShareUrl(): shared_shader_state | null {
    const hash = window.location.hash;
    if (!hash.startsWith('#share/')) return null;

    const compressed = hash.slice('#share/'.length);
    if (!compressed) return null;

    try {
        const json = decompressFromEncodedURIComponent(compressed);
        if (!json) return null;

        const parsed = JSON.parse(json) as shared_shader_state;

        if (!parsed.template || !parsed.shaders || !parsed.renderSettings) return null;

        const templateExists = TEMPLATES.some(t => t.name === parsed.template);
        if (!templateExists) return null;

        return parsed;
    } catch {
        return null;
    }
}

/** Removes the share hash fragment from the URL after the shared state has been consumed. */
export function clearShareHash(): void {
    if (window.location.hash.startsWith('#share/')) {
        history.replaceState(null, '', window.location.pathname);
    }
}
