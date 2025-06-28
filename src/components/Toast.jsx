import React, { useState, useCallback } from "react";
import './Toast.css';

export default function Toast({ message, type = "info", onClose }) {
    if (!message) return null;
    return (
        <div className={`toast toast-${type}`}>
            <span>{message}</span>
            <button className="toast-close" onClick={onClose}>×</button>
        </div>
    );
}

// useToast 훅 추가 (토스트 상태 관리)
export function useToast(timeout = 2500) {
    const [toast, setToast] = useState({ message: "", type: "info" });
    const showToast = useCallback((message, type = "info") => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: "", type: "info" }), timeout);
    }, [timeout]);
    return [toast, showToast];
}
