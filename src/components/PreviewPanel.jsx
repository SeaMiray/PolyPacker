import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Folder, FolderOpen, File, ChevronRight, ChevronDown } from 'lucide-react';
import { getFileExtension } from '../utils/presets';
import { formatFileSize } from '../utils/zipExport';

function getFileIcon(filename) {
    const ext = getFileExtension(filename);
    return <File size={14} className="text-cream/40" />;
}

// Helper to build nested structure from file paths
function buildTextureStructure(files) {
    const root = { __root_files__: [] };

    files.forEach(file => {
        // Determine relative path inside "Textures" folder
        const path = file.path || file.name;
        const parts = path.split('/');
        const textureIndex = parts.findIndex(p => /^textures?$/i.test(p));

        let relativeParts = [];
        if (textureIndex !== -1 && textureIndex < parts.length - 1) {
            // Inside a "Textures" folder: preserve structure relative to it
            relativeParts = parts.slice(textureIndex + 1, parts.length - 1);
        } else {
            // Not in "Textures" folder: place at root of Textures (no relative parts)
            // Unless it's just a loose file with path info we want to keep? 
            // FAB export logic puts loose files in root of Textures.
            relativeParts = [];
        }

        let current = root;
        relativeParts.forEach(part => {
            if (!current[part]) {
                current[part] = { __root_files__: [] };
            }
            current = current[part];
        });

        current.__root_files__.push(file);
    });

    return root;
}

