import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckSquare, Square, Package } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from '../utils/i18n';
import { formatFileSize } from '../utils/zipExport';
import FileThumbnail from './FileThumbnail';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function FileList({
    files,
    filteredFiles,
    selectedFiles,
    onToggleSelection,
    onRemoveFile
}) {
    const { t } = useTranslation();

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
                {filteredFiles.map((file, index) => (
                    <motion.div
                        key={file.name}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className={cn(
                            "group flex items-center gap-2 p-2 rounded-lg border transition-all vintage-border",
                            selectedFiles.has(file.name)
                                ? "bg-primary/15 border-primary/40 shadow-inner"
                                : "bg-surface-light/30 hover:bg-surface-light/60 border-primary/10 hover:border-primary/25"
                        )}
                    >
                        <input
                            type="checkbox"
                            checked={selectedFiles.has(file.name)}
                            onChange={(e) => { e.stopPropagation(); onToggleSelection(file.name); }}
                            className="flex-shrink-0 w-3 h-3 rounded border border-primary/30 bg-transparent checked:bg-primary checked:border-primary cursor-pointer"
                        />
                        <FileThumbnail file={file} size={36} />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-cream/80 truncate group-hover:text-cream transition-colors" title={file.path || file.name}>
                                {file.path ? file.path.replace(/^\//, '') : file.name}
                            </p>
                            <p className="text-[9px] text-cream/40 font-mono">
                                {formatFileSize(file.size)}
                            </p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onRemoveFile(file.name); }}
                            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-danger/20 hover:text-danger text-cream/50 transition-all"
                        >
                            <X size={12} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>

            {filteredFiles.length === 0 && files.length > 0 && (
                <div className="h-32 flex items-center justify-center text-cream/30 text-sm italic">
                    {t('noMatchingFiles')}
                </div>
            )}

            {files.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-cream/20 gap-3 min-h-[200px]">
                    <div className="p-4 rounded-full bg-surface-light/30 border border-white/5">
                        <Package size={32} />
                    </div>
                    <p className="text-sm font-medium">{t('noFilesYet')}</p>
                </div>
            )}
        </div>
    );
}
