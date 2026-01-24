/**
 * ReportReviewForm Component
 * Editable form for AI-extracted report data.
 * Fields match backend: agents/schemas.py ReportData
 * - summary, metrics (Dict), risks (List)
 * ReportResponse also has: document_type, department, notes (top-level)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmData } from '../services/apiService';
import './ReviewForm.css';

// Normalize metrics from backend (Dict) to array of {key, value} for editing
function metricsToEntries(metrics) {
  if (metrics && typeof metrics === 'object' && !Array.isArray(metrics)) {
    return Object.entries(metrics).map(([k, v]) => ({ key: String(k), value: String(v ?? '') }));
  }
  return [];
}

function entriesToMetrics(entries) {
  return Object.fromEntries(
    entries.filter((e) => (e.key || '').trim()).map((e) => [e.key.trim(), e.value])
  );
}

const ReportReviewForm = ({ aiResponse }) => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const extractedData = aiResponse?.extracted_data || {};
  const risks = Array.isArray(extractedData.risks) ? extractedData.risks : [];

  const getInitial = () => ({
    summary: extractedData.summary ?? '',
    metrics: metricsToEntries(extractedData.metrics),
    risks: [...risks],
    priority: aiResponse?.priority ?? 'medium',
    action: aiResponse?.action ?? '',
  });

  const [formData, setFormData] = useState(getInitial);
  const [originalData] = useState(getInitial);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayItemChange = (name, index, value) => {
    setFormData((prev) => {
      const arr = [...prev[name]];
      arr[index] = value;
      return { ...prev, [name]: arr };
    });
  };

  const handleMetricChange = (index, field, value) => {
    setFormData((prev) => {
      const m = [...prev.metrics];
      m[index] = { ...m[index], [field]: value };
      return { ...prev, metrics: m };
    });
  };

  const handleAdd = (name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'metrics' ? [...prev.metrics, { key: '', value: '' }] : [...prev[name], ''],
    }));
  };

  const handleRemove = (name, index) => {
    setFormData((prev) => ({
      ...prev,
      [name]: prev[name].filter((_, i) => i !== index),
    }));
  };

  const isFieldModified = (field) =>
    JSON.stringify(formData[field]) !== JSON.stringify(originalData[field]);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        original_ai_output: aiResponse,
        human_corrected_output: {
          ...aiResponse,
          extracted_data: {
            summary: formData.summary,
            metrics: entriesToMetrics(formData.metrics),
            risks: formData.risks,
          },
          document_type: aiResponse.document_type,
          department: aiResponse.department,
          priority: formData.priority,
          action: formData.action,
        },
        confirmed: true,
        timestamp: new Date().toISOString(),
        user_id: 'user_' + Date.now(),
      };
      const result = await confirmData(payload);
      if (result.success) {
        setSuccess(true);
        sessionStorage.removeItem('aiResponse');
        sessionStorage.removeItem('originalFile');
        setTimeout(() => navigate('/'), 3000);
      } else {
        setError(result.error?.message || 'Failed to confirm. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Confirmation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="review-form">
        <div className="success-message">
          <h2>✓ Data Confirmed Successfully</h2>
          <p>Your corrections have been sent to the automation system.</p>
          <p>Redirecting to upload page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="review-form">
      <h2>Review Research Report Data</h2>
      <p className="form-description">
        Review and correct the AI-extracted report. Modified fields are highlighted.
      </p>

      <div className="form-section">
        <h3>Summary</h3>
        <div className={`form-field ${isFieldModified('summary') ? 'modified' : ''}`}>
          <label>Executive Summary *</label>
          <textarea
            value={formData.summary}
            onChange={(e) => handleChange('summary', e.target.value)}
            rows={6}
            required
            placeholder="Enter the executive summary..."
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Priority & Action</h3>
        <div className="form-row">
          <div className="form-field">
            <label>Priority</label>
            <select value={formData.priority} onChange={(e) => handleChange('priority', e.target.value)}>
              <option value="">— Select —</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="form-field">
            <label>Action</label>
            <select value={formData.action} onChange={(e) => handleChange('action', e.target.value)}>
              <option value="">— Select —</option>
              <option value="Approve">Approve</option>
              <option value="Reject">Reject</option>
              <option value="Forward to Manager">Forward to Manager</option>
              <option value="Request More Info">Request More Info</option>
              <option value="Process">Process</option>
              <option value="Review">Review</option>
              <option value="Hold">Hold</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Metrics (key–value)</h3>
        <div className="array-items-list">
          {formData.metrics.map((m, i) => (
            <div key={i} className="array-item metrics-row">
              <input
                type="text"
                value={m.key}
                onChange={(e) => handleMetricChange(i, 'key', e.target.value)}
                placeholder="Metric name"
              />
              <input
                type="text"
                value={m.value}
                onChange={(e) => handleMetricChange(i, 'value', e.target.value)}
                placeholder="Value"
              />
              <button type="button" onClick={() => handleRemove('metrics', i)} className="remove-button">
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => handleAdd('metrics')} className="add-button">
            + Add Metric
          </button>
        </div>
      </div>

      <div className="form-section">
        <h3>Risks</h3>
        <div className="array-items-list">
          {formData.risks.map((r, i) => (
            <div key={i} className="array-item">
              <input
                type="text"
                value={r}
                onChange={(e) => handleArrayItemChange('risks', i, e.target.value)}
                placeholder="Risk description"
              />
              <button type="button" onClick={() => handleRemove('risks', i)} className="remove-button">
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => handleAdd('risks')} className="add-button">
            + Add Risk
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="form-actions">
        <button type="button" onClick={() => navigate('/')} className="back-button" disabled={loading}>
          Back
        </button>
        <button type="button" onClick={handleConfirm} className="confirm-button" disabled={loading}>
          {loading ? 'Confirming...' : 'Confirm & Send to Automation'}
        </button>
      </div>
    </div>
  );
};

export default ReportReviewForm;
