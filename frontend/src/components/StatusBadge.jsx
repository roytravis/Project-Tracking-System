const STATUS_CONFIG = {
    active: { label: 'Active', color: '#60a5fa' },
    on_hold: { label: 'On Hold', color: '#fbbf24' },
    completed: { label: 'Completed', color: '#34d399' },
};

export default function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || { label: status, color: '#9ca3af' };

    return (
        <span className={`status-badge status-${status}`}>
            <span className="dot"></span>
            {config.label}
        </span>
    );
}

export { STATUS_CONFIG };
