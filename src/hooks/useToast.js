import { useState, useCallback } from 'react';

let toastId = 0;

export function useToast() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = toastId++;
        const toast = {
            id,
            message,
            type, // 'success', 'error', 'warning', 'info'
            timestamp: Date.now()
        };

        setToasts(prev => [...prev, toast]);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        success: (message) => addToast(message, 'success'),
        error: (message) => addToast(message, 'error'),
        warning: (message) => addToast(message, 'warning'),
        info: (message) => addToast(message, 'info')
    };

    return { toasts, toast, removeToast };
}
