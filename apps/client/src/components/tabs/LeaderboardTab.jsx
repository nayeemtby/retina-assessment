import { useState, useEffect, useCallback } from 'react';
import { leaderboardApi, examsApi } from '../../api/client.js';
import { useAuth } from '../../context/useAuth.js';
import { useToast } from '../../context/useToast.js';
import { RankBadge, StatusBadge } from '../common/Badge.jsx';
import { Pagination } from '../common/Pagination.jsx';
import { AlertBanner } from '../common/AlertBanner.jsx';

export function LeaderboardTab() {
  const { isAuthenticated } = useAuth();
  const { error } = useToast();

  // Selected Exam
  const [selectedExamId, setSelectedExamId] = useState('');
  const [manualExamId, setManualExamId] = useState('');

  // Exam list initialized from cache
  const [examsList, setExamsList] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('cached_exams') || '[]');
      return Array.isArray(cached) ? cached : [];
    } catch {
      return [];
    }
  });

  // Leaderboard data
  const [examMeta, setExamMeta] = useState(null);
  const [leaderboardRecords, setLeaderboardRecords] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState('');

  // If authenticated, refresh known exams list from API
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    examsApi
      .list({ limit: 100 })
      .then((res) => {
        if (!active) return;
        const items = res.items || [];
        if (items.length > 0) {
          setExamsList(items);
          try {
            localStorage.setItem('cached_exams', JSON.stringify(items));
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // ignore
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // Fetch leaderboard for selected exam
  const fetchLeaderboard = useCallback(async (examId, page = 1) => {
    if (!examId) {
      setExamMeta(null);
      setLeaderboardRecords([]);
      return;
    }

    setLoadingLeaderboard(true);
    setLeaderboardError('');

    try {
      const res = await leaderboardApi.get(examId, { page, limit: 10 });
      const data = res.value || res.data || {};

      setExamMeta(data.exam || null);
      setLeaderboardRecords(data.leaderboard || []);

      if (data.pagination) {
        setPagination(data.pagination);
      } else if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      const msg = err.message || 'Failed to load leaderboard for this examination.';
      setLeaderboardError(msg);
      setExamMeta(null);
      setLeaderboardRecords([]);
      error(msg, 'Leaderboard Error');
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [error]);

  const handleExamChange = (e) => {
    const newId = e.target.value;
    setSelectedExamId(newId);
    if (newId) {
      fetchLeaderboard(newId, 1);
    } else {
      setExamMeta(null);
      setLeaderboardRecords([]);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualExamId.trim()) return;
    const cleanId = manualExamId.trim();
    setSelectedExamId(cleanId);
    fetchLeaderboard(cleanId, 1);
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
        <div className="tab-title-with-badge">
          <h2>Public Examination Leaderboard</h2>
          <span className="badge badge-public">Public Access — No Login Required</span>
        </div>
        <p className="tab-subtitle">
          Real-time official standings and performance metrics. Ranks are determined sequentially by descending obtained marks, tie-broken by student registration number.
        </p>
      </div>

      {/* Exam Selection Bar */}
      <section className="card filter-card">
        <div className="leaderboard-selector-row">
          <div className="filter-item filter-search">
            <label htmlFor="select-leaderboard-exam">Select Examination</label>
            <select
              id="select-leaderboard-exam"
              className="form-select select-lg"
              value={selectedExamId}
              onChange={handleExamChange}
              disabled={loadingLeaderboard}
            >
              <option value="">-- Choose Examination to View Standings --</option>
              {examsList.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} (Total: {exam.totalMarks} pts) [{exam.status}]
                </option>
              ))}
            </select>
          </div>

          <div className="manual-id-block">
            <form onSubmit={handleManualSearch} className="manual-id-form">
              <label htmlFor="manual-exam-id">Or Search by Exam ID</label>
              <div className="input-group">
                <input
                  id="manual-exam-id"
                  type="text"
                  className="form-input"
                  placeholder="Paste 24-char ObjectId..."
                  value={manualExamId}
                  onChange={(e) => setManualExamId(e.target.value)}
                  disabled={loadingLeaderboard}
                />
                <button
                  type="submit"
                  className="btn btn-accent btn-sm"
                  disabled={!manualExamId.trim() || loadingLeaderboard}
                >
                  Load
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Selected Exam Summary Card */}
      {examMeta && (
        <section className="card exam-meta-card">
          <div className="exam-meta-grid">
            <div className="meta-block">
              <span className="meta-label">Examination:</span>
              <h3 className="meta-title">{examMeta.title}</h3>
            </div>
            <div className="meta-block">
              <span className="meta-label">Total Marks:</span>
              <span className="meta-value badge badge-marks">{examMeta.totalMarks} points</span>
            </div>
            <div className="meta-block">
              <span className="meta-label">Exam Date:</span>
              <span className="meta-value">{formatDate(examMeta.examDate)}</span>
            </div>
            <div className="meta-block">
              <span className="meta-label">Status:</span>
              <span className="meta-value">
                <StatusBadge status={examMeta.status} />
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Leaderboard Table Card */}
      <section className="card table-card">
        <div className="card-header space-between">
          <h3>Rankings & Standings</h3>
          {selectedExamId && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fetchLeaderboard(selectedExamId, pagination.currentPage)}
              disabled={loadingLeaderboard}
            >
              {loadingLeaderboard ? 'Refreshing...' : '↻ Refresh Standings'}
            </button>
          )}
        </div>

        <div className="card-body">
          {leaderboardError && (
            <AlertBanner
              type="error"
              title="Query Error"
              message={leaderboardError}
              onClose={() => setLeaderboardError('')}
            />
          )}

          {!selectedExamId ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <h4>No Examination Selected</h4>
              <p>Please select an examination from the dropdown above to view official student rankings.</p>
            </div>
          ) : loadingLeaderboard ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Aggregating official rankings and calculating percentages...</p>
            </div>
          ) : leaderboardRecords.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h4>No Results Recorded Yet</h4>
              <p>No student exam evaluations have been recorded for this examination yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table leaderboard-table">
                <thead>
                  <tr>
                    <th style={{ width: '130px' }}>Rank</th>
                    <th>Reg No</th>
                    <th>Student Name</th>
                    <th>Batch</th>
                    <th>Department</th>
                    <th>Obtained Marks</th>
                    <th>Total Marks</th>
                    <th className="text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardRecords.map((entry) => {
                    const isTop1 = entry.rank === 1;
                    const isTop2 = entry.rank === 2;
                    const isTop3 = entry.rank === 3;
                    const rowClass = isTop1
                      ? 'row-top-1'
                      : isTop2
                      ? 'row-top-2'
                      : isTop3
                      ? 'row-top-3'
                      : '';

                    return (
                      <tr key={entry.registrationNumber} className={rowClass}>
                        <td>
                          <RankBadge rank={entry.rank} />
                        </td>
                        <td>
                          <span className="code-pill">#{entry.registrationNumber}</span>
                        </td>
                        <td className="font-semibold">{entry.name}</td>
                        <td>
                          <span className="badge badge-neutral">{entry.batch}</span>
                        </td>
                        <td>{entry.department}</td>
                        <td>
                          <span className="badge badge-marks">{entry.obtainedMarks}</span>
                        </td>
                        <td>{entry.totalMarks}</td>
                        <td className="text-right">
                          <span className={`percentage-pill ${isTop1 || isTop2 || isTop3 ? 'percentage-top' : ''}`}>
                            {Number(entry.percentage).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {selectedExamId && leaderboardRecords.length > 0 && (
            <Pagination
              pagination={pagination}
              onPageChange={(p) => fetchLeaderboard(selectedExamId, p)}
              isLoading={loadingLeaderboard}
            />
          )}
        </div>
      </section>
    </div>
  );
}
