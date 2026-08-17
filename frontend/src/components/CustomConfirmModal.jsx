import React from "react";

function CustomConfirmModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirm Action", 
    message = "Are you sure you want to perform this action?", 
    confirmText = "Confirm", 
    cancelText = "Cancel", 
    type = "danger" 
}) {
    if (!isOpen) return null;

    // Map icons based on modal types (danger, warning, success, info)
    const getIcon = () => {
        switch (type) {
            case "danger":
                return <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>delete_forever</span>;
            case "warning":
                return <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>warning</span>;
            case "success":
                return <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>check_circle</span>;
            case "info":
            default:
                return <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>info</span>;
        }
    };

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div className="custom-modal-glass" onClick={(e) => e.stopPropagation()}>
                <div className="custom-modal-header">
                    <div className={`custom-modal-icon-box ${type}`}>
                        {getIcon()}
                    </div>
                    <div className="custom-modal-text">
                        <h3>{title}</h3>
                        <p>{message}</p>
                    </div>
                </div>
                <div className="custom-modal-footer">
                    <button type="button" className="btn-modal-cancel" onClick={onClose}>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>undo</span>
                        {cancelText}
                    </button>
                    <button type="button" className={`btn-modal-confirm ${type}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CustomConfirmModal;
