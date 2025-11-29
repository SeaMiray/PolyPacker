import React from 'react';
import { FolderOpen, Trash2, Search, FolderUp, CheckSquare, Square } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from '../utils/i18n';
import FileDropZone from './FileDropZone';
import FileList from './FileList';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Sidebar({
    files,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    fileCounts,
    onDrop,
    folderInputRef,
    handleFolderUpload,
    selectedFiles,
    selectAll,
    deselectAll,
    deleteSelected,
    filteredFiles,
    onToggleSelection,
    onRemoveFile,
    onClearAll
}) {
    const { t } = useTranslation();

    return (
        <div className="w-[420px] border-r border-primary/10 flex flex-col bg-surface">
            <div className="h-16 px-6 border-b border-primary/10 flex items-center justify-between bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
                <h2 className="font-semibold flex items-center gap-3 text-sm tracking-wide text-primary">
                    <div className="p-1.5 bg-primary/20 rounded-md text-primary border border-primary/30">
                        <FolderOpen size={16} />
                    </div>
                    Input Sources
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-cream/60 bg-primary/10 px-2 py-1 rounded-full retro-inset">{files.length}</span>
                    {files.length > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onClearAll(); }}
                            className="p-1.5 rounded-md hover:bg-danger/20 hover:text-danger text-cream/50 transition-all"
                            title="Clear all files"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
                {/* Search & Filter */}
                <div className="space-y-2">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('searchFiles')}
                            className="w-full bg-surface-light border border-primary/20 rounded-lg pl-9 pr-3 py-2 text-sm text-cream placeholder-cream/30 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-all retro-inset"
                        />
                    </div>

                    <div className="flex gap-1 text-xs">
                        {['all', 'models', 'textures', 'source', 'other'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={cn(
                                    "px-2 py-1 rounded transition-all retro-button",
                                    filterType === type
                                        ? "bg-primary/30 text-cream border border-primary/50 shadow-inner"
                                        : "bg-surface-light/50 text-cream/60 border border-primary/10 hover:border-primary/30"
                                )}
                            >
                                {type} ({fileCounts[type]})
                            </button>
                        ))}
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full bg-surface-light border border-primary/20 rounded-lg px-3 py-1.5 text-xs text-cream focus:outline-none focus:border-primary/60 transition-all retro-inset"
                    >
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="size-asc">Size (Small-Large)</option>
                        <option value="size-desc">Size (Large-Small)</option>
                    </select>
                </div>

                {/* Drop Zone */}
                <FileDropZone onDrop={onDrop} />

                {/* Folder Upload Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
                    className="flex items-center justify-center gap-2 px-3 py-2 border border-primary/20 rounded-lg hover:bg-primary/10 hover:border-primary/50 text-cream/70 hover:text-primary transition-all text-xs font-medium retro-button"
                >
                    <FolderUp size={14} />
                    Upload Folder
                </button>
                <input
                    ref={folderInputRef}
                    type="file"
                    webkitdirectory=""
                    directory=""
                    multiple
                    onChange={handleFolderUpload}
                    className="hidden"
                />

                {/* Batch Operations */}
                {files.length > 0 && (
                    <div className="flex items-center gap-2 text-xs border-t border-white/5 pt-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); selectAll(); }}
                            className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            <CheckSquare size={12} />
                            All
                        </button>
                        <span className="text-gray-700">|</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); deselectAll(); }}
                            className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            <Square size={12} />
                            None
                        </button>
                        {selectedFiles.size > 0 && (
                            <>
                                <span className="text-gray-700">|</span>
                                <span className="text-gray-400">{selectedFiles.size} selected</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteSelected(); }}
                                    className="ml-auto text-red-400 hover:text-red-300 transition-colors"
                                >
                                    Delete
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* File List */}
                <FileList
                    files={files}
                    filteredFiles={filteredFiles}
                    selectedFiles={selectedFiles}
                    onToggleSelection={onToggleSelection}
                    onRemoveFile={onRemoveFile}
                />
            </div>
        </div>
    );
}
