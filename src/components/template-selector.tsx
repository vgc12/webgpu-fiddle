import {ButtonLightRectangle} from "@/components/ui/button.tsx";
import {Popup} from "@/components/ui/popup.tsx";
import {TEMPLATES} from "@/templates.tsx";
import type {template_def} from "@/types.tsx";

export function TemplateSelector({onConfirm}: { onConfirm: (template: template_def) => void }) {
    return (
        <Popup title="Select Template">
            {TEMPLATES.map((template) => (
                <ButtonLightRectangle
                    key={template.name}
                    className="px-4 py-3 rounded border border-neutral-300 dark:border-neutral-600
                           hover:bg-neutral-100 dark:hover:bg-neutral-700 text-left"
                    onClick={() => onConfirm(template)}
                >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-sm text-neutral-500">{template.description}</div>
                </ButtonLightRectangle>
            ))}
        </Popup>
    );
}
