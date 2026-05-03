import {ButtonLightRectangle} from "@/components/ui/button.tsx";
import {Sun, Moon} from "lucide-react";
import type {dark_mode_props} from "@/types.tsx";
import {useRef, useState} from "react";

export function Toolbar({templateName, darkMode, onCompile, onChangeTemplate, onChangeRenderSettings, onDownload, onUpload, onShare}: {
    templateName: string;
    darkMode: dark_mode_props;
    onCompile: () => void;
    onChangeTemplate: () => void;
    onChangeRenderSettings: () => void;
    onDownload: () => void;
    onUpload: (file: File) => void;
    onShare: () => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showCopied, setShowCopied] = useState(false);

    return (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0">
            <span className="text-sm font-semibold dark:text-white mr-2">{templateName}</span>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
            <ButtonLightRectangle onClick={onCompile}>Compile</ButtonLightRectangle>
            <ButtonLightRectangle onClick={onChangeTemplate}>Template</ButtonLightRectangle>
            <ButtonLightRectangle onClick={onChangeRenderSettings}>Settings</ButtonLightRectangle>
            <ButtonLightRectangle onClick={() => {
                onShare();
                setShowCopied(true);
                setTimeout(() => setShowCopied(false), 2000);
            }}>{showCopied ? 'Copied!' : 'Share'}</ButtonLightRectangle>
            <ButtonLightRectangle onClick={onDownload}>Download</ButtonLightRectangle>
            <ButtonLightRectangle onClick={() => fileInputRef.current?.click()}>Upload</ButtonLightRectangle>
            <a href="https://webgpu-fiddle.vercel.app/docs/" target="_blank" rel="noopener noreferrer">
                <ButtonLightRectangle>Docs</ButtonLightRectangle>
            </a>
            <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(file);
                    e.target.value = "";
                }}
            />
            <div className="grow" />
            <button
                onClick={() => darkMode.setIsDarkMode(!darkMode.isDarkMode)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={darkMode.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {darkMode.isDarkMode
                    ? <Sun className="w-5 h-5 text-yellow-400" />
                    : <Moon className="w-5 h-5 text-gray-600" />
                }
            </button>
        </div>
    );
}