function PreviewNode({ name, files, level = 0, isLast = false }) {
    const [isExpanded, setIsExpanded] = React.useState(true);

    // Check if this is a mixed node (folders + files) or a simple file array
    const isMixedNode = files && typeof files === 'object' && !Array.isArray(files) && '__root_files__' in files;
    const isFileArray = Array.isArray(files);

    if (isFileArray) {
        // Leaf node with only files (Legacy/Simple mode)
        return (
            <div style={{ paddingLeft: `${level * 20}px` }}>
                {files.map((file, index) => (
                    <motion.div
                        key={`${file.name}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center gap-2 py-1.5 px-2 text-sm text-cream/70 hover:bg-surface-light/50 rounded"
                    >
                        {getFileIcon(file.name)}
                        <span className="flex-1 truncate">{file.name || file}</span>
                        <span className="text-[10px] text-cream/30 font-mono">
                            {formatFileSize(file.size || 0)}
                        </span>
                    </motion.div>
                ))}
            </div>
        );
    }

    // Folder node (Mixed or Pure Folder)
    // Calculate child count
    let childCount = 0;
    if (isMixedNode) {
        childCount = files.__root_files__.length + Object.keys(files).length - 1; // -1 for __root_files__ key
    } else {
        childCount = Object.values(files).reduce((sum, val) => {
            if (Array.isArray(val)) return sum + val.length;
            if (val && typeof val === 'object' && '__root_files__' in val) {
                // Recursive count is complex, just count direct children for now
                return sum + 1;
            }
            return sum + Object.keys(val).length;
        }, 0);
    }

    return (
        <div style={{ paddingLeft: `${level * 20}px` }}>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 py-1.5 px-2 text-sm cursor-pointer hover:bg-surface-light/50 rounded group"
            >
                <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-cream/40"
                >
                    <ChevronRight size={14} />
                </motion.div>
                {isExpanded ? (
                    <FolderOpen size={14} className="text-primary" />
                ) : (
                    <Folder size={14} className="text-primary/80" />
                )}
                <span className="flex-1 font-medium text-cream/80 group-hover:text-cream transition-colors">
                    {name}
                </span>
                <span className="text-[10px] text-cream/40 bg-surface-light px-1.5 py-0.5 rounded-full font-mono">
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
                    {isMixedNode ? (
                        <>
                            {/* Render Subfolders */}
                            {Object.entries(files)
                                .filter(([key]) => key !== '__root_files__')
                                .map(([childName, childValue]) => (
                                    <PreviewNode
                                        key={childName}
                                        name={childName}
                                        files={childValue}
                                        level={level + 1}
                                    />
                                ))
                            }
                            {/* Render Files */}
                            {files.__root_files__.map((file, index) => (
                                <div key={`${file.name}-${index}`} style={{ paddingLeft: `${(level + 1) * 20}px` }}>
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="flex items-center gap-2 py-1.5 px-2 text-sm text-cream/70 hover:bg-surface-light/50 rounded"
                                    >
                                        {getFileIcon(file.name)}
                                        <span className="flex-1 truncate">{file.name || file}</span>
                                        <span className="text-[10px] text-cream/30 font-mono">
                                            {formatFileSize(file.size || 0)}
                                        </span>
                                    </motion.div>
                                </div>
                            ))}
                        </>
                    ) : (
                        // Standard recursive render for non-mixed objects (Legacy)
                        Object.entries(files).map(([childName, childValue], index) => (
                            <PreviewNode
                                key={childName}
                                name={childName}
                                files={childValue}
                                level={level + 1}
                                isLast={index === Object.entries(files).length - 1}
                            />
                        ))
                    )}
                </motion.div>
            )}
        </div>
    );
}

export default function PreviewPanel({ selectedPreset, files, customName, customStructure }) {
    const structure = useMemo(() => {
        if (files.length === 0) return null;

        if (selectedPreset === 'FAB') {
            // Group models by extension
            const modelGroups = {};
            const textureFiles = [];
            const unityFiles = [];
            const ueFiles = [];
            const mtlFiles = [];

            files.forEach(file => {
                const ext = getFileExtension(file.name).substring(1).toUpperCase();
                const extLower = getFileExtension(file.name).toLowerCase();
                const isModel = ['FBX', 'OBJ', 'GLB', 'GLTF'].includes(ext);
                const isImage = /\.(png|jpg|jpeg|tga|exr|psd|bmp|tif|tiff|dds)$/i.test(file.name);

                if (isModel) {
                    if (!modelGroups[ext]) modelGroups[ext] = [];
                    modelGroups[ext].push(file);
                } else if (isImage) {
                    textureFiles.push(file);
                } else if (extLower === '.unitypackage') {
                    unityFiles.push(file);
                } else if (['.uasset', '.uproject', '.umap'].includes(extLower)) {
                    ueFiles.push(file);
                } else if (extLower === '.mtl') {
                    mtlFiles.push(file);
                }
            });

            // Build nested texture structure
            const textureStructure = buildTextureStructure(textureFiles);

            return {
                type: 'fab',
                packages: Object.entries(modelGroups).map(([ext, models]) => {
                    // Add MTL files to OBJ models
                    let packageModels = [...models];
                    if (ext === 'OBJ') {
                        models.forEach(model => {
                            const baseName = model.name.replace(/\.obj$/i, '').toLowerCase();
                            const mtl = mtlFiles.find(m => m.name.replace(/\.mtl$/i, '').toLowerCase() === baseName);
                            if (mtl) {
                                packageModels.push(mtl);
                            }
                        });
                    }

                    return {
                        name: `${customName}_${ext}`,
                        models: packageModels,
                        textures: textureStructure,
                        unity: unityFiles,
                        ue: ueFiles
                    };
                })
            };
        } else if (selectedPreset === 'Booth') {
            const categorized = {
                FBX: [],
                OBJ: [],
                GLB: [],
                GLTF: [],
                Textures: [],
                Unity: [],
                UE: [],
                Source: []
            };

            const mtlFiles = [];

            files.forEach(file => {
                const ext = getFileExtension(file.name);
                if (ext === '.fbx') {
                    categorized.FBX.push(file);
                } else if (ext === '.obj') {
                    categorized.OBJ.push(file);
                } else if (ext === '.glb') {
                    categorized.GLB.push(file);
                } else if (ext === '.gltf') {
                    categorized.GLTF.push(file);
                } else if (['.png', '.jpg', '.jpeg', '.tga', '.exr', '.psd', '.bmp', '.tif', '.tiff', '.dds'].includes(ext)) {
                    categorized.Textures.push(file);
                } else if (ext === '.unitypackage') {
                    categorized.Unity.push(file);
                } else if (['.uasset', '.uproject', '.umap'].includes(ext)) {
                    categorized.UE.push(file);
                } else if (['.blend', '.max', '.ma', '.mb'].includes(ext)) {
                    categorized.Source.push(file);
                } else if (ext === '.mtl') {
                    mtlFiles.push(file);
                }
            });

            // Add MTL files to OBJ category
            if (mtlFiles.length > 0) {
                categorized.OBJ.push(...mtlFiles);
            }

            return {
                type: 'booth',
                root: `${customName}Assets`,
                categories: categorized
            };
        } else if (selectedPreset === 'Custom') {
            return {
                type: 'custom',
                root: customStructure
            };
        }

        return null;
    }, [selectedPreset, files, customName, customStructure]);

    if (!structure) {
        return (
            <div className="flex items-center justify-center h-full text-cream/30 text-sm italic">
                No preview available
            </div>
        );
    }

    if (structure.type === 'fab') {
        return (
            <div className="space-y-4">
                {/* Settings Header */}
                <div className="bg-surface-light/30 border border-primary/20 rounded-lg p-3 mb-4 retro-inset">
                    <h3 className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">Export Settings</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex flex-col">
                            <span className="text-cream/40">Preset</span>
                            <span className="text-cream font-medium">FAB (Unreal Engine)</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-cream/40">Package Name</span>
                            <span className="text-cream font-medium truncate" title={customName}>{customName}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-cream/40">Total Files</span>
                            <span className="text-cream font-medium">{files.length}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-cream/40">Packages</span>
                            <span className="text-cream font-medium">{structure.packages.length}</span>
                        </div>
                    </div>
                </div>

                <h3 className="text-sm font-medium text-cream/50 mb-3 flex items-center gap-2">
                    <Folder size={14} />
                    FAB Package Structure ({structure.packages.length} {structure.packages.length === 1 ? 'package' : 'packages'})
                </h3>
                {structure.packages.map((pkg, index) => (
                    <div key={pkg.name} className="border border-primary/10 rounded-lg p-4 bg-surface-light/20 retro-inset">
                        <div className="flex items-center gap-2 mb-3">
                            <FolderOpen size={16} className="text-primary" />
                            <span className="font-semibold text-cream">{pkg.name}.zip</span>
                        </div>
                        <div className="space-y-1 pl-4">
                            {/* Models Folder (Virtual) */}
                            <PreviewNode name={pkg.name} files={pkg.models} />

                            {/* Textures Folder (Nested) */}
                            {pkg.textures && (pkg.textures.__root_files__.length > 0 || Object.keys(pkg.textures).length > 1) && (
                                <PreviewNode name="Textures" files={pkg.textures} />
                            )}

                            {/* Unity Folder */}
                            {pkg.unity && pkg.unity.length > 0 && (
                                <PreviewNode name="Unity" files={pkg.unity} />
                            )}

                            {/* UE Folder */}
                            {pkg.ue && pkg.ue.length > 0 && (
                                <PreviewNode name="UE" files={pkg.ue} />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (structure.type === 'booth') {
        return (
            <div>
                {/* Settings Header */}
                <div className="bg-surface-light/30 border border-primary/20 rounded-lg p-3 mb-4 retro-inset">
                    <h3 className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">Export Settings</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex flex-col">
                            <span className="text-cream/40">Preset</span>
                            <span className="text-cream font-medium">Booth (VRChat)</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-cream/40">Package Name</span>
                            <span className="text-cream font-medium truncate" title={customName}>{customName}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-cream/40">Total Files</span>
                            <span className="text-cream font-medium">{files.length}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-cream/40">Root Folder</span>
                            <span className="text-cream font-medium truncate" title={structure.root}>{structure.root}</span>
                        </div>
                    </div>
                </div>

                <h3 className="text-sm font-medium text-cream/50 mb-3 flex items-center gap-2">
                    <Folder size={14} />
                    Booth Package Structure
                </h3>
                <div className="border border-primary/10 rounded-lg p-4 bg-surface-light/20 retro-inset">
                    <PreviewNode name={structure.root} files={structure.categories} />
                </div>
            </div>
        );
    }

    if (structure.type === 'custom') {
        return (
            <div>
                {/* Settings Header */}
                <div className="bg-surface-light/30 border border-primary/20 rounded-lg p-3 mb-4 retro-inset">
                    <h3 className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">Export Settings</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex flex-col">
                            <span className="text-cream/40">Preset</span>
                            <span className="text-cream font-medium">Custom Structure</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-cream/40">Package Name</span>
                            <span className="text-cream font-medium truncate" title={customName}>{customName}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-cream/40">Total Files</span>
                            <span className="text-cream font-medium">{files.length}</span>
                        </div>
                    </div>
                </div>

                <h3 className="text-sm font-medium text-cream/50 mb-3 flex items-center gap-2">
                    <Folder size={14} />
                    Custom Package Structure
                </h3>
                <div className="border border-primary/10 rounded-lg p-4 bg-surface-light/20 retro-inset">
                    {/* We need to convert the custom structure tree to the format PreviewNode expects */}
                    <CustomPreviewNode node={structure.root} />
                </div>
            </div>
        );
    }

    return null;
}

// Helper to render custom tree in preview
function CustomPreviewNode({ node }) {
    if (!node) return null;

    if (node.type === 'file') {
        return (
            <div className="flex items-center gap-2 py-1.5 px-2 text-sm text-cream/70 hover:bg-surface-light/50 rounded">
                {getFileIcon(node.name)}
                <span className="flex-1 truncate">{node.name}</span>
                <span className="text-[10px] text-cream/30 font-mono">
                    {formatFileSize(node.file?.size || 0)}
                </span>
            </div>
        );
    }

    if (node.type === 'folder') {
        // Don't render root folder name if it's just a container, but here we render everything
        return (
            <div className="pl-4">
                <div className="flex items-center gap-2 py-1.5 px-2 text-sm font-medium text-cream">
                    <Folder size={14} className="text-yellow-500" />
                    <span>{node.name}</span>
                </div>
                <div className="border-l border-white/5 ml-2">
                    {node.children.map((child, index) => (
                        <CustomPreviewNode key={index} node={child} />
                    ))}
                </div>
            </div>
        );
    }
    return null;
}
