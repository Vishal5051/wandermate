import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { safetyAPI } from '../../utils/api';

function ReviewModal({ entityId, entityType, entityName, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await safetyAPI.addReview({
        entity_id: entityId,
        entity_type: entityType,
        rating,
        comment
      });
      alert('Review submitted! Thank you for helping the community stay safe.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}><X size={20} /></button>
        <h2 className="modal-title">Rate your experience</h2>
        <p className="modal-subtitle">How was your time with {entityName}?</p>

        <form onSubmit={handleSubmit}>
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                className="star-btn"
                onClick={() => setRating(s)}
              >
                <Star
                  size={32}
                  fill={s <= rating ? "#fbbf24" : "none"}
                  color={s <= rating ? "#fbbf24" : "#d1d5db"}
                />
              </button>
            ))}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display:'block', fontSize:'12px', fontWeight:'700', marginBottom:'8px', textTransform:'uppercase', color:'#64748b' }}>
              Your feedback
            </label>
            <textarea
              className="modern-input"
              rows="4"
              placeholder="Tell us more about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            ></textarea>
          </div>

          <button
            type="submit"
            className="btn-modern btn-modern-primary"
            style={{ width: '100%' }}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Post Review'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReviewModal;
