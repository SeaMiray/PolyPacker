import React, { useState, useEffect } from 'react';
import { FileImage, Box, FileCode, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFileExtension } from '../utils/presets';

export default function FileThumbnail({ file, size = 48 }) {
    const [thumbnail, setThumbnail] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const ext = getFileExtension(file.name);

    const isImage = ['.png', '.jpg', '.jpeg', '.tga', '.bmp'].includes(ext);

    useEffect(() => {
        if (!isImage || !file.file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setThumbnail(e.target.result);
        };
        reader.readAsDataURL(file.file);
    }, [file, isImage]);

    const Icon = isImage ? FileImage :
        ['.fbx', '.obj', '.blend', '.glb'].includes(ext) ? Box :
            ['.cs', '.js', '.ts'].includes(ext) ? FileCode : FileText;

    if (thumbnail) {
        return (
            <div
                className="relative"
                onMouseEnter={() => setShowPreview(true)}
                onMouseLeave={() => setShowPreview(false)}
            >
                <img
                    src={thumbnail}
                    alt={file.name}
                    className="rounded object-cover"
                    style={{ width: size, height: size }}
                />

                {showPreview && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute left-full ml-2 top-0 z-50 pointer-events-none"
                    >
                        <div className="bg-[#18181b] border border-white/10 rounded-lg p-2 shadow-2xl">
                            <img
                                src={thumbnail}
                                alt={file.name}
                                className="rounded object-contain"
                                style={{ width: 256, height: 256 }}
                            />
                            <p className="text-xs text-gray-400 mt-2 text-center truncate max-w-[256px]">
                                {file.name}
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div
            className="flex items-center justify-center bg-[#18181b] rounded"
            style={{ width: size, height: size }}
        >
            <Icon size={size / 2} className="text-gray-500" />
        </div>
    );
}
