/**
 * ReviewPage Component
 * Displays AI processing results and renders appropriate review form
 * Handles confirmation and sends data to backend/n8n
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InvoiceReviewForm from '../components/InvoiceReviewForm';
import ResumeReviewForm from '../components/ResumeReviewForm';
import ReportReviewForm from '../components/ReportReviewForm';
import './ReviewPage.css';

const ReviewPage = () => {
  const navigate = useNavigate();
  const [aiResponse, setAiResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load AI response from sessionStorage
    const storedResponse = sessionStorage.getItem('aiResponse');
    
    if (!storedResponse) {
      setError('No AI response found. Please upload a document first.');
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(storedResponse);
      setAiResponse(parsed);
    } catch (err) {
      setError('Invalid AI response data.');
      console.error('Parse error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Render appropriate review form based on document type
   */
  const renderReviewForm = () => {
    if (!aiResponse) return null;

    const documentType = aiResponse.document_type?.toLowerCase();

    switch (documentType) {
      case 'invoice':
        return <InvoiceReviewForm aiResponse={aiResponse} />;
      case 'resume':
        return <ResumeReviewForm aiResponse={aiResponse} />;
      case 'report':
        return <ReportReviewForm aiResponse={aiResponse} />;
      default:
        return (
          <div className="error-container">
            <p>Unknown document type: {documentType || 'N/A'}</p>
            <button onClick={() => navigate('/')} className="back-button">
              Back to Upload
            </button>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="review-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading AI response...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="back-button">
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  if (!aiResponse) {
    return (
      <div className="review-page">
        <div className="error-container">
          <h2>No Data Available</h2>
          <p>Unable to load AI response data.</p>
          <button onClick={() => navigate('/')} className="back-button">
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="review-page">
      <div className="review-container">
        {/* AI Response Summary */}
        <header className="review-header">
          <h1>Review AI Processing Results</h1>
          <div className="ai-summary">
            <div className="summary-item">
              <span className="label">Document Type:</span>
              <span className="value">{aiResponse.document_type || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <span className="label">Role:</span>
              <span className="value">{aiResponse.department || 'N/A'}</span>
            </div>
            {(aiResponse.priority != null && aiResponse.priority !== '') && (
              <div className="summary-item">
                <span className="label">Priority:</span>
                <span className={`value priority-${String(aiResponse.priority).toLowerCase()}`}>
                  {aiResponse.priority}
                </span>
              </div>
            )}
            {(aiResponse.action != null && aiResponse.action !== '') && (
              <div className="summary-item">
                <span className="label">Recommended Action:</span>
                <span className="value">{aiResponse.action}</span>
              </div>
            )}
            {(String(aiResponse.document_type || '').toLowerCase() === 'resume' &&
              aiResponse.recommendation != null &&
              aiResponse.recommendation !== '') && (
              <div className="summary-item">
                <span className="label">AI Recommendation:</span>
                <span className="value">{String(aiResponse.recommendation).toUpperCase()}</span>
              </div>
            )}
            {(aiResponse.status != null && aiResponse.status !== '') && (
              <div className="summary-item">
                <span className="label">Status:</span>
                <span className="value">{aiResponse.status}</span>
              </div>
            )}
          </div>
          {aiResponse.notes != null && aiResponse.notes !== '' && (
            <div className="ai-notes">
              <strong>AI Notes:</strong>
              <p>{aiResponse.notes}</p>
            </div>
          )}
        </header>

        {/* Review Form */}
        <div className="review-form-container">
          {renderReviewForm()}
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
