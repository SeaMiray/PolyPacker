import JSZip from 'jszip';
import { convertToUENaming, detectNormalType, convertOpenGLToDirectX, isImageFile, isNormalMap } from './ueNaming';

/**
 * Finds Textures folder (case-insensitive)
 * @param {Array} files - Array of file objects with path property
 * @returns {Array} - Files in Textures folder
 */
function findTexturesFolder(files) {
    const textureFiles = files.filter(file => {
        if (!file.path) return false;
        const pathParts = file.path.split('/');
        return pathParts.some(part => /^textures?$/i.test(part));
    });
    return textureFiles;
}

/**
 * Groups 3D model files by extension
 * @param {Array} files - Array of file objects
 * @returns {Object} - Grouped files by extension
 */
function groupModelsByExtension(files) {
    const groups = {};
    const modelExtensions = ['.fbx', '.obj', '.glb', '.gltf'];

    files.forEach(file => {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (modelExtensions.includes(ext)) {
            const extKey = ext.substring(1).toUpperCase(); // Remove dot and uppercase
            if (!groups[extKey]) {
                groups[extKey] = [];
            }
            groups[extKey].push(file);
        }
    });

    return groups;
}

/**
 * Analyzes normal maps and determines conversion strategy
 * @param {Array} textureFiles - Texture files to analyze
 * @returns {Promise<Object>} - Analysis result with conversion instructions
 */
async function analyzeNormalMaps(textureFiles) {
    const normalMaps = textureFiles.filter(f => isNormalMap(f.name) && isImageFile(f.name));

    if (normalMaps.length === 0) {
        return { hasNormals: false, needsConversion: false, conversionMap: {} };
    }

    const detectionResults = await Promise.all(
        normalMaps.map(async (file) => ({
            file,
            type: await detectNormalType(file.file || file)
        }))
    );

    const hasDirectX = detectionResults.some(r => r.type === 'directx');
    const hasOpenGL = detectionResults.some(r => r.type === 'opengl');

    const conversionMap = {};

    // FAB mode rules:
    // - If only OpenGL exists, convert to DirectX
    // - If only DirectX exists, keep as-is
    // - If both exist, use DirectX only (exclude OpenGL)

    if (hasOpenGL && !hasDirectX) {
        // Only OpenGL: convert all to DirectX
        detectionResults.forEach(result => {
            if (result.type === 'opengl') {
                conversionMap[result.file.name] = { action: 'convert', from: 'opengl', to: 'directx' };
            }
        });
    } else if (hasDirectX && hasOpenGL) {
        // Both exist: exclude OpenGL
        detectionResults.forEach(result => {
            if (result.type === 'opengl') {
                conversionMap[result.file.name] = { action: 'exclude' };
            } else {
                conversionMap[result.file.name] = { action: 'keep', type: 'directx' };
            }
        });
    } else {
        // Only DirectX: keep as-is
        detectionResults.forEach(result => {
            conversionMap[result.file.name] = { action: 'keep', type: 'directx' };
        });
    }

    return {
        hasNormals: true,
        needsConversion: Object.values(conversionMap).some(v => v.action === 'convert'),
        conversionMap
    };
}

/**
 * Exports files in FAB mode (multiple ZIPs per model format)
 * @param {Array} files - All files
 * @param {string} customName - Custom package name
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<void>}
 */
export async function exportFABMode(files, customName, onProgress) {
    // Find all texture files (images), regardless of whether they are in a "Textures" folder
    const textureFiles = files.filter(file => isImageFile(file.name));
    const modelGroups = groupModelsByExtension(files);

    if (Object.keys(modelGroups).length === 0) {
        throw new Error('No 3D model files found. FAB mode requires at least one model file (.fbx, .obj, .glb)');
    }

    // Analyze normal maps
    const normalAnalysis = await analyzeNormalMaps(textureFiles);

    const groupKeys = Object.keys(modelGroups);

    for (let i = 0; i < groupKeys.length; i++) {
        const ext = groupKeys[i];
        const models = modelGroups[ext];

        if (onProgress) {
            onProgress({
                current: i + 1,
                total: groupKeys.length,
                format: ext,
                currentFile: `${customName}_${ext}.zip`
            });
        }

        const zip = new JSZip();
        const folderName = `${customName}_${ext}`;

        // Add models
        models.forEach(model => {
            zip.file(`${folderName}/${model.name}`, model.file || model);
        });

        // Add textures with UE naming
        if (textureFiles.length > 0) {
            const texturesFolder = zip.folder(`${folderName}/Textures`);

            for (const texFile of textureFiles) {
                const fileName = texFile.name; // Use original name
                const filePath = texFile.path || fileName;

                // Check if this file should be excluded or converted
                const normalInstruction = normalAnalysis.conversionMap[fileName];

                if (normalInstruction?.action === 'exclude') {
                    continue; // Skip OpenGL normals when DirectX exists
                }

                let fileData = texFile.file || texFile;
                let normalType = null;

                if (normalInstruction?.action === 'convert') {
                    // Convert OpenGL to DirectX
                    fileData = await convertOpenGLToDirectX(fileData);
                    normalType = 'directx';
                } else if (normalInstruction?.action === 'keep') {
                    normalType = normalInstruction.type;
                }

                // Calculate relative path inside Textures folder
                // 1. If file is in a "Textures" folder, preserve structure relative to it
                // 2. If not, place in root of Textures folder
                const pathParts = filePath.split('/');
                const textureIndex = pathParts.findIndex(p => /^textures?$/i.test(p));

                let relativePath = '';
                if (textureIndex !== -1 && textureIndex < pathParts.length - 1) {
                    // Has subfolders/files after Textures
                    relativePath = pathParts.slice(textureIndex + 1, pathParts.length - 1).join('/');
                }

                const baseName = convertToUENaming(fileName, customName, normalType);
                const finalPath = relativePath ? `${relativePath}/${baseName}` : baseName;

                texturesFolder.file(finalPath, fileData);
            }
        }

        // Generate and download ZIP
        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${folderName}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Delay between downloads
        if (i < groupKeys.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
}
