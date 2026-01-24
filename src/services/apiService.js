/**
 * API Service
 * Centralized Axios client for backend communication
 * Handles all API calls to FastAPI + LangChain backend
 */

import axios from 'axios';

// Base API URL - adjust if backend runs on different port
const API_BASE_URL = 'http://127.0.0.1:8000';

// Create Axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout for document processing
});

/**
 * Centralized error handler
 * Extracts meaningful error messages from API responses
 */
const handleError = (error) => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.detail || error.response.data?.message || 'An error occurred';
    return {
      message,
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // Request made but no response received
    return {
      message: 'No response from server. Please check if the backend is running.',
      status: 0,
    };
  } else {
    // Error in request setup
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
    };
  }
};

/**
 * Upload document for processing
 * @param {File} file - The document file to upload
 * @param {string} documentType - Type of document: 'invoice', 'resume', or 'report'
 * @param {string} jobDescription - Optional job description for resume processing
 * @returns {Promise} API response with structured JSON data
 */
export const uploadDocument = async (file, documentType, jobDescription = '') => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    let endpoint;
    let config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    // Route to correct endpoint based on document type
    switch (documentType) {
      case 'invoice':
        endpoint = '/process-invoice';
        break;
      case 'resume':
        endpoint = '/process-resume';
        formData.append('job_description', jobDescription);
        break;
      case 'report':
        endpoint = '/process-report';
        break;
      default:
        throw new Error(`Unknown document type: ${documentType}`);
    }

    const response = await apiClient.post(endpoint, formData, config);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: handleError(error),
    };
  }
};

/**
 * Confirm and send corrected data to backend
 * Backend forwards to n8n automation
 * @param {Object} payload - Confirmation payload with original and corrected data
 * @returns {Promise} API response
 */
export const confirmData = async (payload) => {
  try {
    const response = await apiClient.post('/confirm', payload);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: handleError(error),
    };
  }
};

export default apiClient;
