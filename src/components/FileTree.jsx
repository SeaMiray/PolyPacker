import React, { useState } from 'react';
import { Folder, FolderOpen, File, FileImage, Box, FileCode, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatFileSize } from '../utils/zipExport';

function getFileIcon(filename) {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();

    if (['.png', '.jpg', '.jpeg', '.tga', '.psd', '.exr'].includes(ext)) {
        return <FileImage size={14} className="text-purple-400" />;
    }
    if (['.fbx', '.obj', '.blend'].includes(ext)) {
        return <Box size={14} className="text-blue-400" />;
    }
    if (['.cs', '.js', '.ts', '.cpp', '.h'].includes(ext)) {
        return <FileCode size={14} className="text-green-400" />;
    }
    return <FileText size={14} className="text-gray-400" />;
}

function FileTreeNode({ name, value, level = 0 }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const isFolder = !Array.isArray(value) && name !== '_root';
    const files = Array.isArray(value) ? value : [];

    if (name === '_root') {
        // Root files (no folder)
        return (
            <>
                {files.map((file, index) => (
                    <motion.div
                        key={`${file.name}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center gap-2 py-1.5 px-3 text-sm text-gray-300 hover:bg-white/[0.02] rounded group"
                    >
                        {getFileIcon(file.name)}
                        <span className="flex-1 truncate">{file.name}</span>
                        <span className="text-[10px] text-gray-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatFileSize(file.size)}
                        </span>
                    </motion.div>
                ))}
            </>
        );
    }

    if (isFolder) {
        const childFolders = Object.entries(value).filter(([k, v]) => !Array.isArray(v) && k !== '_root');
        const childFiles = Array.isArray(value) ? value : Object.entries(value).filter(([k, v]) => Array.isArray(v)).flatMap(([_, v]) => v);
        const totalFiles = childFiles.length + childFolders.reduce((acc, [_, v]) => acc + countFiles(v), 0);

        return (
            <div>
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 py-1.5 px-3 text-sm cursor-pointer hover:bg-white/[0.02] rounded group"
                    style={{ paddingLeft: `${level * 16 + 12}px` }}
                >
                    <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-gray-500"
                    >
                        <ChevronRight size={14} />
                    </motion.div>
                    {isExpanded ? (
                        <FolderOpen size={14} className="text-yellow-500" />
                    ) : (
                        <Folder size={14} className="text-yellow-600" />
                    )}
                    <span className="flex-1 font-medium text-gray-200 group-hover:text-white transition-colors">
                        {name}
                    </span>
                    <span className="text-[10px] text-gray-600 bg-white/5 px-1.5 py-0.5 rounded-full font-mono">
                        {totalFiles}
                    </span>
                </div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            {Object.entries(value).map(([childName, childValue]) => (
                                <FileTreeNode key={childName} name={childName} value={childValue} level={level + 1} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // Files in a folder
    return (
        <div style={{ paddingLeft: `${level * 16 + 12}px` }}>
            {files.map((file, index) => (
                <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center gap-2 py-1.5 px-3 text-sm text-gray-300 hover:bg-white/[0.02] rounded group"
                >
                    <div className="w-[14px]" /> {/* Spacer for chevron */}
                    {getFileIcon(file.name)}
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-[10px] text-gray-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatFileSize(file.size)}
                    </span>
                </motion.div>
            ))}
        </div>
    );
}

function countFiles(value) {
    if (Array.isArray(value)) return value.length;
    let count = 0;
    for (const v of Object.values(value)) {
        count += countFiles(v);
    }
    return count;
}

export default function FileTree({ structure }) {
    if (!structure || Object.keys(structure).length === 0) {
        return (
            <div className="flex items-center justify-center h-32 text-gray-600 text-sm italic">
                No files to preview
            </div>
        );
    }

    return (
        <div className="space-y-0.5">
            {Object.entries(structure).map(([name, value]) => (
                <FileTreeNode key={name} name={name} value={value} />
            ))}
        </div>
    );
}
