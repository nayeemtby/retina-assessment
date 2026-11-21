import { useState, useEffect, useCallback, useMemo } from 'react';
import { resultsApi, studentsApi, examsApi } from '../../api/client.js';
import { useAuth } from '../../context/useAuth.js';
import { useToast } from '../../context/useToast.js';
import { Pagination } from '../common/Pagination.jsx';
import { AlertBanner } from '../common/AlertBanner.jsx';

export function ResultsTab() {
  const { isAuthenticated } = useAuth();
  const { success, error, warning } = useToast();

  // Results list & pagination
  const [results, setResults] = useState([]);
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

  // Dropdown options
  const [availableStudents, setAvailableStudents] = useState([]);
  const [availableExams, setAvailableExams] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Filter state
  const [filterExamId, setFilterExamId] = useState('');
  const [filterStudentId, setFilterStudentId] = useState('');

  // Form state
  const initialForm = {
    studentId: '',
    examId: '',
    obtainedMarks: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [editingResultId, setEditingResultId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Selected exam lookup for client-side pre-validation
  const selectedExam = useMemo(() => {
    if (!formData.examId) return null;
    return availableExams.find((e) => e.id === formData.examId) || null;
  }, [availableExams, formData.examId]);

  // Client-side score bounds checking
  const obtainedMarksNumber = formData.obtainedMarks !== '' ? Number(formData.obtainedMarks) : null;
  const isMarksExceeded =
    selectedExam !== null &&
    obtainedMarksNumber !== null &&
    !Number.isNaN(obtainedMarksNumber) &&
    obtainedMarksNumber > selectedExam.totalMarks;

  const isMarksNegative =
    obtainedMarksNumber !== null &&
    !Number.isNaN(obtainedMarksNumber) &&
    obtainedMarksNumber < 0;

  const isSubmitDisabled =
    formLoading ||
    !isAuthenticated ||
    !formData.studentId ||
    !formData.examId ||
    formData.obtainedMarks === '' ||
    Number.isNaN(obtainedMarksNumber) ||
    isMarksExceeded ||
    isMarksNegative;

  // Deletion in progress
  const [deletingId, setDeletingId] = useState(null);

  // Load dropdown options (students & exams)
  const loadDropdownOptions = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingOptions(true);
    try {
      const [studentsRes, examsRes] = await Promise.all([
        studentsApi.list({ limit: 100 }),
        examsApi.list({ limit: 100 }),
      ]);
      setAvailableStudents(studentsRes.items || []);
      setAvailableExams(examsRes.items || []);
    } catch {
      // Ignore initial dropdown fetch errors if not yet seeded
    } finally {
      setLoadingOptions(false);
    }
  }, [isAuthenticated]);

  // Fetch paginated results
  const fetchResults = useCallback(async (page = 1, examIdFilter = filterExamId, studentIdFilter = filterStudentId) => {
    if (!isAuthenticated) return;
    setListLoading(true);
    setTableError('');

    try {
      const res = await resultsApi.list({
        page,
        limit: 10,
        examId: examIdFilter || undefined,
        studentId: studentIdFilter || undefined,
      });

      setResults(res.items || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      const msg = err.message || 'Failed to load results.';
      setTableError(msg);
      error(msg, 'Error Loading Results');
    } finally {
      setListLoading(false);
    }
  }, [isAuthenticated, filterExamId, filterStudentId, error]);

  // Initial load on auth
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    Promise.all([
      studentsApi.list({ limit: 100 }).catch(() => ({ items: [] })),
      examsApi.list({ limit: 100 }).catch(() => ({ items: [] })),
      resultsApi.list({ page: 1, limit: 10 }).catch(() => ({ items: [], pagination: null })),
    ]).then(([studentsRes, examsRes, resultsRes]) => {
      if (!active) return;
      setAvailableStudents(studentsRes.items || []);
      setAvailableExams(examsRes.items || []);
      setResults(resultsRes.items || []);
      if (resultsRes.pagination) {
        setPagination(resultsRes.pagination);
      }
    });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const startEdit = (resultItem) => {
    setEditingResultId(resultItem.id);
    setFormData({
      studentId: resultItem.studentId || (resultItem.student && resultItem.student.id) || '',
      examId: resultItem.examId || (resultItem.exam && resultItem.exam.id) || '',
      obtainedMarks: String(resultItem.obtainedMarks),
    });
    setFormError('');
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingResultId(null);
    setFormData(initialForm);
    setFormError('');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      warning('Please log in as administrator to record results.', 'Authentication Required');
      return;
    }

    if (isMarksExceeded) {
      setFormError(`Obtained marks (${obtainedMarksNumber}) cannot exceed exam total marks (${selectedExam.totalMarks}).`);
      return;
    }

    if (isMarksNegative) {
      setFormError('Obtained marks cannot be negative.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      if (editingResultId) {
        // PUT /api/results/:id only accepts { obtainedMarks }
        await resultsApi.update(editingResultId, {
          obtainedMarks: Number(formData.obtainedMarks),
        });
        success('Exam result score updated successfully.', 'Result Updated');
        cancelEdit();
      } else {
        await resultsApi.create({
          studentId: formData.studentId,
          examId: formData.examId,
          obtainedMarks: Number(formData.obtainedMarks),
        });
        success('Exam result recorded successfully.', 'Result Saved');
        setFormData(initialForm);
      }
      fetchResults(pagination.currentPage || 1);
    } catch (err) {
      const msg = err.message || 'Failed to record result.';
      setFormError(msg);
      error(msg, err.isConflict ? 'Conflict' : 'Error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (resultItem) => {
    if (!isAuthenticated) {
      warning('Please log in as administrator to delete results.', 'Authentication Required');
      return;
    }

    const studentName = resultItem.student ? resultItem.student.name : 'Selected student';
    const examTitle = resultItem.exam ? resultItem.exam.title : 'this exam';

    const confirmed = window.confirm(
      `Delete result of ${studentName} for ${examTitle} (${resultItem.obtainedMarks} marks)?`
    );
    if (!confirmed) return;

    setDeletingId(resultItem.id);
    setTableError('');

    try {
      await resultsApi.delete(resultItem.id);
      success('Result deleted successfully.', 'Result Deleted');
      if (editingResultId === resultItem.id) {
        cancelEdit();
      }
      fetchResults(pagination.currentPage);
    } catch (err) {
      const msg = err.message || 'Failed to delete result.';
      setTableError(msg);
      error(msg, 'Delete Error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="tab-pane">
      <div className="tab-header">
        <h2>Examination Results Management</h2>
        <p className="tab-subtitle">
          Record student marks for examinations with client-side bounds checking, update scores, and audit recorded evaluations.
        </p>
      </div>

      {!isAuthenticated && (
        <AlertBanner
          type="warning"
          title="Guest Mode"
          message="You are not logged in. An active administrator session is required to record, update, or remove exam results."
        />
      )}

      {/* Record / Edit Result Form */}
      <section className="card form-card">
        <div className="card-header">
          <div className="step-tag">{editingResultId ? 'Edit Score' : 'Submission'}</div>
          <h3>{editingResultId ? 'Update Obtained Marks' : 'Record Student Exam Result'}</h3>
        </div>

        <div className="card-body">
          {formError && (
            <AlertBanner
              type="error"
              title="Submission Error"
              message={formError}
              onClose={() => setFormError('')}
            />
          )}

          <form onSubmit={handleFormSubmit} className="grid-form">
            {/* Student Dropdown */}
            <div className="form-group">
              <label htmlFor="result-student">Select Candidate Student *</label>
              <select
                id="result-student"
                name="studentId"
                className="form-select"
                value={formData.studentId}
                onChange={handleFormChange}
                required
                disabled={formLoading || !isAuthenticated || Boolean(editingResultId) || loadingOptions}
              >
                <option value="">-- Choose Student --</option>
                {availableStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.registrationNumber} — {s.name} ({s.department})
                  </option>
                ))}
              </select>
              {editingResultId && (
                <span className="field-hint">Student cannot be altered when editing existing score</span>
              )}
            </div>

            {/* Exam Dropdown */}
            <div className="form-group">
              <label htmlFor="result-exam">Select Examination *</label>
              <select
                id="result-exam"
                name="examId"
                className="form-select"
                value={formData.examId}
                onChange={handleFormChange}
                required
                disabled={formLoading || !isAuthenticated || Boolean(editingResultId) || loadingOptions}
              >
                <option value="">-- Choose Examination --</option>
                {availableExams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} (Max Marks: {e.totalMarks}) [{e.status}]
                  </option>
                ))}
              </select>
              {editingResultId && (
                <span className="field-hint">Exam cannot be altered when editing existing score</span>
              )}
            </div>

            {/* Obtained Marks with Client-Side Pre-Validation */}
            <div className="form-group form-group-span-2">
              <div className="label-with-badge">
                <label htmlFor="result-marks">Obtained Marks *</label>
                {selectedExam && (
                  <span className="badge badge-info">
                    Max Marks: <strong>{selectedExam.totalMarks}</strong>
                  </span>
                )}
              </div>

              <input
                id="result-marks"
                name="obtainedMarks"
                type="number"
                min="0"
                max={selectedExam ? selectedExam.totalMarks : undefined}
                step="any"
                className={`form-input ${isMarksExceeded ? 'input-invalid' : ''}`}
                placeholder={selectedExam ? `Enter marks between 0 and ${selectedExam.totalMarks}` : 'Select an exam first'}
                value={formData.obtainedMarks}
                onChange={handleFormChange}
                required
                disabled={formLoading || !isAuthenticated}
              />

              {/* Client-side pre-validation feedback */}
              {isMarksExceeded && (
                <div className="validation-warning" role="alert">
                  ⚠️ <strong>Validation Error:</strong> Obtained marks ({obtainedMarksNumber}) cannot exceed the exam total marks ({selectedExam.totalMarks})!
                </div>
              )}

              {isMarksNegative && (
                <div className="validation-warning" role="alert">
                  ⚠️ <strong>Validation Error:</strong> Obtained marks cannot be negative!
                </div>
              )}

              {selectedExam && !isMarksExceeded && !isMarksNegative && formData.obtainedMarks !== '' && (
                <span className="field-hint text-success">
                  ✓ Valid score: {((obtainedMarksNumber / selectedExam.totalMarks) * 100).toFixed(2)}% of total
                </span>
              )}
            </div>

            <div className="form-actions-inline form-group-span-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitDisabled}
              >
                {formLoading ? 'Submitting...' : editingResultId ? 'Update Result Score' : 'Submit Result'}
              </button>

              {editingResultId && (
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

      {/* Filter Bar for Results */}
      <section className="card filter-card">
        <div className="filters-row">
          <div className="filter-item">
            <label htmlFor="filter-result-exam">Filter by Exam</label>
            <select
              id="filter-result-exam"
              className="form-select"
              value={filterExamId}
              onChange={(e) => {
                setFilterExamId(e.target.value);
                fetchResults(1, e.target.value, filterStudentId);
              }}
              disabled={!isAuthenticated}
            >
              <option value="">All Examinations</option>
              {availableExams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filter-result-student">Filter by Student</label>
            <select
              id="filter-result-student"
              className="form-select"
              value={filterStudentId}
              onChange={(e) => {
                setFilterStudentId(e.target.value);
                fetchResults(1, filterExamId, e.target.value);
              }}
              disabled={!isAuthenticated}
            >
              <option value="">All Students</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.registrationNumber} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-buttons">
            {(filterExamId || filterStudentId) && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setFilterExamId('');
                  setFilterStudentId('');
                  fetchResults(1, '', '');
                }}
                disabled={!isAuthenticated || listLoading}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Paginated Results Table */}
      <section className="card table-card">
        <div className="card-header space-between">
          <h3>Recorded Student Results</h3>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => {
              loadDropdownOptions();
              fetchResults(pagination.currentPage);
            }}
            disabled={!isAuthenticated || listLoading}
          >
            {listLoading ? 'Refreshing...' : '↻ Refresh Table'}
          </button>
        </div>

        <div className="card-body">
          {tableError && (
            <AlertBanner
              type="error"
              title="Error"
              message={tableError}
              onClose={() => setTableError('')}
            />
          )}

          {!isAuthenticated ? (
            <div className="empty-state">
              <p>Please log in as an administrator to inspect recorded examination results.</p>
            </div>
          ) : listLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading results...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <p>No results recorded. Use the form above to record student performance.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Exam Title</th>
                    <th>Obtained Marks</th>
                    <th>Total Marks</th>
                    <th>Percentage</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item) => {
                    const studentDisplay = item.student
                      ? `#${item.student.registrationNumber} — ${item.student.name}`
                      : item.studentId;
                    const examTitle = item.exam ? item.exam.title : item.examId;
                    const totalMarks = item.exam ? item.exam.totalMarks : null;
                    const percentage = totalMarks ? ((item.obtainedMarks / totalMarks) * 100).toFixed(2) : null;

                    return (
                      <tr key={item.id} className={editingResultId === item.id ? 'row-highlight' : ''}>
                        <td className="font-semibold">{studentDisplay}</td>
                        <td>{examTitle}</td>
                        <td>
                          <span className="badge badge-marks">{item.obtainedMarks}</span>
                        </td>
                        <td>{totalMarks !== null ? `${totalMarks}` : '—'}</td>
                        <td>
                          {percentage !== null ? (
                            <span className="font-semibold">{percentage}%</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="text-right">
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={() => startEdit(item)}
                              disabled={deletingId === item.id}
                            >
                              Edit Marks
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-xs"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                            >
                              {deletingId === item.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {isAuthenticated && results.length > 0 && (
            <Pagination
              pagination={pagination}
              onPageChange={(p) => fetchResults(p)}
              isLoading={listLoading}
            />
          )}
        </div>
      </section>
    </div>
  );
}
