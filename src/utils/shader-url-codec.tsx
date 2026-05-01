import {compressToEncodedURIComponent, decompressFromEncodedURIComponent} from "lz-string";
import {TEMPLATES} from "@/templates.tsx";
import type {render_settings, tab_id} from "@/types.tsx";

export type shared_shader_state = {
    template: string;
    renderSettings: { vertexDrawCount: number; instanceCount: number };
    shaders: Record<tab_id, string>;
}
/*
 * Encodes the template name, render settings such as vertex & instance count, and shaders are URL encoded
 * and then decoded when opening the link with a share param in the URL.
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
        },
        shaders: userShaders,
    };

    const compressed = compressToEncodedURIComponent(JSON.stringify(payload));
    return `${window.location.origin}${window.location.pathname}#share/${compressed}`;
}

/*
 * Decodes a URL when the site opens using a link with a share param
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

export function clearShareHash(): void {
    if (window.location.hash.startsWith('#share/')) {
        history.replaceState(null, '', window.location.pathname);
    }
}
