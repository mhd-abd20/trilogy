const raw = import.meta.env.VITE_BACKEND_URL;
const SERVER_ORIGIN = `${raw}/api`
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

  const response = await fetch(`${SERVER_ORIGIN}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || 'حدث خطأ في الطلب');
  }

  return response.json();
};