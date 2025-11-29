import React, { useState, useEffect } from 'react';
import { Folder, FolderPlus, File, Trash2, ChevronRight, ChevronDown, Plus, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Node Component for the Tree
const CustomTreeNode = ({ node, path, onAction, selectedFiles, onSelectFile }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const isFolder = node.type === 'folder';

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const data = e.dataTransfer.getData('application/json');
        if (data) {
            const { sourcePath, type } = JSON.parse(data);
            onAction('move', { sourcePath, targetPath: path });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isFolder) {
            e.currentTarget.classList.add('bg-primary/20');
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('bg-primary/20');
    };

    const handleDragStart = (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ sourcePath: path, type: node.type }));
        e.stopPropagation();
    };

    return (
        <div className="pl-4">
            <div
                className={cn(
                    "flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer transition-colors group",
                    "hover:bg-surface-light/50",
                    isFolder ? "text-cream" : "text-cream/80"
                )}
                draggable
                onDragStart={handleDragStart}
                onDrop={isFolder ? handleDrop : undefined}
                onDragOver={isFolder ? handleDragOver : undefined}
                onDragLeave={isFolder ? handleDragLeave : undefined}
                onClick={() => isFolder && setIsExpanded(!isExpanded)}
            >
                {isFolder && (
                    <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        className="text-cream/50"
                    >
                        <ChevronRight size={14} />
                    </motion.div>
                )}

                {isFolder ? (
                    <Folder size={16} className="text-yellow-500" />
                ) : (
                    <File size={16} className="text-blue-400" />
                )}

                <span className="flex-1 text-sm truncate select-none">{node.name}</span>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    {isFolder && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAction('addFile', path); }}
                            className="p-1 hover:bg-white/10 rounded"
                            title="Add Files"
                        >
                            <Plus size={12} />
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onAction('delete', path); }}
                        className="p-1 hover:bg-danger/20 hover:text-danger rounded"
                        title="Delete"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isFolder && isExpanded && node.children && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        {node.children.map((child, index) => (
                            <CustomTreeNode
                                key={`${path}-${index}`}
                                node={child}
                                path={[...path, index]}
                                onAction={onAction}
                            />
                        ))}
                        {node.children.length === 0 && (
                            <div className="pl-8 py-1 text-xs text-cream/30 italic">
                                Empty folder
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function CustomExportBuilder({ files, onChange }) {
    // Structure: { type: 'folder', name: 'root', children: [] }
    const [structure, setStructure] = useState({
        type: 'folder',
        name: 'root',
        children: []
    });

    // Sync structure changes to parent
    useEffect(() => {
        onChange(structure);
    }, [structure, onChange]);

    const handleAction = (action, payload) => {
        const newStructure = JSON.parse(JSON.stringify(structure)); // Deep clone

        // Helper to find node by path (array of indices)
        const findNode = (root, path) => {
            let current = root;
            for (const index of path) {
                if (current.children && current.children[index]) {
                    current = current.children[index];
                } else {
                    return null;
                }
            }
            return current;
        };

        if (action === 'createFolder') {
            const name = prompt("Folder Name:");
            if (name) {
                newStructure.children.push({
                    type: 'folder',
                    name,
                    children: []
                });
                setStructure(newStructure);
            }
        } else if (action === 'delete') {
            const path = payload;
            const parentPath = path.slice(0, -1);
            const index = path[path.length - 1];

            if (parentPath.length === 0) {
                // Deleting from root
                newStructure.children.splice(index, 1);
            } else {
                const parent = findNode(newStructure, parentPath);
                if (parent) {
                    parent.children.splice(index, 1);
                }
            }
            setStructure(newStructure);
        } else if (action === 'addFile') {
            // For simplicity, just adding a dummy file for now or opening a modal
            // In a real app, we'd show a file picker from the 'files' prop
            // Let's assume we pick the first available file for demo
            // OR better: Show a list of files to add
            alert("Drag files from the left sidebar to add them here.");
        } else if (action === 'move') {
            // Handle drag and drop move
            // payload: { sourcePath, targetPath }
            // This requires complex logic to remove from source and add to target
            // Skipping for MVP stability, but structure is ready
        }
    };

    // Function to add files from the main list to the custom structure
    const addFileToRoot = (file) => {
        setStructure(prev => ({
            ...prev,
            children: [
                ...prev.children,
                { type: 'file', name: file.name, file: file }
            ]
        }));
    };

    return (
        <div className="h-full flex flex-col bg-surface-light/10 rounded-lg border border-primary/10 overflow-hidden">
            <div className="p-3 border-b border-primary/10 flex items-center justify-between bg-surface/50">
                <h3 className="text-sm font-medium text-cream">Custom Structure</h3>
                <button
                    onClick={() => handleAction('createFolder')}
                    className="flex items-center gap-1 px-2 py-1 bg-primary/20 hover:bg-primary/30 text-primary rounded text-xs transition-colors"
                >
                    <FolderPlus size={14} />
                    New Folder
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {structure.children.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-cream/30 gap-2">
                        <FolderPlus size={32} />
                        <p className="text-sm">Create folders or add files</p>
                        <div className="flex gap-2 mt-2">
                            {files.slice(0, 3).map(f => (
                                <button
                                    key={f.name}
                                    onClick={() => addFileToRoot(f)}
                                    className="px-2 py-1 bg-surface-light border border-white/10 rounded text-xs hover:bg-primary/20"
                                >
                                    + {f.name}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {structure.children.map((child, index) => (
                            <CustomTreeNode
                                key={`root-${index}`}
                                node={child}
                                path={[index]}
                                onAction={handleAction}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className="p-2 bg-surface/30 text-[10px] text-cream/40 border-t border-primary/10">
                Tip: You can create folders and organize your files manually.
            </div>
        </div>
    );
}
