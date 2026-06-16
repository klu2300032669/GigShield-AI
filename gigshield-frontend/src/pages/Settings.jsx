import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import {
  Settings as SettingsIcon, User, Mail, Phone, MapPin,
  Briefcase, Calendar, Shield, Activity, Bell, BellOff,
  RefreshCw, Navigation, Signal, Clock, History,
  CheckCircle2, AlertCircle, Volume2, VolumeX
} from 'lucide-react';

function Settings() {
  const { worker } = useAuth();
  const {
    city, detectLocation, isDetecting, lastUpdated,
    accuracy, accuracyLevel, permissionState, locationHistory, locationError
  } = useLocation();

  const [notifPrefs, setNotifPrefs] = useState({
    emailAlerts: true,
    pushNotifications: true,
    smsAlerts: false,
    weeklyDigest: true,
    claimUpdates: true,
    weatherAlerts: true,
    notificationSound: true,
  });

  const [requestingPush, setRequestingPush] = useState(false);

  const togglePref = (key) => {
    setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) return;
    setRequestingPush(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotifPrefs(prev => ({ ...prev, pushNotifications: true }));
        new Notification('GigShield AI', {
          body: 'Push notifications enabled! You will receive real-time alerts.',
          icon: '/vite.svg',
        });
      }
    } catch (err) {
      console.error('Push permission error:', err);
    } finally {
      setRequestingPush(false);
    }
  };

  const formatDate = (dt) => {
    if (!dt) return '—';
    try {
      return new Date(dt).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    } catch { return dt; }
  };

  const formatDateTime = (dt) => {
    if (!dt) return '—';
    try {
      return new Date(dt).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dt; }
  };

  const getAccuracyColor = () => {
    if (accuracyLevel === 'High') return 'var(--accent-emerald)';
    if (accuracyLevel === 'Medium') return 'var(--accent-amber)';
    return 'var(--accent-coral)';
  };

  const ToggleSwitch = ({ active, onClick, label }) => (
    <button
      onClick={onClick}
      className={`toggle-switch ${active ? 'active' : ''}`}
      role="switch"
      aria-checked={active}
      aria-label={label}
      style={{
        width: 48, height: 26, borderRadius: 13,
        border: 'none', cursor: 'pointer', position: 'relative',
        background: active ? 'var(--accent-emerald)' : 'var(--border-color)',
        transition: 'background 0.2s ease'
      }}
    >
      <span style={{
        display: 'block', width: 20, height: 20,
        borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3,
        left: active ? 25 : 3,
        transition: 'left 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
      }} />
    </button>
  );

  return (
    <div>
      <div className="page-header">
        <h1>
          <div className="page-header-icon" style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)' }}>
            <SettingsIcon size={20} />
          </div>
          Settings
        </h1>
        <p>Manage your account, location, and preferences</p>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)' }}>
              <User size={18} />
            </div>
            <h3>Personal Information</h3>
          </div>
          <div className="settings-field">
            <div className="settings-field-label">Full Name</div>
            <div className="settings-field-value">{worker?.fullName || '—'}</div>
          </div>
          <div className="settings-field">
            <div className="settings-field-label">Email Address</div>
            <div className="settings-field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={14} style={{ color: 'var(--text-muted)' }} />
              {worker?.email || '—'}
            </div>
          </div>
          <div className="settings-field">
            <div className="settings-field-label">Phone Number</div>
            <div className="settings-field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={14} style={{ color: 'var(--text-muted)' }} />
              {worker?.phone || '—'}
            </div>
          </div>
        </div>

        {/* Location Management Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
              <MapPin size={18} />
            </div>
            <h3>Location Management</h3>
          </div>

          <div className="settings-field">
            <div className="settings-field-label">Current Detected City</div>
            <div className="settings-field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={14} style={{ color: 'var(--accent-emerald)' }} />
              <span style={{ fontWeight: 700 }}>{city}</span>
              <span className="location-verified-badge">
                <CheckCircle2 size={10} /> Verified
              </span>
            </div>
          </div>

          <div className="settings-field">
            <div className="settings-field-label">GPS Accuracy</div>
            <div className="settings-field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Signal size={14} style={{ color: getAccuracyColor() }} />
              <span style={{ color: getAccuracyColor(), fontWeight: 600 }}>{accuracyLevel}</span>
              {accuracy && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  (±{Math.round(accuracy)}m)
                </span>
              )}
            </div>
          </div>

          <div className="settings-field">
            <div className="settings-field-label">Last Location Update</div>
            <div className="settings-field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={14} style={{ color: 'var(--text-muted)' }} />
              {lastUpdated ? formatDateTime(lastUpdated) : 'Never'}
            </div>
          </div>

          <div className="settings-field">
            <div className="settings-field-label">Permission Status</div>
            <div className="settings-field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {permissionState === 'granted' ? (
                <><CheckCircle2 size={14} style={{ color: 'var(--accent-emerald)' }} /> <span style={{ color: 'var(--accent-emerald)' }}>Granted</span></>
              ) : permissionState === 'denied' ? (
                <><AlertCircle size={14} style={{ color: 'var(--accent-coral)' }} /> <span style={{ color: 'var(--accent-coral)' }}>Denied</span></>
              ) : (
                <><AlertCircle size={14} style={{ color: 'var(--accent-amber)' }} /> <span style={{ color: 'var(--accent-amber)' }}>Prompt</span></>
              )}
            </div>
          </div>

          {locationError && (
            <div style={{
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              fontSize: '0.78rem', color: 'var(--accent-amber)', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <AlertCircle size={13} /> {locationError}
            </div>
          )}

          <button
            className="btn btn-primary btn-sm"
            onClick={detectLocation}
            disabled={isDetecting}
            style={{ marginTop: 8, width: '100%' }}
            aria-label="Update my location"
          >
            {isDetecting ? (
              <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Detecting...</>
            ) : (
              <><Navigation size={14} /> Update My Location</>
            )}
          </button>

          {/* Location History */}
          {Array.isArray(locationHistory) && locationHistory.length > 0 && (
            <div style={{ marginTop: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <History size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Location History</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {locationHistory.slice(0, 5).map((entry, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.02)', fontSize: '0.78rem',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                      <MapPin size={12} /> {entry.city}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      {formatDateTime(entry.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'var(--accent-emerald-glow)', color: 'var(--accent-emerald)' }}>
              <Briefcase size={18} />
            </div>
            <h3>Work Details</h3>
          </div>
          <div className="settings-field">
            <div className="settings-field-label">City</div>
            <div className="settings-field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
              {worker?.city || city || '—'}
            </div>
          </div>
          <div className="settings-field">
            <div className="settings-field-label">Platform</div>
            <div className="settings-field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={14} style={{ color: 'var(--text-muted)' }} />
              {worker?.platformName || 'Not specified'}
            </div>
          </div>
          <div className="settings-field">
            <div className="settings-field-label">Member Since</div>
            <div className="settings-field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
              {formatDate(worker?.registrationDate)}
            </div>
          </div>
          <div className="settings-field">
            <div className="settings-field-label">Account Status</div>
            <div className="settings-field-value">
              <span className={`badge ${worker?.isActive ? 'badge-active' : 'badge-expired'}`}>
                {worker?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="settings-card" style={{ gridColumn: '1 / -1' }}>
          <div className="settings-card-header">
            <div className="settings-card-icon" style={{ background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)' }}>
              <Bell size={18} />
            </div>
            <h3>Notification Preferences</h3>
          </div>

          {/* Push Notification Permission */}
          {'Notification' in window && Notification.permission !== 'granted' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
              padding: '10px 14px', marginBottom: 'var(--space-md)',
              background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: 'var(--radius-md)', gap: 8,
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-sky)', marginBottom: 2 }}>Enable Push Notifications</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Get real-time browser alerts for claims and weather events</div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleRequestPushPermission}
                disabled={requestingPush}
                style={{ flexShrink: 0 }}
              >
                <Bell size={14} /> Allow Notifications
              </button>
            </div>
          )}

          {[
            { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive email notifications for important updates' },
            { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications for real-time alerts' },
            { key: 'smsAlerts', label: 'SMS Alerts', desc: 'Get text messages for critical events' },
            { key: 'claimUpdates', label: 'Claim Updates', desc: 'Notifications when claim status changes' },
            { key: 'weatherAlerts', label: 'Weather Alerts', desc: 'Alerts for severe weather in your area' },
            { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly summary of your activity and payouts' },
            { key: 'notificationSound', label: 'Notification Sound', desc: 'Play sound when notifications arrive', icon: notifPrefs.notificationSound ? <Volume2 size={14} /> : <VolumeX size={14} /> },
          ].map(item => (
            <div key={item.key} className="settings-field" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="settings-field-label" style={{ marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
              <ToggleSwitch
                active={notifPrefs[item.key]}
                onClick={() => togglePref(item.key)}
                label={`Toggle ${item.label}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Settings;
