export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true }) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onCancel} aria-label="Close">✕</button>
                </div>
                <div className="modal-body">
                    <p className="confirm-text">{message}</p>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
                    <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
