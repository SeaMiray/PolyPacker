import React from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from '../utils/i18n';
import { getFilesFromEvent } from '../utils/fileHandler';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function FileDropZone({ onDrop }) {
    const { t } = useTranslation();
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        getFilesFromEvent,
        noClick: true,
        noKeyboard: true
    });

    return (
        <div
            {...getRootProps()}
            onClick={(e) => { e.stopPropagation(); document.getElementById('file-input').click(); }}
            className={cn(
                "border-2 border-dashed rounded-xl p-6 transition-all duration-300 ease-out cursor-pointer group relative overflow-hidden vintage-border",
                isDragActive
                    ? "border-primary bg-primary/15 scale-[0.99] glow-vintage"
                    : "border-primary/20 hover:border-primary/40 hover:bg-surface-light/50"
            )}
        >
            <input
                {...getInputProps()}
                id="file-input"
                className="hidden"
            />
            <div className="flex flex-col items-center justify-center text-center gap-2 relative z-10">
                <div className={cn(
                    "p-2 rounded-full transition-colors duration-300",
                    isDragActive ? "bg-primary/30 text-primary" : "bg-surface-light text-primary/60 group-hover:text-primary"
                )}>
                    <UploadCloud size={20} className={isDragActive ? "text-blue-400" : ""} />
                </div>
                <div>
                    <p className="text-sm font-medium text-cream group-hover:text-cream/90 transition-colors">
                        {isDragActive ? t('dropNow') : t('clickOrDrag')}
                    </p>
                    <p className="text-[10px] text-cream/40 mt-0.5">
                        FBX, OBJ, PNG, JPG, etc.
                    </p>
                </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
    );
}
