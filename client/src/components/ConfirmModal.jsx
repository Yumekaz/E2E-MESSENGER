import React from 'react';

function ConfirmModal({ isOpen, title, message, details, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal glass-modal confirm-modal">
                <div className="modal-header">
                    <h3>{title}</h3>
                </div>

                <div className="confirm-content">
                    <p className="confirm-message">{message}</p>

                    {details && details.length > 0 && (
                        <ul className="confirm-details">
                            {details.map((detail, index) => (
                                <li key={index}>{detail}</li>
                            ))}
                        </ul>
                    )}

                    <p className="confirm-warning">This action cannot be undone.</p>
                </div>

                <div className="confirm-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button
                        className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmModal;
