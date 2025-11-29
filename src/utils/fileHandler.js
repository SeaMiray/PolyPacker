/**
 * Recursively reads entries from a directory reader
 * @param {FileSystemDirectoryReader} reader 
 * @returns {Promise<Array>}
 */
function readEntriesPromise(reader) {
    return new Promise((resolve, reject) => {
        reader.readEntries(resolve, reject);
    });
}

/**
 * Recursively reads all files from a directory entry
 * @param {FileSystemEntry} entry 
 * @param {string} path 
 * @returns {Promise<Array<File>>}
 */
async function readEntry(entry, path = '') {
    if (entry.isFile) {
        return new Promise((resolve, reject) => {
            entry.file(file => {
                // Manually add path property to the file object
                Object.defineProperty(file, 'path', {
                    value: path + file.name,
                    writable: false,
                    configurable: true
                });
                resolve([file]);
            }, reject);
        });
    } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        let allEntries = [];
        let readEntries = await readEntriesPromise(dirReader);

        // readEntries might not return all entries in one call, so loop until empty
        while (readEntries.length > 0) {
            allEntries = allEntries.concat(readEntries);
            readEntries = await readEntriesPromise(dirReader);
        }

        const filesPromises = allEntries.map(childEntry =>
            readEntry(childEntry, path + entry.name + '/')
        );

        const filesArrays = await Promise.all(filesPromises);
        return filesArrays.flat();
    }
    return [];
}

/**
 * Custom file getter for react-dropzone to handle folder structures
 * @param {DataTransferItem} item 
 * @returns {Promise<Array<File>>}
 */
export async function getFilesFromEvent(event) {
    const items = event.dataTransfer ? event.dataTransfer.items : event.target.files;

    if (event.dataTransfer && event.dataTransfer.items) {
        const files = [];
        const queue = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
                if (entry) {
                    queue.push(readEntry(entry));
                } else {
                    const file = item.getAsFile();
                    if (file) files.push(file);
                }
            }
        }

        const recursiveFiles = await Promise.all(queue);
        return [...files, ...recursiveFiles.flat()];
    } else {
        // Fallback for input[type="file"]
        return Array.from(items);
    }
}
