/**
 * UploadPage Component
 * Handles document upload and document type selection
 * Sends file to backend and navigates to ReviewPage with AI response
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument } from '../services/apiService';
import './UploadPage.css';

const UploadPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('invoice');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Handle file selection
   */
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validExtensions = ['.pdf', '.docx', '.txt'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        setError('Unsupported file type. Please upload PDF, DOCX, or TXT files.');
        setFile(null);
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  /**
   * Handle form submission
   * Uploads document to backend and navigates to review page
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await uploadDocument(file, documentType, jobDescription);

      if (result.success) {
        // Store AI response in sessionStorage for ReviewPage
        sessionStorage.setItem('aiResponse', JSON.stringify(result.data));
        sessionStorage.setItem('originalFile', file.name);
        
        // Navigate to review page
        navigate('/review');
      } else {
        setError(result.error?.message || 'Failed to process document. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="upload-container">
        <header className="upload-header">
          <h1>AI Business Automation Platform</h1>
          <p className="subtitle">Upload a document for AI processing and validation</p>
        </header>

        <form onSubmit={handleSubmit} className="upload-form">
          {/* Document Type Selector */}
          <div className="form-group">
            <label htmlFor="documentType">Document Type *</label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              required
              disabled={loading}
            >
              <option value="invoice">Invoice</option>
              <option value="resume">Resume</option>
              <option value="report">Research Report</option>
            </select>
          </div>

          {/* Job Description (for Resume) */}
          {documentType === 'resume' && (
            <div className="form-group">
              <label htmlFor="jobDescription">Job Description *</label>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Enter the job description for resume matching..."
                required
                disabled={loading}
                rows="4"
              />
            </div>
          )}

          {/* File Input */}
          <div className="form-group">
            <label htmlFor="fileInput">Document File *</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="fileInput"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                disabled={loading}
                required
              />
              {file && (
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={loading || !file}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Processing Document...
              </>
            ) : (
              'Upload & Process'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadPage;
