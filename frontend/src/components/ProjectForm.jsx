import { useState, useEffect } from 'react';

const INITIAL_FORM = {
    name: '',
    clientName: '',
    startDate: '',
    endDate: '',
};

export default function ProjectForm({ project, onSubmit, onClose }) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const isEdit = Boolean(project);

    useEffect(() => {
        if (project) {
            setForm({
                name: project.name || '',
                clientName: project.clientName || '',
                startDate: project.startDate ? project.startDate.substring(0, 10) : '',
                endDate: project.endDate ? project.endDate.substring(0, 10) : '',
            });
        }
    }, [project]);

    function validate() {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Project name is required';
        if (!form.clientName.trim()) errs.clientName = 'Client name is required';
        if (form.startDate && form.endDate && form.endDate < form.startDate) {
            errs.endDate = 'End date must be after or equal to start date';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            await onSubmit({
                ...form,
                startDate: form.startDate || null,
                endDate: form.endDate || null,
            });
            onClose();
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to save project';
            setErrors({ submit: msg });
        } finally {
            setSubmitting(false);
        }
    }

    function handleChange(field, value) {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isEdit ? 'Edit Project' : 'New Project'}</h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {errors.submit && <div className="error-banner">⚠ {errors.submit}</div>}

                        <div className="form-group">
                            <label htmlFor="project-name">Project Name *</label>
                            <input
                                id="project-name"
                                className="form-control"
                                value={form.name}
                                onChange={e => handleChange('name', e.target.value)}
                                placeholder="Enter project name"
                                autoFocus
                            />
                            {errors.name && <div className="form-error">{errors.name}</div>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="project-client">Client Name *</label>
                            <input
                                id="project-client"
                                className="form-control"
                                value={form.clientName}
                                onChange={e => handleChange('clientName', e.target.value)}
                                placeholder="Enter client name"
                            />
                            {errors.clientName && <div className="form-error">{errors.clientName}</div>}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="project-start">Start Date</label>
                                <input
                                    id="project-start"
                                    type="date"
                                    className="form-control"
                                    value={form.startDate}
                                    onChange={e => handleChange('startDate', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="project-end">End Date</label>
                                <input
                                    id="project-end"
                                    type="date"
                                    className="form-control"
                                    value={form.endDate}
                                    onChange={e => handleChange('endDate', e.target.value)}
                                />
                                {errors.endDate && <div className="form-error">{errors.endDate}</div>}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
