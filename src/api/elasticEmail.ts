import { ELASTIC_EMAIL_API_BASE, ELASTIC_EMAIL_API_V4_BASE } from './config';

// --- API Helper for v2 ---
export const apiFetch = async (endpoint: string, apiKey: string, options: { method?: 'GET' | 'POST', params?: Record<string, any> } = {}) => {
  const { method = 'GET', params = {} } = options;
  
  const allParams = new URLSearchParams({
    apikey: apiKey,
    ...params
  });

  const url = `${ELASTIC_EMAIL_API_BASE}${endpoint}`;
  let response;

  if (method === 'POST') {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: allParams
    });
  } else { // GET
    response = await fetch(`${url}?${allParams.toString()}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }
  
  return data.data;
};

// --- API Helper for v4 ---
export const apiFetchV4 = async (endpoint: string, apiKey: string, options: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE', params?: Record<string, any>, body?: any } = {}) => {
    const { method = 'GET', params = {}, body = null } = options;
    const queryParams = new URLSearchParams(params).toString();
    const url = `${ELASTIC_EMAIL_API_V4_BASE}${endpoint}${queryParams ? `?${queryParams}` : ''}`;

    const fetchOptions: RequestInit = {
        method,
        headers: {
            'X-ElasticEmail-ApiKey': apiKey,
        }
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.Error || 'An unknown API error occurred.';
        } catch (e) {
            // response was not json, use default message
        }
        throw new Error(errorMessage);
    }
    
    if (response.status === 204) {
        return {};
    }

    const text = await response.text();
    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch (e) {
        console.warn(`API for endpoint ${endpoint} returned a non-JSON success response. Text: "${text}"`);
        // This handles cases where a success response (like 200 OK for DELETE) has a non-JSON body like "OK".
        // Returning a success-like object prevents the caller's try/catch from failing.
        return { success: true, nonJsonText: text };
    }
};

export const apiUploadV4 = async (endpoint: string, apiKey: string, formData: FormData) => {
    const url = `${ELASTIC_EMAIL_API_V4_BASE}${endpoint}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'X-ElasticEmail-ApiKey': apiKey
        },
        body: formData
    });

    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.Error || 'An unknown API error occurred.';
        } catch (e) { /* no-op */ }
        throw new Error(errorMessage);
    }

    // Import returns 202, file upload returns 201
    if (response.status === 202) { 
        return {};
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
};
