/**
 * ResumeReviewForm Component
 * Editable form for AI-extracted resume data.
 * - candidate_name, email, phone, skills, experience_years, education, missing_skills, summary
 * - AI recommendation: shortlist | reject
 * - User tabs to manually choose: Shortlist | Reject
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmData } from '../services/apiService';
import './ReviewForm.css';

function normalizeExtractedData(aiResponse) {
  const extracted =
    (aiResponse && (aiResponse.extracted_data || aiResponse.extractedData)) || {};

  const pick = (...keys) => {
    for (const k of keys) {
      if (extracted && Object.prototype.hasOwnProperty.call(extracted, k) && extracted[k] != null) {
        const v = extracted[k];
        if (typeof v === 'string' && v.trim() === '') continue;
        return v;
      }
    }
    return undefined;
  };

  const toStr = (v) => {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    return String(v);
  };

  const stripInvisible = (s) =>
    String(s || '')
      // NBSP -> space
      .replace(/\u00A0/g, ' ')
      // zero-width & BOM chars
      .replace(/[\u200B-\u200D\uFEFF]/g, '');

  const normalizeSingleLine = (s) =>
    stripInvisible(s)
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();

  const normalizeEmail = (s) =>
    stripInvisible(s)
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, '')
      .trim()
      .toLowerCase();

  const normalizeMultiline = (s) => {
    const cleaned = stripInvisible(s).replace(/\r\n/g, '\n');
    const lines = cleaned.split('\n').map((ln) => ln.replace(/\s+/g, ' ').trim());
    // Keep meaningful line breaks, drop empty leading/trailing lines
    return lines.join('\n').trim();
  };

  const titleCaseIfAllCaps = (s) => {
    const t = normalizeSingleLine(s);
    if (!t) return t;
    const hasLower = /[a-z]/.test(t);
    const hasUpper = /[A-Z]/.test(t);
    // Only convert if it's basically ALL CAPS text
    if (hasUpper && !hasLower) {
      return t
        .toLowerCase()
        .split(' ')
        .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ');
    }
    return t;
  };

  const toList = (v) => {
    if (v == null) return [];
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    if (typeof v === 'string') {
      return v
        .split(/[,;\n•]+/g)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [String(v).trim()].filter(Boolean);
  };

  return {
    candidate_name: titleCaseIfAllCaps(
      toStr(pick('candidate_name', 'candidateName', 'name', 'full_name', 'fullName'))
    ),
    email: normalizeEmail(toStr(pick('email', 'Email'))),
    phone: normalizeSingleLine(toStr(pick('phone', 'phone_number', 'phoneNumber', 'mobile', 'contact'))),
    skills: toList(pick('skills', 'Skills')).map(normalizeSingleLine),
    experience_years: normalizeSingleLine(
      toStr(pick('experience_years', 'experienceYears', 'years_of_experience', 'experience'))
    ),
    education: normalizeMultiline(toStr(pick('education', 'Education', 'qualification', 'degree'))),
    missing_skills: toList(pick('missing_skills', 'missingSkills', 'missing', 'skill_gaps', 'gaps')).map(
      normalizeSingleLine
    ),
    summary: normalizeMultiline(
      toStr(pick('summary', 'Summary', 'profile_summary', 'professional_summary', 'about'))
    ),
  };
}

const ResumeReviewForm = ({ aiResponse }) => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const aiRec = useMemo(() => (aiResponse?.recommendation || '').toLowerCase(), [aiResponse]);
  const initialDecision = aiRec === 'shortlist' || aiRec === 'reject' ? aiRec : '';

  const initialFormState = useMemo(() => {
    const extractedData = normalizeExtractedData(aiResponse);
    return {
      candidate_name: extractedData.candidate_name ?? '',
      email: extractedData.email ?? '',
      phone: extractedData.phone ?? '',
      skills: Array.isArray(extractedData.skills) ? extractedData.skills : [],
      experience_years: extractedData.experience_years ?? '',
      education:
        typeof extractedData.education === 'string'
          ? extractedData.education
          : extractedData.education
            ? String(extractedData.education)
            : '',
      missing_skills: Array.isArray(extractedData.missing_skills) ? extractedData.missing_skills : [],
      summary: extractedData.summary ?? '',
      priority: aiResponse?.priority ?? '',
      action: aiResponse?.action ?? '',
      decision: initialDecision,
    };
  }, [aiResponse, initialDecision]);

  const [formData, setFormData] = useState(initialFormState);
  const [originalData, setOriginalData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);

  // When a new AI response arrives (new upload), refresh the form fields.
  useEffect(() => {
    setFormData(initialFormState);
    setOriginalData(initialFormState);
  }, [initialFormState]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSkillChange = (index, value) => {
    setFormData((prev) => {
      const s = [...prev.skills];
      s[index] = value;
      return { ...prev, skills: s };
    });
  };

  const handleAddSkill = () => setFormData((prev) => ({ ...prev, skills: [...prev.skills, ''] }));
  const handleRemoveSkill = (index) =>
    setFormData((prev) => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));

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
            candidate_name: formData.candidate_name,
            email: formData.email,
            phone: formData.phone,
            skills: formData.skills.filter(Boolean),
            experience_years: formData.experience_years,
            education: formData.education,
            missing_skills: formData.missing_skills,
            summary: formData.summary,
          },
          document_type: aiResponse.document_type,
          department: aiResponse.department,
          priority: formData.priority,
          action: formData.action,
          recommendation: aiResponse?.recommendation ?? '',
          decision: formData.decision || null,
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

  const aiRecLabel = aiRec === 'shortlist' ? 'Shortlist' : aiRec === 'reject' ? 'Reject' : null;

  return (
    <div className="review-form">
      <h2>Review Resume Data</h2>
      <p className="form-description">
        Review and correct the AI-extracted candidate information. Modified fields are highlighted.
      </p>

      <div className="form-section">
        <h3>Candidate Information</h3>

        <div className={`form-field ${isFieldModified('candidate_name') ? 'modified' : ''}`}>
          <label>Candidate Name *</label>
          <input
            type="text"
            value={formData.candidate_name}
            onChange={(e) => handleChange('candidate_name', e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className={`form-field ${isFieldModified('email') ? 'modified' : ''}`}>
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required
            />
          </div>
          <div className={`form-field ${isFieldModified('phone') ? 'modified' : ''}`}>
            <label>Phone</label>
            <input type="tel" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
          </div>
        </div>

        <div className={`form-field ${isFieldModified('experience_years') ? 'modified' : ''}`}>
          <label>Years of Experience</label>
          <input
            type="text"
            value={formData.experience_years}
            onChange={(e) => handleChange('experience_years', e.target.value)}
            placeholder="e.g. 5 or 3-5 years"
          />
        </div>

        <div className={`form-field ${isFieldModified('education') ? 'modified' : ''}`}>
          <label>Education</label>
          <textarea
            value={formData.education}
            onChange={(e) => handleChange('education', e.target.value)}
            rows={3}
            placeholder="Degree, institution, year"
          />
        </div>

        <div className={`form-field ${isFieldModified('summary') ? 'modified' : ''}`}>
          <label>Summary</label>
          <textarea
            value={formData.summary}
            onChange={(e) => handleChange('summary', e.target.value)}
            rows={4}
            placeholder="Brief professional summary"
          />
        </div>
      </div>

      <div className="form-section">
        <h3>Skills</h3>

        <div className="skills-container">
          {formData.skills.map((skill, i) => (
            <div key={i} className="skill-item">
              <input
                type="text"
                value={skill}
                onChange={(e) => handleSkillChange(i, e.target.value)}
                placeholder="Skill"
              />
              <button type="button" onClick={() => handleRemoveSkill(i)} className="remove-button">
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={handleAddSkill} className="add-button">
            + Add Skill
          </button>
        </div>

        {formData.missing_skills?.length > 0 && (
          <div className="missing-skills">
            <h4>Missing Skills (from Job Description)</h4>
            <div className="skills-tags">
              {formData.missing_skills.map((s, i) => (
                <span key={i} className="skill-tag missing">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="form-section">
        <h3>Decision: Shortlist or Reject</h3>
        <div className="decision-section">
          {aiRecLabel != null && (
            <p className="decision-ai">
              <strong>AI recommends:</strong> {aiRecLabel}
            </p>
          )}
          <div className="decision-tabs" role="tablist" aria-label="Choose Shortlist or Reject">
            <button
              type="button"
              role="tab"
              aria-selected={formData.decision === 'shortlist'}
              aria-label="Shortlist"
              className={`decision-tab shortlist ${formData.decision === 'shortlist' ? 'active' : ''}`}
              onClick={() => handleChange('decision', 'shortlist')}
            >
              Shortlist
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={formData.decision === 'reject'}
              aria-label="Reject"
              className={`decision-tab reject ${formData.decision === 'reject' ? 'active' : ''}`}
              onClick={() => handleChange('decision', 'reject')}
            >
              Reject
            </button>
          </div>
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

export default ResumeReviewForm;
