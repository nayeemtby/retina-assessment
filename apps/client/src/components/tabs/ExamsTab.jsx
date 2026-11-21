import { useState, useEffect, useCallback } from 'react';
import { examsApi } from '../../api/client.js';
import { useAuth } from '../../context/useAuth.js';
import { useToast } from '../../context/useToast.js';
import { StatusBadge } from '../common/Badge.jsx';
import { Pagination } from '../common/Pagination.jsx';
import { AlertBanner } from '../common/AlertBanner.jsx';

export function ExamsTab() {
  const { isAuthenticated } = useAuth();
  const { success, error, warning } = useToast();

  // Exams list and pagination
  const [exams, setExams] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [listLoading, setListLoading] = useState(false);
  const [tableError, setTableError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  // Create / Edit Form state
  const initialForm = {
    title: '',
    examDate: '',
    totalMarks: '',
    status: 'draft',
  };
  const [formData, setFormData] = useState(initialForm);
  const [editingExamId, setEditingExamId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Deletion in progress
  const [deletingId, setDeletingId] = useState(null);

  const fetchExams = useCallback(async (page = 1, currentFilters = filters) => {
    if (!isAuthenticated) return;
    setListLoading(true);
    setTableError('');

    try {
      const res = await examsApi.list({
        page,
        limit: 10,
        status: currentFilters.status || undefined,
        search: currentFilters.search || undefined,
      });

      setExams(res.items || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }

      // Cache exams in localStorage so the Public Leaderboard can list them even when logged out
      if (res.items && res.items.length > 0) {
        try {
          const existingCached = JSON.parse(localStorage.getItem('cached_exams') || '[]');
          const combined = [...res.items, ...existingCached];
          const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
          localStorage.setItem('cached_exams', JSON.stringify(unique));
        } catch {
          // ignore cache errors
        }
      }
    } catch (err) {
      const msg = err.message || 'Failed to load exams.';
      setTableError(msg);
      error(msg, 'Error Loading Exams');
    } finally {
      setListLoading(false);
    }
  }, [isAuthenticated, filters, error]);

  // Initial fetch on auth
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    examsApi
      .list({ page: 1, limit: 10 })
      .then((res) => {
        if (!active) return;
        setExams(res.items || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
        if (res.items && res.items.length > 0) {
          try {
            const existingCached = JSON.parse(localStorage.getItem('cached_exams') || '[]');
            const combined = [...res.items, ...existingCached];
            const unique = Array.from(new Map(combined.map((item) => [item.id, item])).values());
            localStorage.setItem('cached_exams', JSON.stringify(unique));
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => {
        if (!active) return;
        setTableError(err.message || 'Failed to load exams.');
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchExams(1, filters);
  };

  const handleClearFilters = () => {
    const cleared = { status: '', search: '' };
    setFilters(cleared);
    fetchExams(1, cleared);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const startEdit = (exam) => {
    setEditingExamId(exam.id);
    let dateStr = '';
    if (exam.examDate) {
      dateStr = exam.examDate.slice(0, 10);
    }
    setFormData({
      title: exam.title,
      examDate: dateStr,
      totalMarks: String(exam.totalMarks),
      status: exam.status,
    });
    setFormError('');
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingExamId(null);
    setFormData(initialForm);
    setFormError('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      warning('Please log in as administrator to manage exams.', 'Authentication Required');
      return;
    }

    setFormLoading(true);
    setFormError('');

    const payload = {
      title: formData.title.trim(),
      examDate: formData.examDate,
      totalMarks: Number(formData.totalMarks),
      status: formData.status,
    };

    try {
      if (editingExamId) {
        await examsApi.update(editingExamId, payload);
        success(`Exam "${payload.title}" updated successfully.`, 'Exam Updated');
        cancelEdit();
      } else {
        await examsApi.create(payload);
        success(`Exam "${payload.title}" created successfully.`, 'Exam Created');
        setFormData(initialForm);
      }
      fetchExams(pagination.currentPage || 1, filters);
    } catch (err) {
      const msg = err.message || (editingExamId ? 'Failed to update exam.' : 'Failed to create exam.');
      setFormError(msg);
      error(msg, err.isConflict ? 'Conflict' : 'Validation Error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (exam) => {
    if (!isAuthenticated) {
      warning('Please log in as administrator to delete exams.', 'Authentication Required');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete exam "${exam.title}"?`
    );
    if (!confirmed) return;

    setDeletingId(exam.id);
    setTableError('');

    try {
      await examsApi.delete(exam.id);
      success(`Exam "${exam.title}" deleted successfully.`, 'Exam Deleted');
      if (editingExamId === exam.id) {
        cancelEdit();
      }
      fetchExams(pagination.currentPage, filters);
    } catch (err) {
      if (err.isConflict || err.status === 409) {
        const msg = err.message || 'Cannot delete exam: Examination has recorded student results. Delete results first.';
        setTableError(msg);
        error(msg, 'Referential Integrity Conflict (409)');
      } else {
        const msg = err.message || 'Failed to delete exam.';
        setTableError(msg);
        error(msg, 'Delete Error');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString.slice(0, 10);
    }
  };

  return (
    <div className="tab-pane">
      <div className="tab-header">
        <h2>Examination Management</h2>
        <p className="tab-subtitle">
          Define examination curricula, schedule exam test dates, configure total available marks, and control status transitions.
        </p>
      </div>

      {!isAuthenticated && (
        <AlertBanner
          type="warning"
          title="Guest Mode"
          message="You are not logged in. An active administrator session is required to create, update, or delete examinations."
        />
      )}

      {/* Exam Create / Edit Form */}
      <section className="card form-card">
        <div className="card-header">
          <div className="step-tag">{editingExamId ? 'Edit Mode' : 'Form'}</div>
          <h3>{editingExamId ? `Update Examination (${formData.title || 'Exam'})` : 'Create New Examination'}</h3>
        </div>

        <div className="card-body">
          {formError && (
            <AlertBanner
              type="error"
              title="Validation or Integrity Constraint"
              message={formError}
              onClose={() => setFormError('')}
            />
          )}

          <form onSubmit={handleFormSubmit} className="grid-form">
            <div className="form-group form-group-span-2">
              <label htmlFor="exam-title">Exam Title *</label>
              <input
                id="exam-title"
                name="title"
                type="text"
                className="form-input"
                placeholder="e.g. Data Structures & Algorithms Final"
                value={formData.title}
                onChange={handleFormChange}
                required
                disabled={formLoading || !isAuthenticated}
              />
            </div>

            <div className="form-group">
              <label htmlFor="exam-date">Exam Date *</label>
              <input
                id="exam-date"
                name="examDate"
                type="date"
                className="form-input"
                value={formData.examDate}
                onChange={handleFormChange}
                required
                disabled={formLoading || !isAuthenticated}
              />
            </div>

            <div className="form-group">
              <label htmlFor="exam-totalmarks">Total Marks *</label>
              <input
                id="exam-totalmarks"
                name="totalMarks"
                type="number"
                min="1"
                step="any"
                className="form-input"
                placeholder="e.g. 100"
                value={formData.totalMarks}
                onChange={handleFormChange}
                required
                disabled={formLoading || !isAuthenticated}
              />
              <span className="field-hint">Must be a positive number</span>
            </div>

            <div className="form-group">
              <label htmlFor="exam-status">Lifecycle Status *</label>
              <select
                id="exam-status"
                name="status"
                className="form-select"
                value={formData.status}
                onChange={handleFormChange}
                disabled={formLoading || !isAuthenticated}
              >
                <option value="draft">Draft (In Preparation)</option>
                <option value="published">Published (Active / Enrolling)</option>
                <option value="completed">Completed (Evaluated)</option>
              </select>
            </div>

            <div className="form-actions-inline form-group-span-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formLoading || !isAuthenticated}
              >
                {formLoading ? 'Saving...' : editingExamId ? 'Update Exam' : 'Create Exam'}
              </button>

              {editingExamId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelEdit}
                  disabled={formLoading}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="card filter-card">
        <form onSubmit={handleFilterSubmit} className="filters-row">
          <div className="filter-item filter-search">
            <label htmlFor="filter-exam-search">Search Exams</label>
            <input
              id="filter-exam-search"
              name="search"
              type="text"
              className="form-input"
              placeholder="Search by exam title..."
              value={filters.search}
              onChange={handleFilterChange}
              disabled={!isAuthenticated}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="filter-exam-status">Filter by Status</label>
            <select
              id="filter-exam-status"
              name="status"
              className="form-select"
              value={filters.status}
              onChange={handleFilterChange}
              disabled={!isAuthenticated}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="filter-buttons">
            <button
              type="submit"
              className="btn btn-accent btn-sm"
              disabled={!isAuthenticated || listLoading}
            >
              Apply Filter
            </button>
            {(filters.search || filters.status) && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleClearFilters}
                disabled={!isAuthenticated || listLoading}
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Paginated Exam Table */}
      <section className="card table-card">
        <div className="card-header space-between">
          <h3>Configured Examinations</h3>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => fetchExams(pagination.currentPage, filters)}
            disabled={!isAuthenticated || listLoading}
          >
            {listLoading ? 'Refreshing...' : '↻ Refresh Table'}
          </button>
        </div>

        <div className="card-body">
          {tableError && (
            <AlertBanner
              type="error"
              title="Operation Blocked"
              message={tableError}
              onClose={() => setTableError('')}
            />
          )}

          {!isAuthenticated ? (
            <div className="empty-state">
              <p>Please log in as an administrator to view and manage examinations.</p>
            </div>
          ) : listLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading examinations...</p>
            </div>
          ) : exams.length === 0 ? (
            <div className="empty-state">
              <p>No examinations found. Use the creation form above to register an exam.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Exam Date</th>
                    <th>Total Marks</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.id} className={editingExamId === exam.id ? 'row-highlight' : ''}>
                      <td className="font-semibold">{exam.title}</td>
                      <td>{formatDate(exam.examDate)}</td>
                      <td>
                        <span className="badge badge-marks">{exam.totalMarks} pts</span>
                      </td>
                      <td>
                        <StatusBadge status={exam.status} />
                      </td>
                      <td className="text-right">
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => startEdit(exam)}
                            disabled={deletingId === exam.id}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-xs"
                            onClick={() => handleDelete(exam)}
                            disabled={deletingId === exam.id}
                          >
                            {deletingId === exam.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {isAuthenticated && exams.length > 0 && (
            <Pagination
              pagination={pagination}
              onPageChange={(p) => fetchExams(p, filters)}
              isLoading={listLoading}
            />
          )}
        </div>
      </section>
    </div>
  );
}
