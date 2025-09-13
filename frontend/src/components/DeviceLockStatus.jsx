import React, { useState, useEffect } from 'react';
import { API } from '../api';

export default function DeviceLockStatus() {
  const [deviceStatus, setDeviceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDeviceStatus();
  }, []);

  const fetchDeviceStatus = async () => {
    try {
      const response = await fetch(`${API}/auth/device-status`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setDeviceStatus(data);
      } else {
        console.error('Failed to fetch device status');
      }
    } catch (error) {
      console.error('Error fetching device status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDeviceLock = async () => {
    if (!window.confirm('Are you sure you want to reset your device lock? This will allow you to login on other devices.')) {
      return;
    }

    setResetting(true);
    setMessage('');

    try {
      const response = await fetch(`${API}/auth/reset-device-lock`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Device lock reset successfully! You can now login on other devices.');
        await fetchDeviceStatus(); // Refresh status
      } else {
        setMessage(data.message || 'Failed to reset device lock');
      }
    } catch (error) {
      console.error('Error resetting device lock:', error);
      setMessage('Network error. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <div className="device-lock-status">Loading device status...</div>;
  }

  // Don't show for admin users
  if (deviceStatus?.isAdmin) {
    return null;
  }

  return (
    <div className="device-lock-status" style={{
      background: '#2e2e2e',
      border: '1px solid #444',
      borderRadius: '8px',
      padding: '16px',
      margin: '16px 0',
      color: '#fff'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, color: '#ff6b81', fontSize: '16px' }}>
          🔒 Device Security
        </h3>
        {deviceStatus?.isLocked && (
          <button
            onClick={handleResetDeviceLock}
            disabled={resetting}
            style={{
              background: '#ff6b81',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: resetting ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              opacity: resetting ? 0.6 : 1
            }}
          >
            {resetting ? 'Resetting...' : 'Reset Device Lock'}
          </button>
        )}
      </div>

      {deviceStatus?.isLocked ? (
        <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
          <div style={{ color: '#ff6b81', marginBottom: '8px' }}>
            ⚠️ You are currently locked to this device
          </div>
          <div style={{ color: '#aaa', fontSize: '12px' }}>
            • You can only login on this device<br/>
            • To login on other devices, click "Reset Device Lock" above<br/>
            • This ensures account security
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
          <div style={{ color: '#22c55e', marginBottom: '8px' }}>
            ✅ Device lock is not active
          </div>
          <div style={{ color: '#aaa', fontSize: '12px' }}>
            • You can login on any device<br/>
            • Device lock will activate after your next login
          </div>
        </div>
      )}

      {message && (
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          background: message.includes('successfully') ? '#22c55e20' : '#ff6b8120',
          color: message.includes('successfully') ? '#22c55e' : '#ff6b81',
          border: `1px solid ${message.includes('successfully') ? '#22c55e40' : '#ff6b8140'}`
        }}>
          {message}
        </div>
      )}
    </div>
  );
}
