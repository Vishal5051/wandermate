import React, { useState, useEffect } from 'react';
import { safetyAPI } from '../../utils/api';
import { Shield, CheckCircle, AlertTriangle, Phone, Plus, Trash2, Info, ChevronRight, Camera, Clock } from 'lucide-react';
import './Safety.css';

function SafetyCenter({ user, onBack }) {
  const [aadhaarStatus, setAadhaarStatus] = useState('unverified');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarName, setAadhaarName] = useState('');
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', relationship: '', phone: '' });

  useEffect(() => {
    fetchSafetyData();
  }, []);

  const fetchSafetyData = async () => {
    try {
      setLoading(true);
      const statusRes = await safetyAPI.getAadhaarStatus();
      setAadhaarStatus(statusRes.data.status);
      
      const contactsRes = await safetyAPI.getContacts();
      setContacts(contactsRes.data.contacts);
    } catch (err) {
      console.error('Error fetching safety data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAadhaarSubmit = async (e) => {
    e.preventDefault();
    if (!aadhaarFile || aadhaarNumber.length !== 12) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('aadhaar_number', aadhaarNumber);
      formData.append('aadhaar_name', aadhaarName);
      formData.append('aadhaar_image', aadhaarFile);

      await safetyAPI.verifyAadhaar(formData);
      setAadhaarStatus('pending');
      alert('Aadhaar submitted successfully! Our team will verify it shortly.');
    } catch (err) {
      alert('Failed to submit Aadhaar: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      const res = await safetyAPI.addContact(newContact);
      setContacts(res.data.contacts);
      setNewContact({ name: '', relationship: '', phone: '' });
      setShowContactForm(false);
    } catch (err) {
      alert('Failed to add contact');
    }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Remove this emergency contact?')) return;
    try {
      const res = await safetyAPI.deleteContact(id);
      setContacts(res.data.contacts);
    } catch (err) {
      alert('Failed to delete contact');
    }
  };

  if (loading) return <div className="safety-loading"><div className="spinner"></div></div>;

  return (
    <div className="safety-center glass-effect">
      <div className="safety-header">
        <button onClick={onBack} className="back-link">← Profile</button>
        <h2>Safety & Verification</h2>
        <p className="subtitle">Enhance your trust score and stay protected.</p>
      </div>

      <div className="safety-sections">
        {/* Verification Section */}
        <section className="safety-card">
          <div className="card-header">
            <div className="header-title">
              <Shield className={aadhaarStatus === 'verified' ? 'icon-verified' : 'icon-neutral'} size={24} />
              <h3>Identity Verification</h3>
            </div>
            <span className={`status-badge ${aadhaarStatus}`}>{aadhaarStatus.toUpperCase()}</span>
          </div>

          {aadhaarStatus === 'unverified' && (
            <div className="verification-flow">
              <div className="verification-instructions">
                <h4>Take a clear photo of your Aadhaar Card</h4>
                <ul>
                  <li><CheckCircle size={14} /> Name must match your profile exactly</li>
                  <li><CheckCircle size={14} /> Place card on a flat, dark surface</li>
                  <li><CheckCircle size={14} /> Ensure good lighting (no glare)</li>
                  <li><CheckCircle size={14} /> All 4 corners should be visible</li>
                  <li><CheckCircle size={14} /> Text must be sharp and readable</li>
                </ul>
              </div>

              <form onSubmit={handleAadhaarSubmit} className="aadhaar-form">
                <div className="form-group">
                  <label>Name as on Aadhaar Card</label>
                  <input 
                    type="text" 
                    placeholder="Enter your full name" 
                    value={aadhaarName}
                    onChange={(e) => setAadhaarName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Aadhaar Number (12 Digits)</label>
                  <input 
                    type="text" 
                    placeholder="0000 0000 0000" 
                    maxLength="12" 
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <div className="file-upload">
                  <label className="upload-label">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setAadhaarFile(e.target.files[0])}
                      required
                    />
                    <div className="upload-content">
                      <Camera size={24} />
                      <span>{aadhaarFile ? aadhaarFile.name : 'Upload Aadhaar Photo'}</span>
                    </div>
                  </label>
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Verify Now ➔'}
                </button>
                <p className="privacy-note">🔒 Your data is encrypted and only used for verification.</p>
              </form>
            </div>
          )}

          {aadhaarStatus === 'pending' && (
            <div className="status-message info">
              <Clock size={32} />
              <h4>Verification Under Review</h4>
              <p>We're checking your details. This usually takes less than 24 hours.</p>
            </div>
          )}

          {aadhaarStatus === 'verified' && (
            <div className="status-message success">
              <CheckCircle size={32} />
              <h4>Whistled & Verified!</h4>
              <p>Your identity is confirmed. Enjoy higher visibility and trust in the community.</p>
            </div>
          )}
        </section>

        {/* Emergency Contacts Section */}
        <section className="safety-card">
          <div className="card-header">
            <div className="header-title">
              <Phone size={24} className="icon-emergency" />
              <h3>Emergency Contacts</h3>
            </div>
            <button onClick={() => setShowContactForm(!showContactForm)} className="btn-add">
              {showContactForm ? 'Cancel' : <><Plus size={16} /> Add</>}
            </button>
          </div>

          {showContactForm && (
            <form onSubmit={handleAddContact} className="contact-form">
              <input 
                type="text" placeholder="Full Name" required 
                value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})}
              />
              <input 
                type="text" placeholder="Relationship (e.g. Brother, Friend)" required 
                value={newContact.relationship} onChange={(e) => setNewContact({...newContact, relationship: e.target.value})}
              />
              <input 
                type="tel" placeholder="Phone Number" required 
                value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
              />
              <button type="submit" className="btn btn-secondary btn-full">Save Contact</button>
            </form>
          )}

          <div className="contacts-list">
            {contacts.length > 0 ? (
              contacts.map(contact => (
                <div key={contact.id} className="contact-item">
                  <div className="contact-info">
                    <strong>{contact.name}</strong>
                    <span>{contact.relationship} · {contact.phone_number}</span>
                  </div>
                  <button onClick={() => handleDeleteContact(contact.id)} className="btn-delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <p className="empty-contacts">No emergency contacts added yet.</p>
            )}
          </div>
        </section>

        {/* SOS Info Section */}
        <section className="safety-card info-card">
          <div className="header-title">
            <Info size={20} />
            <h3>How SOS Works</h3>
          </div>
          <p>Long-press the red SOS button on your screen for 1.5 seconds to alert your emergency contacts and our team with your live location.</p>
        </section>
      </div>
    </div>
  );
}

export default SafetyCenter;
