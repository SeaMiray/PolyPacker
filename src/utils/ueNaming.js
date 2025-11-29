// UE Naming Convention Converter for Textures

/**
 * Detects if a normal map is DirectX or OpenGL format by analyzing pixel data
 * @param {File} file - The image file to analyze
 * @returns {Promise<'directx'|'opengl'>} - The detected normal map type
 */
export async function detectNormalType(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = Math.min(img.width, 100);
                canvas.height = Math.min(img.height, 100);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                let blueSum = 0;
                let pixelCount = 0;

                // Sample blue channel values
                for (let i = 2; i < data.length; i += 4) {
                    blueSum += data[i];
                    pixelCount++;
                }

                const avgBlue = blueSum / pixelCount;

                // DirectX normals have flipped Y (blue channel ~127)
                // OpenGL normals have standard Y (blue channel ~255)
                resolve(avgBlue < 200 ? 'directx' : 'opengl');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Converts OpenGL normal map to DirectX format (flip Y channel)
 * @param {File} file - The OpenGL normal map file
 * @returns {Promise<Blob>} - The converted DirectX normal map
 */
export async function convertOpenGLToDirectX(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Flip Y channel (green channel)
                for (let i = 1; i < data.length; i += 4) {
                    data[i] = 255 - data[i];
                }

                ctx.putImageData(imageData, 0, 0);
                canvas.toBlob((blob) => resolve(blob), file.type);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Strips resolution indicators from filename
 * @param {string} filename - Original filename
 * @returns {string} - Filename without resolution indicators
 */
function stripResolution(filename) {
    return filename
        .replace(/_\d+[kK](?=_|\.)/g, '')  // _2k, _4K
        .replace(/_\d+px(?=_|\.)/g, '')    // _4096px
        .replace(/_\d{3,4}(?=_|\.)/g, ''); // _2048, _4096
}

/**
 * Detects texture type from filename
 * @param {string} filename - Original filename
 * @returns {string|null} - Detected texture type suffix or null
 */
function detectTextureType(filename) {
    const lower = filename.toLowerCase();

    // Check for existing ORM map
    if (lower.includes('_orm') || lower.includes('_packed')) {
        return 'ORM';
    }

    // Diffuse/Albedo/Base Color
    if (lower.includes('_color') || lower.includes('_basecolor') ||
        lower.includes('_albedo') || lower.includes('_diffuse') ||
        lower.includes('_bc')) {
        return 'D';
    }

    // Normal
    if (lower.includes('_normal') || lower.includes('_n.') || lower.includes('_norm')) {
        return 'N';
    }

    // Roughness
    if (lower.includes('_roughness') || lower.includes('_rough') || lower.includes('_r.')) {
        return 'R';
    }

    // Metallic/Metalness
    if (lower.includes('_metallic') || lower.includes('_metalness') ||
        lower.includes('_metal') || lower.includes('_m.')) {
        return 'M';
    }

    // Ambient Occlusion
    if (lower.includes('_occlusion') || lower.includes('_ao') ||
        lower.includes('_ambientocclusion')) {
        return 'AO';
    }

    // Emissive
    if (lower.includes('_emissive') || lower.includes('_emission') || lower.includes('_e.')) {
        return 'E';
    }

    // Opacity/Alpha
    if (lower.includes('_opacity') || lower.includes('_alpha') || lower.includes('_o.')) {
        return 'O';
    }

    return null;
}

/**
 * Converts filename to UE naming convention
 * @param {string} filename - Original filename
 * @param {string} customName - Custom name prefix
 * @param {string} [normalType] - For normal maps: 'directx' or 'opengl'
 * @returns {string} - Converted filename with UE convention
 */
export function convertToUENaming(filename, customName, normalType = null) {
    const ext = filename.substring(filename.lastIndexOf('.'));
    const baseName = filename.substring(0, filename.lastIndexOf('.'));

    // Strip resolution indicators
    const cleanName = stripResolution(baseName);

    // Detect texture type
    const textureType = detectTextureType(cleanName);

    if (!textureType) {
        // Unknown type, just add T_ prefix
        return `T_${customName}_${cleanName}${ext}`;
    }

    // Special handling for normal maps
    if (textureType === 'N' && normalType === 'directx') {
        return `T_${customName}_N${ext}`;
    }

    return `T_${customName}_${textureType}${ext}`;
}

/**
 * Checks if a file is an image
 * @param {string} filename - Filename to check
 * @returns {boolean} - True if image
 */
export function isImageFile(filename) {
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.tga', '.exr', '.psd', '.bmp'].includes(ext);
}

/**
 * Checks if filename indicates a normal map
 * @param {string} filename - Filename to check
 * @returns {boolean} - True if normal map
 */
export function isNormalMap(filename) {
    const lower = filename.toLowerCase();
    return lower.includes('_normal') || lower.includes('_n.') || lower.includes('_norm');
}
