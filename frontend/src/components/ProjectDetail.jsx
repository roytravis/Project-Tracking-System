import StatusBadge from './StatusBadge';

export default function ProjectDetail({ project, onClose }) {
    if (!project) return null;

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Project Details</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">✕</button>
                </div>
                <div className="modal-body">
                    <div className="detail-grid">
                        <div className="detail-field full-width">
                            <label>Project Name</label>
                            <p>{project.name}</p>
                        </div>
                        <div className="detail-field">
                            <label>Client Name</label>
                            <p>{project.clientName}</p>
                        </div>
                        <div className="detail-field">
                            <label>Status</label>
                            <p><StatusBadge status={project.status} /></p>
                        </div>
                        <div className="detail-field">
                            <label>Start Date</label>
                            <p>{formatDate(project.startDate)}</p>
                        </div>
                        <div className="detail-field">
                            <label>End Date</label>
                            <p>{formatDate(project.endDate)}</p>
                        </div>
                        <div className="detail-field">
                            <label>Created At</label>
                            <p>{formatDate(project.createdAt)}</p>
                        </div>
                        <div className="detail-field">
                            <label>Last Updated</label>
                            <p>{formatDate(project.updatedAt)}</p>
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
