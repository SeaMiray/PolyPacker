import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Folder, FolderOpen, File, ChevronRight, ChevronDown } from 'lucide-react';
import { getFileExtension } from '../utils/presets';
import { formatFileSize } from '../utils/zipExport';

function getFileIcon(filename) {
    const ext = getFileExtension(filename);
    return <File size={14} className="text-gray-400" />;
}

function PreviewNode({ name, files, level = 0, isLast = false }) {
    const [isExpanded, setIsExpanded] = React.useState(true);

    if (Array.isArray(files)) {
        // Leaf node with files
        return (
            <div style={{ paddingLeft: `${level * 20}px` }}>
                {files.map((file, index) => (
                    <motion.div
                        key={`${file.name}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center gap-2 py-1.5 px-2 text-sm text-gray-300 hover:bg-white/[0.02] rounded"
                    >
                        {getFileIcon(file.name)}
                        <span className="flex-1 truncate">{file.name || file}</span>
                        <span className="text-[10px] text-gray-600 font-mono">
                            {formatFileSize(file.size || 0)}
                        </span>
                    </motion.div>
                ))}
            </div>
        );
    }

    // Folder node
    const childCount = Object.values(files).reduce((sum, val) => {
        if (Array.isArray(val)) return sum + val.length;
        return sum + Object.keys(val).length;
    }, 0);

    return (
        <div style={{ paddingLeft: `${level * 20}px` }}>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 py-1.5 px-2 text-sm cursor-pointer hover:bg-white/[0.02] rounded group"
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
                    {childCount}
                </span>
            </div>

            {isExpanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                >
                    {Object.entries(files).map(([childName, childValue], index) => (
                        <PreviewNode
                            key={childName}
                            name={childName}
                            files={childValue}
                            level={level + 1}
                            isLast={index === Object.entries(files).length - 1}
                        />
                    ))}
                </motion.div>
            )}
        </div>
    );
}

export default function PreviewPanel({ selectedPreset, files, customName }) {
    const structure = useMemo(() => {
        if (files.length === 0) return null;

        if (selectedPreset === 'FAB') {
            // Group models by extension
            const modelGroups = {};
            const textureFiles = [];

            files.forEach(file => {
                const ext = getFileExtension(file.name).substring(1).toUpperCase();
                const isModel = ['FBX', 'OBJ', 'GLB', 'GLTF'].includes(ext);

                if (isModel) {
                    if (!modelGroups[ext]) modelGroups[ext] = [];
                    modelGroups[ext].push(file);
                } else if (file.path && /textures?/i.test(file.path)) {
                    textureFiles.push(file);
                }
            });

            return {
                type: 'fab',
                packages: Object.entries(modelGroups).map(([ext, models]) => ({
                    name: `${customName}_${ext}`,
                    models,
                    textures: textureFiles
                }))
            };
        } else if (selectedPreset === 'Booth') {
            const categorized = {
                Mesh: [],
                Textures: [],
                Unity: [],
                Source: []
            };

            files.forEach(file => {
                const ext = getFileExtension(file.name);
                if (['.fbx', '.obj', '.glb', '.gltf'].includes(ext)) {
                    categorized.Mesh.push(file);
                } else if (['.png', '.jpg', '.jpeg', '.tga', '.exr', '.psd'].includes(ext)) {
                    categorized.Textures.push(file);
                } else if (ext === '.unitypackage') {
                    categorized.Unity.push(file);
                } else if (['.blend', '.max', '.ma', '.mb'].includes(ext)) {
                    categorized.Source.push(file);
                }
            });

            return {
                type: 'booth',
                root: `${customName}Assets`,
                categories: categorized
            };
        }

        return null;
    }, [selectedPreset, files, customName]);

    if (!structure) {
        return (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm italic">
                No preview available
            </div>
        );
    }

    if (structure.type === 'fab') {
        return (
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <Folder size={14} />
                    FAB Package Structure ({structure.packages.length} {structure.packages.length === 1 ? 'package' : 'packages'})
                </h3>
                {structure.packages.map((pkg, index) => (
                    <div key={pkg.name} className="border border-white/5 rounded-lg p-4 bg-white/[0.01]">
                        <div className="flex items-center gap-2 mb-3">
                            <FolderOpen size={16} className="text-blue-400" />
                            <span className="font-semibold text-white">{pkg.name}.zip</span>
                        </div>
                        <div className="space-y-1 pl-4">
                            <PreviewNode name={pkg.name} files={{
                                [pkg.name]: pkg.models,
                                'Textures': pkg.textures.length > 0 ? pkg.textures : []
                            }} />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (structure.type === 'booth') {
        return (
            <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <Folder size={14} />
                    Booth Package Structure
                </h3>
                <div className="border border-white/5 rounded-lg p-4 bg-white/[0.01]">
                    <PreviewNode name={structure.root} files={structure.categories} />
                </div>
            </div>
        );
    }

    return null;
}
