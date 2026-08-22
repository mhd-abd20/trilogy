const BASE_URL = 'http://localhost:8080/api';

export const customFetch = async (endpoint, options = {}) => {
  const defaultHeaders = {};

  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (options.body instanceof FormData && config.headers['Content-Type']) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // التعديل هنا: الفحص عن message أو error
    throw new Error(errorData.message || errorData.error || 'حدث خطأ في الطلب');
  }

  return response.json();
};