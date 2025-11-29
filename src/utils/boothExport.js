import JSZip from 'jszip';

/**
 * Categorizes files for Booth mode
 * @param {Array} files - All files
 * @returns {Object} - Categorized files
 */
function categorizeBoothFiles(files) {
    const categories = {
        Mesh: [],
        Textures: [],
        Unity: [],
        Source: []
    };

    files.forEach(file => {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        const fileName = file.name.split('/').pop(); // Remove path if exists

        // 3D Models (excluding source formats)
        if (['.fbx', '.obj', '.glb', '.gltf'].includes(ext)) {
            categories.Mesh.push({ ...file, fileName });
        }
        // Textures
        else if (['.png', '.jpg', '.jpeg', '.tga', '.exr', '.psd', '.bmp'].includes(ext)) {
            categories.Textures.push({ ...file, fileName });
        }
        // Unity packages
        else if (ext === '.unitypackage') {
            categories.Unity.push({ ...file, fileName });
        }
        // Source files
        else if (['.blend', '.max', '.ma', '.mb', '.c4d', '.ztl'].includes(ext)) {
            categories.Source.push({ ...file, fileName });
        }
        // Default: put in root or Textures if image-like
        else if (['.tif', '.tiff', '.dds'].includes(ext)) {
            categories.Textures.push({ ...file, fileName });
        }
    });

    return categories;
}

/**
 * Exports files in Booth mode (single ZIP with categorized folders)
 * @param {Array} files - All files
 * @param {string} customName - Custom package name
 * @returns {Promise<void>}
 */
export async function exportBoothMode(files, customName) {
    if (files.length === 0) {
        throw new Error('No files to export');
    }

    const categorized = categorizeBoothFiles(files);
    const zip = new JSZip();
    const rootFolder = `${customName}Assets`;

    // Add files to categorized folders
    Object.entries(categorized).forEach(([category, categoryFiles]) => {
        if (categoryFiles.length > 0) {
            const folder = zip.folder(`${rootFolder}/${category}`);
            categoryFiles.forEach(file => {
                folder.file(file.fileName, file.file || file);
            });
        }
    });

    // Generate and download ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const date = new Date().toISOString().split('T')[0];
    link.download = `${rootFolder}_${date}.zip`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
