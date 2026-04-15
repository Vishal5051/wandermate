import React, { useState, useRef, useEffect } from 'react';
import { safetyAPI } from '../../utils/api';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import './Safety.css';

function SOSButton({ user }) {
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const timerRef = useRef(null);
  const progressRef = useRef(null);

  const startPress = () => {
    if (triggered) return;
    setIsPressing(true);
    setProgress(0);
    
    const startTime = Date.now();
    const duration = 1500; // 1.5 seconds

    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        handleTrigger();
        clearInterval(progressRef.current);
      }
    }, 50);
  };

  const endPress = () => {
    setIsPressing(false);
    setProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);
  };

  const handleTrigger = async () => {
    setTriggered(true);
    try {
      // Get current location
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        await safetyAPI.triggerSOS({ latitude, longitude });
        alert('🚨 SOS ALERT SENT! Emergency contacts have been notified with your location.');
      }, (err) => {
        // Fallback if location fails
        safetyAPI.triggerSOS({ latitude: 0, longitude: 0 });
        alert('🚨 SOS ALERT SENT! (Location unavailable)');
      });
    } catch (err) {
      console.error('SOS Trigger Error:', err);
    } finally {
      setTimeout(() => setTriggered(false), 5000);
    }
  };

  // Global mouseup/touchend to ensure it stops if user drags away
  useEffect(() => {
    window.addEventListener('mouseup', endPress);
    window.addEventListener('touchend', endPress);
    return () => {
      window.removeEventListener('mouseup', endPress);
      window.removeEventListener('touchend', endPress);
    };
  }, []);

  return (
    <div className={`sos-container ${isPressing ? 'active' : ''} ${triggered ? 'triggered' : ''}`}>
      <div className="sos-ring" style={{ height: `${progress}%` }}></div>
      <button 
        className="sos-button"
        onMouseDown={startPress}
        onTouchStart={startPress}
      >
        <ShieldAlert size={32} color="white" />
        <span className="sos-label">SOS</span>
      </button>
      
      {isPressing && (
        <div className="sos-overlay-text">
          HOLD TO TRIGGER
        </div>
      )}
    </div>
  );
}

export default SOSButton;
