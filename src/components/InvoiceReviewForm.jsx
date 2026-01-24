/**
 * InvoiceReviewForm Component
 * Editable form for reviewing AI-extracted invoice data.
 * Fields match backend exactly: agents/schemas.py InvoiceData
 * - invoice_number, Store_name, date, total_amount, due_date
 * (brain.py maps vendor_name → Store_name)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmData } from '../services/apiService';
import './ReviewForm.css';

const InvoiceReviewForm = ({ aiResponse }) => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Backend extracted_data: invoice_number, Store_name, date, total_amount, due_date
  const extractedData = aiResponse?.extracted_data || {};

  const getInitial = () => ({
    invoice_number: extractedData.invoice_number ?? '',
    Store_name: extractedData.Store_name ?? '',
    date: extractedData.date ?? '',
    total_amount: extractedData.total_amount ?? '',
    due_date: extractedData.due_date ?? '',
    priority: aiResponse?.priority ?? '',
    action: aiResponse?.action ?? '',
  });

  const [formData, setFormData] = useState(getInitial);
  const [originalData] = useState(getInitial);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
            invoice_number: formData.invoice_number,
            Store_name: formData.Store_name,
            date: formData.date,
            total_amount: formData.total_amount === '' ? 0.0 : parseFloat(formData.total_amount) || 0.0,
            due_date: formData.due_date || null,
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
      <h2>Review Invoice Data</h2>
      <p className="form-description">
        Review and correct the AI-extracted invoice fields. Modified fields are highlighted.
      </p>

      <div className="form-section">
        <h3>Invoice Information</h3>

        <div className="form-row">
          <div className={`form-field ${isFieldModified('invoice_number') ? 'modified' : ''}`}>
            <label>Invoice Number *</label>
            <input
              type="text"
              value={formData.invoice_number}
              onChange={(e) => handleChange('invoice_number', e.target.value)}
              required
            />
          </div>

          <div className={`form-field ${isFieldModified('Store_name') ? 'modified' : ''}`}>
            <label>Store / Vendor Name *</label>
            <input
              type="text"
              value={formData.Store_name}
              onChange={(e) => handleChange('Store_name', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className={`form-field ${isFieldModified('date') ? 'modified' : ''}`}>
            <label>Invoice Date *</label>
            <input
              type="text"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              placeholder="e.g. dd-mm-yyyy"
              required
            />
          </div>

          <div className={`form-field ${isFieldModified('due_date') ? 'modified' : ''}`}>
            <label>Due Date</label>
            <input
              type="text"
              value={formData.due_date}
              onChange={(e) => handleChange('due_date', e.target.value)}
              placeholder="e.g. dd-mm-yyyy"
            />
          </div>
        </div>

        <div className={`form-field ${isFieldModified('total_amount') ? 'modified' : ''}`}>
          <label>Total Amount *</label>
          <input
            type="number"
            step="0.01"
            value={formData.total_amount}
            onChange={(e) => handleChange('total_amount', e.target.value)}
            required
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

export default InvoiceReviewForm;
