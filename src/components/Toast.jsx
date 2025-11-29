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
    success: 'bg-success/10 border-success/30 text-success vintage-border',
    error: 'bg-danger/10 border-danger/30 text-danger vintage-border',
    warning: 'bg-warning/10 border-warning/30 text-warning vintage-border',
    info: 'bg-primary/10 border-primary/30 text-primary vintage-border'
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
                            <p className="flex-1 text-sm text-cream">{toast.message}</p>
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
