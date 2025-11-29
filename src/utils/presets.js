// Preset configurations for different platforms
export const PRESETS = {
    'Unity Asset Store': {
        name: 'Unity Asset Store',
        rules: [
            { extensions: ['.fbx', '.obj', '.blend'], folder: 'Assets/Models' },
            { extensions: ['.png', '.jpg', '.jpeg', '.tga', '.psd'], folder: 'Assets/Textures' },
            { extensions: ['.mat'], folder: 'Assets/Materials' },
            { extensions: ['.prefab'], folder: 'Assets/Prefabs' },
            { extensions: ['.cs'], folder: 'Assets/Scripts' },
            { extensions: ['.wav', '.mp3', '.ogg'], folder: 'Assets/Audio' },
            { extensions: ['.anim', '.controller'], folder: 'Assets/Animations' },
            { extensions: [], folder: 'Assets' } // default
        ]
    },
    'Unreal Marketplace': {
        name: 'Unreal Marketplace',
        rules: [
            { extensions: ['.fbx', '.obj'], folder: 'Content/Meshes' },
            { extensions: ['.png', '.jpg', '.jpeg', '.tga', '.exr'], folder: 'Content/Textures' },
            { extensions: ['.uasset'], folder: 'Content/Blueprints' },
            { extensions: ['.wav', '.mp3'], folder: 'Content/Audio' },
            { extensions: [], folder: 'Content' } // default
        ]
    },
    'BOOTH': {
        name: 'BOOTH',
        rules: [
            { extensions: [], folder: '' } // flat structure
        ]
    }
};

export function getPresetByName(presetName) {
    return PRESETS[presetName] || PRESETS['Unity Asset Store'];
}

export function getFileExtension(filename) {
    const lastDot = filename.lastIndexOf('.');
    return lastDot === -1 ? '' : filename.substring(lastDot).toLowerCase();
}

export function categorizeFiles(files, preset) {
    const structure = {};

    files.forEach(file => {
        const ext = getFileExtension(file.name);

        // Find matching rule
        let targetFolder = preset.rules[preset.rules.length - 1].folder; // default
        for (const rule of preset.rules) {
            if (rule.extensions.length === 0) continue; // skip default rule
            if (rule.extensions.includes(ext)) {
                targetFolder = rule.folder;
                break;
            }
        }

        // Build nested structure
        if (!targetFolder) {
            // Root level
            if (!structure['_root']) structure['_root'] = [];
            structure['_root'].push(file);
        } else {
            const parts = targetFolder.split('/');
            let current = structure;

            parts.forEach((part, index) => {
                if (!current[part]) {
                    current[part] = index === parts.length - 1 ? [] : {};
                }
                if (index === parts.length - 1) {
                    current[part].push(file);
                } else {
                    current = current[part];
                }
            });
        }
    });

    return structure;
}
