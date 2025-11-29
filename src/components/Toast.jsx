import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
};

const colorMap = {
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400'
};

export default function Toast({ toasts, onClose }) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
                {toasts.map((toast, index) => {
                    const Icon = iconMap[toast.type];
                    const colorClass = colorMap[toast.type];

                    return (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.3 }}
                            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border backdrop-blur-md shadow-lg min-w-[320px] max-w-[400px] ${colorClass}`}
                        >
                            <Icon size={20} className="flex-shrink-0 mt-0.5" />
                            <p className="flex-1 text-sm text-white">{toast.message}</p>
                            <button
                                onClick={() => onClose(toast.id)}
                                className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
