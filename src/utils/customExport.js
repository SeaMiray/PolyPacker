import JSZip from 'jszip';

/**
 * Exports files based on a custom folder structure
 * @param {Object} rootNode - The root node of the custom structure tree
 * @param {string} customName - Custom package name
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<void>}
 */
export async function exportCustomMode(rootNode, customName, onProgress) {
    if (!rootNode || !rootNode.children || rootNode.children.length === 0) {
        throw new Error('Custom structure is empty');
    }

    const zip = new JSZip();
    const rootFolder = customName; // The root folder inside the ZIP

    // Helper to traverse the tree and add files to ZIP
    function traverse(node, currentPath) {
        if (node.type === 'file') {
            // Add file to ZIP
            zip.file(currentPath, node.file);
        } else if (node.type === 'folder') {
            // Create folder (implicitly by adding files to it, or explicit folder if empty)
            const folderPath = currentPath ? `${currentPath}/` : '';

            // If folder is empty, we might want to create it explicitly
            if (node.children.length === 0 && folderPath) {
                zip.folder(folderPath);
            }

            // Process children
            node.children.forEach(child => {
                const childPath = folderPath ? `${folderPath}${child.name}` : child.name;
                traverse(child, childPath);
            });
        }
    }

    // Start traversal from root's children
    // We don't include the rootNode itself as a folder, but use its children
    // The 'customName' is used as the top-level directory in the ZIP if desired, 
    // or we can just zip the contents directly. 
    // Usually packages have a root folder.

    // Let's create a root folder in the zip
    const mainFolder = zip.folder(rootFolder);

    rootNode.children.forEach(child => {
        traverse(child, child.name); // Relative to rootFolder
    });

    // We need to adjust traverse to use the mainFolder instance
    function traverseZip(folderInstance, node) {
        if (node.type === 'file') {
            folderInstance.file(node.name, node.file);
        } else if (node.type === 'folder') {
            const subFolder = folderInstance.folder(node.name);
            node.children.forEach(child => {
                traverseZip(subFolder, child);
            });
        }
    }

    // Re-traverse using the zip folder instance
    rootNode.children.forEach(child => {
        traverseZip(mainFolder, child);
    });

    // Generate and download ZIP
    const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
    }, (metadata) => {
        if (onProgress) {
            onProgress({
                current: metadata.percent,
                total: 100,
                currentFile: metadata.currentFile || 'Compressing...'
            });
        }
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${customName}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
