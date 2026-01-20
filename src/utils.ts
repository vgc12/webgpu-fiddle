import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}


export function toCamelCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index)
    {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
}

export async function imageFileFromURL(url: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();

    await new Promise<void>((resolve, reject) =>
    {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
    });

    return new File([blob], url.split('/').pop() || 'default_albedo.png');
}

export async function fileFromURL(url: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], url.split('/').pop() || 'default');
}

export async function imageExists(url: string) {

    try {
        const response = await fetch(url, {method: 'HEAD'});
    
        return response.ok && response.headers.get('content-type')?.startsWith('image/');
    } catch {

        return false;
    }

}

export const BUCKET_URL = 'https://webgpu-renderer-data.s3.amazonaws.com'