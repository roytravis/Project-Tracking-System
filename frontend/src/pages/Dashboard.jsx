import { useState, useEffect, useCallback, useRef } from 'react';
import {
    fetchProjects,
    createProject,
    updateProject,
    updateProjectStatus,
    deleteProject,
} from '../api/projects';
import StatusBadge, { STATUS_CONFIG } from '../components/StatusBadge';
import ProjectForm from '../components/ProjectForm';
import ProjectDetail from '../components/ProjectDetail';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';

const STATUS_TRANSITIONS = {
    active: ['on_hold', 'completed'],
    on_hold: ['active', 'completed'],
    completed: [],
};

const ALL_STATUSES = ['active', 'on_hold', 'completed'];

const SORT_OPTIONS = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'name', label: 'Project Name' },
    { value: 'clientName', label: 'Client Name' },
    { value: 'startDate', label: 'Start Date' },
    { value: 'endDate', label: 'End Date' },
    { value: 'updatedAt', label: 'Last Updated' },
];

export default function Dashboard() {
    // Data state
    const [projects, setProjects] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [stats, setStats] = useState({});

    // Filter/search/sort state
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [viewingProject, setViewingProject] = useState(null);
    const [deletingProject, setDeletingProject] = useState(null);
    const [toasts, setToasts] = useState([]);

    const searchTimerRef = useRef(null);

    // Debounce search
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 350);
        return () => clearTimeout(searchTimerRef.current);
    }, [searchTerm]);

    // Load projects
    const loadProjects = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = { page: currentPage, limit: 10, sortBy, order: sortOrder };
            if (statusFilter) params.status = statusFilter;
            if (debouncedSearch) params.search = debouncedSearch;

            const result = await fetchProjects(params);
            setProjects(result.data);
            setPagination(result.pagination);
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to load projects');
            setProjects([]);
        } finally {
            setLoading(false);
        }
    }, [currentPage, statusFilter, debouncedSearch, sortBy, sortOrder]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    // Load stats (all projects count by status)
    const loadStats = useCallback(async () => {
        try {
            const result = await fetchProjects({ limit: 100 });
            const counts = {};
            ALL_STATUSES.forEach(s => (counts[s] = 0));
            result.data.forEach(p => {
                counts[p.status] = (counts[p.status] || 0) + 1;
            });
            counts.total = result.pagination.total;
            setStats(counts);
        } catch {
            // stats are optional, don't block on failure
        }
    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    // Toast helper
    function addToast(message, type = 'info') {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
    }

    function removeToast(id) {
        setToasts(prev => prev.filter(t => t.id !== id));
    }

    // Handlers
    async function handleCreate(data) {
        await createProject(data);
        addToast('Project created successfully', 'success');
        loadProjects();
        loadStats();
    }

    async function handleEdit(data) {
        await updateProject(editingProject.id, data);
        addToast('Project updated successfully', 'success');
        setEditingProject(null);
        loadProjects();
        loadStats();
    }

    async function handleStatusChange(projectId, newStatus) {
        try {
            await updateProjectStatus(projectId, newStatus);
            addToast('Status updated', 'success');
            loadProjects();
            loadStats();
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to update status', 'error');
        }
    }

    async function handleDelete() {
        if (!deletingProject) return;
        try {
            await deleteProject(deletingProject.id);
            addToast('Project deleted', 'success');
            setDeletingProject(null);
            loadProjects();
            loadStats();
        } catch (err) {
            addToast(err.response?.data?.error || 'Failed to delete project', 'error');
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    // Render helpers
    function renderStats() {
        return (
            <div className="stats-bar">
                <div className="stat-card">
                    <div>
                        <div className="stat-number">{stats.total || 0}</div>
                        <div className="stat-label">Total Projects</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div>
                        <div className="stat-number" style={{ color: '#60a5fa' }}>{stats.active || 0}</div>
                        <div className="stat-label">Active</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div>
                        <div className="stat-number" style={{ color: '#fbbf24' }}>{stats.on_hold || 0}</div>
                        <div className="stat-label">On Hold</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div>
                        <div className="stat-number" style={{ color: '#34d399' }}>{stats.completed || 0}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                </div>
            </div>
        );
    }

    function renderToolbar() {
        return (
            <div className="toolbar">
                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Search by project or client name..."
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                        }}
                    />
                </div>
                <div className="filter-tabs">
                    <button
                        className={`btn btn-ghost btn-sm ${!statusFilter ? 'active' : ''}`}
                        onClick={() => { setStatusFilter(''); setCurrentPage(1); }}
                    >
                        All
                    </button>
                    {ALL_STATUSES.map(s => (
                        <button
                            key={s}
                            className={`btn btn-ghost btn-sm ${statusFilter === s ? 'active' : ''}`}
                            onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                        >
                            {STATUS_CONFIG[s].label}
                        </button>
                    ))}
                </div>
                <div className="sort-controls">
                    <select
                        className="sort-select"
                        value={sortBy}
                        onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }}
                        title="Sort by"
                    >
                        {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <button
                        className="btn btn-ghost btn-sm sort-order-btn"
                        onClick={() => { setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); setCurrentPage(1); }}
                        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                    >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    + New Project
                </button>
            </div>
        );
    }

    function renderTable() {
        return (
            <div className="table-container">
                <table className="project-table">
                    <thead>
                        <tr>
                            <th>Project</th>
                            <th>Client</th>
                            <th>Status</th>
                            <th>End Date</th>
                            <th>Created</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(project => (
                            <tr key={project.id}>
                                <td>
                                    <span
                                        className="project-name"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setViewingProject(project)}
                                    >
                                        {project.name}
                                    </span>
                                </td>
                                <td className="project-client">{project.clientName}</td>
                                <td>
                                    {STATUS_TRANSITIONS[project.status]?.length > 0 ? (
                                        <select
                                            className="status-select"
                                            value={project.status}
                                            onChange={e => handleStatusChange(project.id, e.target.value)}
                                        >
                                            <option value={project.status}>
                                                {STATUS_CONFIG[project.status]?.label}
                                            </option>
                                            {STATUS_TRANSITIONS[project.status].map(s => (
                                                <option key={s} value={s}>
                                                    → {STATUS_CONFIG[s]?.label}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <StatusBadge status={project.status} />
                                    )}
                                </td>
                                <td className="project-date">{formatDate(project.endDate)}</td>
                                <td className="project-date">{formatDate(project.createdAt)}</td>
                                <td>
                                    <div className="actions-cell">
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setViewingProject(project)}
                                            title="View details"
                                        >
                                            👁
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setEditingProject(project)}
                                            title="Edit project"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => setDeletingProject(project)}
                                            title="Delete project"
                                            style={{ color: 'var(--color-danger)' }}
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="pagination">
                        <span>
                            Showing {(pagination.page - 1) * pagination.limit + 1}–
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                        </span>
                        <div className="pagination-controls">
                            <button
                                className="page-btn"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                ← Prev
                            </button>
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                                <button
                                    key={p}
                                    className={`page-btn ${p === currentPage ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(p)}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                className="page-btn"
                                disabled={currentPage >= pagination.totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    function renderEmptyState() {
        const isFiltered = statusFilter || debouncedSearch;
        return (
            <div className="table-container">
                <div className="state-container">
                    <div className="state-icon">{isFiltered ? '🔍' : '📋'}</div>
                    <div className="state-title">
                        {isFiltered ? 'No matching projects' : 'No projects yet'}
                    </div>
                    <div className="state-desc">
                        {isFiltered
                            ? 'Try adjusting your search or filter criteria.'
                            : 'Create your first project to get started.'}
                    </div>
                    {!isFiltered && (
                        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>
                            + Create Project
                        </button>
                    )}
                </div>
            </div>
        );
    }

    function renderLoading() {
        return (
            <div className="table-container">
                <div className="state-container">
                    <div className="spinner"></div>
                    <div className="state-title">Loading projects...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {renderStats()}
            {renderToolbar()}

            {error && (
                <div className="error-banner">
                    <span>⚠ {error}</span>
                    <button onClick={loadProjects}>Retry</button>
                </div>
            )}

            {loading ? renderLoading() : projects.length > 0 ? renderTable() : renderEmptyState()}

            {/* Modals */}
            {showForm && (
                <ProjectForm
                    onSubmit={handleCreate}
                    onClose={() => setShowForm(false)}
                />
            )}

            {editingProject && (
                <ProjectForm
                    project={editingProject}
                    onSubmit={handleEdit}
                    onClose={() => setEditingProject(null)}
                />
            )}

            {viewingProject && (
                <ProjectDetail
                    project={viewingProject}
                    onClose={() => setViewingProject(null)}
                />
            )}

            {deletingProject && (
                <ConfirmDialog
                    title="Delete Project"
                    message={
                        <>Are you sure you want to delete <strong>{deletingProject.name}</strong>? This action can be undone by an administrator.</>
                    }
                    onConfirm={handleDelete}
                    onCancel={() => setDeletingProject(null)}
                />
            )}

            <Toast toasts={toasts} onRemove={removeToast} />
        </div>
    );
}
