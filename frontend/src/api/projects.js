import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

/**
 * Fetch paginated list of projects with optional filters.
 * @param {Object} params - { status, search, page, limit, sortBy, order }
 */
export async function fetchProjects(params = {}) {
    const { data } = await api.get('/projects', { params });
    return data;
}

/**
 * Fetch a single project by ID.
 */
export async function fetchProject(id) {
    const { data } = await api.get(`/projects/${id}`);
    return data;
}

/**
 * Create a new project.
 */
export async function createProject(project) {
    const { data } = await api.post('/projects', project);
    return data;
}

/**
 * Update project fields.
 */
export async function updateProject(id, fields) {
    const { data } = await api.put(`/projects/${id}`, fields);
    return data;
}

/**
 * Update project status.
 */
export async function updateProjectStatus(id, status) {
    const { data } = await api.patch(`/projects/${id}/status`, { status });
    return data;
}

/**
 * Soft-delete a project.
 */
export async function deleteProject(id) {
    const { data } = await api.delete(`/projects/${id}`);
    return data;
}
