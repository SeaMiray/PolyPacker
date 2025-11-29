import JSZip from 'jszip';

function addFilesToZip(zip, structure, currentPath = '') {
    for (const [key, value] of Object.entries(structure)) {
        if (key === '_root') {
            // Files at root level
            value.forEach(file => {
                zip.file(file.name, file);
            });
        } else if (Array.isArray(value)) {
            // Files in a folder
            const folderPath = currentPath ? `${currentPath}/${key}` : key;
            value.forEach(file => {
                zip.file(`${folderPath}/${file.name}`, file);
            });
        } else {
            // Nested folder
            const folderPath = currentPath ? `${currentPath}/${key}` : key;
            addFilesToZip(zip, value, folderPath);
        }
    }
}

export async function exportToZip(structure, presetName) {
    const zip = new JSZip();

    addFilesToZip(zip, structure);

    const blob = await zip.generateAsync({ type: 'blob' });

    // Create download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const date = new Date().toISOString().split('T')[0];
    const safeName = presetName.replace(/\s+/g, '-').toLowerCase();
    link.download = `${safeName}-package-${date}.zip`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
