import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Package } from 'lucide-react';

export default function ExportProgress({ current, total, currentFile, isVisible }) {
    if (!isVisible) return null;

    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-[#18181b] border border-white/10 rounded-xl p-8 max-w-md w-full"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        >
                            <Loader2 size={24} className="text-blue-400" />
                        </motion.div>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg text-white">Exporting Package</h3>
                        <p className="text-sm text-gray-400">
                            {current} of {total} {total === 1 ? 'file' : 'files'}
                        </p>
                    </div>
                </div>

                {currentFile && (
                    <div className="mb-4 p-3 bg-white/[0.02] rounded-lg border border-white/5">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Package size={14} />
                            <span className="truncate">{currentFile}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white font-semibold">{percentage}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.3 }}
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                        />
                    </div>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                    Please wait while we prepare your package...
                </p>
            </motion.div>
        </motion.div>
    );
}
