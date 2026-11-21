export class ApiError extends Error {
  constructor(message, { code = 'UNKNOWN_ERROR', details = null, status = 200 } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.status = status;
    this.isConflict = code === 'CONFLICT' || status === 409;
    this.isNotFound = code === 'NOT_FOUND' || status === 404;
    this.isUnauthorized = code === 'UNAUTHORIZED' || status === 401;
    this.isValidationError = code === 'VALIDATION_ERROR' || status === 400;
  }
}

export async function apiRequest(endpoint, { method = 'GET', body = null, token = null, query = null } = {}) {
  let url = endpoint;
  if (query && typeof query === 'object') {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(query)) {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const headers = {};
  if (body !== null && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const effectiveToken = token || localStorage.getItem('admin_token');
  if (effectiveToken) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (netErr) {
    throw new ApiError(`Network error connecting to API: ${netErr.message}`, {
      code: 'NETWORK_ERROR',
      status: 0,
    });
  }

  let json;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(`Server returned non-JSON response with HTTP status ${response.status}`, {
      code: 'INVALID_RESPONSE',
      status: response.status,
    });
  }

  // Handle WireResult contract: { success: true, value, data, items, pagination } or { success: false, error }
  if (json.success === false) {
    const errorObj = json.error || {};
    const message = errorObj.message || json.message || 'Operation failed';
    const code = errorObj.code || (response.status === 409 ? 'CONFLICT' : 'REQUEST_FAILED');
    const details = errorObj.details || json.errors || null;

    throw new ApiError(message, {
      code,
      details,
      status: response.status,
    });
  }

  if (!response.ok) {
    throw new ApiError(json.message || `HTTP ${response.status} Error`, {
      code: 'HTTP_ERROR',
      status: response.status,
    });
  }

  const value = json.value !== undefined ? json.value : json.data;
  const items = json.items || (value && value.items) || (Array.isArray(value) ? value : (Array.isArray(json.data) ? json.data : []));
  const pagination = json.pagination || (value && value.pagination) || null;

  return {
    success: true,
    value,
    data: json.data !== undefined ? json.data : value,
    items,
    pagination,
    message: json.message || '',
  };
}

export const authApi = {
  bootstrap: (data) => apiRequest('/api/auth/bootstrap', { method: 'POST', body: data }),
  login: (data) => apiRequest('/api/auth/login', { method: 'POST', body: data }),
  me: () => apiRequest('/api/auth/me'),
};

export const studentsApi = {
  list: (params) => apiRequest('/api/students', { query: params }),
  get: (id) => apiRequest(`/api/students/${id}`),
  create: (data) => apiRequest('/api/students', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/api/students/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/api/students/${id}`, { method: 'DELETE' }),
};

export const examsApi = {
  list: (params) => apiRequest('/api/exams', { query: params }),
  get: (id) => apiRequest(`/api/exams/${id}`),
  create: (data) => apiRequest('/api/exams', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/api/exams/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/api/exams/${id}`, { method: 'DELETE' }),
};

export const resultsApi = {
  list: (params) => apiRequest('/api/results', { query: params }),
  get: (id) => apiRequest(`/api/results/${id}`),
  create: (data) => apiRequest('/api/results', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/api/results/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/api/results/${id}`, { method: 'DELETE' }),
};

export const leaderboardApi = {
  get: (examId, params) => apiRequest(`/api/exams/${examId}/leaderboard`, { query: params }),
};
