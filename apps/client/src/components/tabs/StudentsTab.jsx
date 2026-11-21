import { useState, useEffect, useCallback } from 'react';
import { studentsApi } from '../../api/client.js';
import { useAuth } from '../../context/useAuth.js';
import { useToast } from '../../context/useToast.js';
import { Pagination } from '../common/Pagination.jsx';
import { AlertBanner } from '../common/AlertBanner.jsx';

export function StudentsTab() {
  const { isAuthenticated } = useAuth();
  const { success, error, warning } = useToast();

  // Student list and pagination state
  const [students, setStudents] = useState([]);
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

  // Search & Filter state
  const [filters, setFilters] = useState({
    search: '',
    batch: '',
    department: '',
  });

  // Create / Edit Form state
  const initialForm = {
    registrationNumber: '',
    name: '',
    email: '',
    batch: '',
    department: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Deletion in progress ID
  const [deletingId, setDeletingId] = useState(null);

  const fetchStudents = useCallback(async (page = 1, currentFilters = filters) => {
    if (!isAuthenticated) return;
    setListLoading(true);
    setTableError('');

    try {
      const res = await studentsApi.list({
        page,
        limit: 10,
        search: currentFilters.search || undefined,
        batch: currentFilters.batch || undefined,
        department: currentFilters.department || undefined,
      });

      setStudents(res.items || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      const msg = err.message || 'Failed to load students.';
      setTableError(msg);
      error(msg, 'Error Loading Students');
    } finally {
      setListLoading(false);
    }
  }, [isAuthenticated, filters, error]);

  // Initial load on authentication
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    studentsApi
      .list({ page: 1, limit: 10 })
      .then((res) => {
        if (!active) return;
        setStudents(res.items || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      })
      .catch((err) => {
        if (!active) return;
        setTableError(err.message || 'Failed to load students.');
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
    fetchStudents(1, filters);
  };

  const handleClearFilters = () => {
    const cleared = { search: '', batch: '', department: '' };
    setFilters(cleared);
    fetchStudents(1, cleared);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const startEdit = (student) => {
    setEditingStudentId(student.id);
    setFormData({
      registrationNumber: String(student.registrationNumber),
      name: student.name,
      email: student.email,
      batch: student.batch,
      department: student.department,
    });
    setFormError('');
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingStudentId(null);
    setFormData(initialForm);
    setFormError('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      warning('Please log in as administrator to manage students.', 'Authentication Required');
      return;
    }

    setFormLoading(true);
    setFormError('');

    const payload = {
      registrationNumber: Number(formData.registrationNumber),
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      batch: formData.batch.trim(),
      department: formData.department.trim(),
    };

    try {
      if (editingStudentId) {
        await studentsApi.update(editingStudentId, payload);
        success(`Student "${payload.name}" updated successfully.`, 'Student Updated');
        cancelEdit();
      } else {
        await studentsApi.create(payload);
        success(`Student "${payload.name}" created successfully with Reg No #${payload.registrationNumber}.`, 'Student Created');
        setFormData(initialForm);
      }
      fetchStudents(pagination.currentPage || 1, filters);
    } catch (err) {
      const msg = err.message || (editingStudentId ? 'Failed to update student.' : 'Failed to create student.');
      setFormError(msg);
      error(msg, err.isConflict ? 'Conflict' : 'Submission Error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (student) => {
    if (!isAuthenticated) {
      warning('Please log in as administrator to delete students.', 'Authentication Required');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete student "${student.name}" (Reg No: ${student.registrationNumber})?`
    );
    if (!confirmed) return;

    setDeletingId(student.id);
    setTableError('');

    try {
      await studentsApi.delete(student.id);
      success(`Student "${student.name}" deleted successfully.`, 'Student Deleted');
      if (editingStudentId === student.id) {
        cancelEdit();
      }
      fetchStudents(pagination.currentPage, filters);
    } catch (err) {
      if (err.isConflict || err.status === 409) {
        const msg = err.message || 'Cannot delete student: Student has existing exam results. Delete results first.';
        setTableError(msg);
        error(msg, 'Referential Integrity Conflict (409)');
      } else {
        const msg = err.message || 'Failed to delete student.';
        setTableError(msg);
        error(msg, 'Delete Error');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="tab-pane">
      <div className="tab-header">
        <h2>Student Management</h2>
        <p className="tab-subtitle">
          Register new student candidates, update student enrollment details, and inspect paginated student directory.
        </p>
      </div>

      {!isAuthenticated && (
        <AlertBanner
          type="warning"
          title="Guest Mode"
          message="You are not logged in. An active administrator session is required to register, edit, or delete students."
        />
      )}

      {/* Student Create / Edit Form */}
      <section className="card form-card">
        <div className="card-header">
          <div className="step-tag">{editingStudentId ? 'Edit Mode' : 'Form'}</div>
          <h3>{editingStudentId ? `Update Student Record (#${formData.registrationNumber})` : 'Register New Student'}</h3>
        </div>

        <div className="card-body">
          {formError && (
            <AlertBanner
              type="error"
              title="Validation or Conflict"
              message={formError}
              onClose={() => setFormError('')}
            />
          )}

          <form onSubmit={handleFormSubmit} className="grid-form">
            <div className="form-group">
              <label htmlFor="student-regno">Registration Number *</label>
              <input
                id="student-regno"
                name="registrationNumber"
                type="number"
                min="1"
                step="1"
                className="form-input"
                placeholder="e.g. 1001"
                value={formData.registrationNumber}
                onChange={handleFormChange}
                required
                disabled={formLoading || !isAuthenticated}
              />
              <span className="field-hint">Unique positive integer ID</span>
            </div>

            <div className="form-group">
              <label htmlFor="student-name">Full Name *</label>
              <input
                id="student-name"
                name="name"
                type="text"
                className="form-input"
                placeholder="e.g. Jane Doe"
                value={formData.name}
                onChange={handleFormChange}
                required
                disabled={formLoading || !isAuthenticated}
              />
            </div>

            <div className="form-group">
              <label htmlFor="student-email">Email Address *</label>
              <input
                id="student-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="jane.doe@university.edu"
                value={formData.email}
                onChange={handleFormChange}
                required
                disabled={formLoading || !isAuthenticated}
              />
            </div>

            <div className="form-group">
              <label htmlFor="student-batch">Batch *</label>
              <input
                id="student-batch"
                name="batch"
                type="text"
                className="form-input"
                placeholder="e.g. 2024 or Fall 2024"
                value={formData.batch}
                onChange={handleFormChange}
                required
                disabled={formLoading || !isAuthenticated}
              />
            </div>

            <div className="form-group">
              <label htmlFor="student-dept">Department *</label>
              <input
                id="student-dept"
                name="department"
                type="text"
                className="form-input"
                placeholder="e.g. Computer Science"
                value={formData.department}
                onChange={handleFormChange}
                required
                disabled={formLoading || !isAuthenticated}
              />
            </div>

            <div className="form-actions-inline">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formLoading || !isAuthenticated}
              >
                {formLoading ? 'Submitting...' : editingStudentId ? 'Save Student Changes' : 'Register Student'}
              </button>

              {editingStudentId && (
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

      {/* Search & Filter Bar */}
      <section className="card filter-card">
        <form onSubmit={handleFilterSubmit} className="filters-row">
          <div className="filter-item filter-search">
            <label htmlFor="filter-search">Search Students</label>
            <input
              id="filter-search"
              name="search"
              type="text"
              className="form-input"
              placeholder="Search by name or registration number..."
              value={filters.search}
              onChange={handleFilterChange}
              disabled={!isAuthenticated}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="filter-batch">Batch</label>
            <input
              id="filter-batch"
              name="batch"
              type="text"
              className="form-input"
              placeholder="Filter by batch..."
              value={filters.batch}
              onChange={handleFilterChange}
              disabled={!isAuthenticated}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="filter-department">Department</label>
            <input
              id="filter-department"
              name="department"
              type="text"
              className="form-input"
              placeholder="Filter by department..."
              value={filters.department}
              onChange={handleFilterChange}
              disabled={!isAuthenticated}
            />
          </div>

          <div className="filter-buttons">
            <button
              type="submit"
              className="btn btn-accent btn-sm"
              disabled={!isAuthenticated || listLoading}
            >
              Apply Filter
            </button>
            {(filters.search || filters.batch || filters.department) && (
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

      {/* Paginated Student Table */}
      <section className="card table-card">
        <div className="card-header space-between">
          <h3>Enrolled Students Directory</h3>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => fetchStudents(pagination.currentPage, filters)}
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
              <p>Please log in as an administrator to view and manage students.</p>
            </div>
          ) : listLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading students directory...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <p>No students found. Use the registration form above to create the first student record.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reg No</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Batch</th>
                    <th>Department</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className={editingStudentId === student.id ? 'row-highlight' : ''}>
                      <td>
                        <span className="code-pill">#{student.registrationNumber}</span>
                      </td>
                      <td className="font-semibold">{student.name}</td>
                      <td>{student.email}</td>
                      <td>
                        <span className="badge badge-neutral">{student.batch}</span>
                      </td>
                      <td>{student.department}</td>
                      <td className="text-right">
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={() => startEdit(student)}
                            disabled={deletingId === student.id}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-xs"
                            onClick={() => handleDelete(student)}
                            disabled={deletingId === student.id}
                          >
                            {deletingId === student.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {isAuthenticated && students.length > 0 && (
            <Pagination
              pagination={pagination}
              onPageChange={(p) => fetchStudents(p, filters)}
              isLoading={listLoading}
            />
          )}
        </div>
      </section>
    </div>
  );
}
