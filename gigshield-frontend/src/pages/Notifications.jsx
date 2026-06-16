import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { notificationApi } from '../api/api.js';
import { TableSkeleton } from '../components/ui/SkeletonLoader.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  Bell, FileText, CloudSun, Shield, Banknote,
  CheckCheck, AlertCircle, CheckCircle2, Volume2,
  VolumeX, BellRing
} from 'lucide-react';

function Notifications() {
  const { worker } = useAuth();
  const { showSuccess, showError } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [markingAll, setMarkingAll] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pushPermission, setPushPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => { fetchNotifications(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNotifications = async () => {
    try {
      const response = await notificationApi.getWorkerNotifications(worker.id);
      const data = response?.data;
      setNotifications(Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => {
        const arr = Array.isArray(prev) ? prev : [];
        return arr.map(n => n.id === id ? { ...n, isRead: true } : n);
      });
    } catch (err) { console.error('Failed to mark notification as read:', err); }
  };

  const handleMarkAllRead = useCallback(async () => {
    const safeNotifs = Array.isArray(notifications) ? notifications : [];
    const unread = safeNotifs.filter(n => !n.isRead);
    if (!unread.length) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map(n => notificationApi.markAsRead(n.id)));
      setNotifications(prev => {
        const arr = Array.isArray(prev) ? prev : [];
        return arr.map(n => ({ ...n, isRead: true }));
      });
      showSuccess('All caught up!', `${unread.length} notifications marked as read.`);
    } catch {
      showError('Failed', 'Could not mark all as read.');
    } finally {
      setMarkingAll(false);
    }
  }, [notifications, showSuccess, showError]);

  const handleRequestPush = async () => {
    if (!('Notification' in window)) return;
    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        showSuccess('Notifications Enabled', 'You will now receive push notifications.');
        new Notification('GigShield AI', {
          body: 'Push notifications are now active!',
          icon: '/vite.svg',
        });
      }
    } catch {
      showError('Permission Error', 'Could not enable push notifications.');
    }
  };

  const formatTime = (dt) => {
    if (!dt) return '';
    try {
      const date = new Date(dt);
      const now = new Date();
      const diff = now - date;
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch { return dt; }
  };

  const getTypeInfo = (type) => {
    switch (type) {
      case 'CLAIM_UPDATE': return { icon: <FileText size={18} aria-hidden="true" />, cls: 'claim' };
      case 'WEATHER_ALERT': return { icon: <CloudSun size={18} aria-hidden="true" />, cls: 'weather' };
      case 'POLICY_REMINDER': return { icon: <Shield size={18} aria-hidden="true" />, cls: 'policy' };
      case 'PAYOUT_UPDATE': return { icon: <Banknote size={18} aria-hidden="true" />, cls: 'payout' };
      default: return { icon: <Bell size={18} aria-hidden="true" />, cls: 'default' };
    }
  };

  if (loading) return (
    <div>
      <div className="page-header">
        <h1>
          <div className="page-header-icon" style={{ background: 'var(--accent-rose-glow)', color: 'var(--accent-rose)' }}>
            <Bell size={20} />
          </div>
          Notifications
        </h1>
      </div>
      <TableSkeleton rows={5} cols={3} />
    </div>
  );

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => !n.isRead).length;

  const filtered = filter === 'all' ? safeNotifications
    : filter === 'unread' ? safeNotifications.filter(n => !n.isRead)
    : safeNotifications.filter(n => n.type === filter);

  return (
    <div>
      {/* aria-live region for dynamic announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="notification-status">
        {markingAll ? 'Marking all notifications as read…' : ''}
      </div>

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1>
            <div className="page-header-icon" style={{ background: 'var(--accent-rose-glow)', color: 'var(--accent-rose)' }}>
              <Bell size={20} aria-hidden="true" />
            </div>
            Notifications
            {unreadCount > 0 && (
              <span
                className="badge badge-info"
                style={{ fontSize: '0.75rem', marginLeft: 8 }}
                aria-label={`${unreadCount} unread notifications`}
              >
                {unreadCount} new
              </span>
            )}
          </h1>
          <p>Stay updated on claims, payouts, and weather alerts</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Sound toggle */}
          <button
            className={`btn btn-outline btn-sm ${soundEnabled ? '' : 'btn-muted'}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-label={soundEnabled ? 'Mute notification sounds' : 'Enable notification sounds'}
            title={soundEnabled ? 'Sound on' : 'Sound off'}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          {/* Push permission */}
          {pushPermission !== 'granted' && 'Notification' in window && (
            <button
              className="btn btn-outline btn-sm"
              onClick={handleRequestPush}
              aria-label="Enable push notifications"
              title="Enable browser push notifications"
            >
              <BellRing size={14} /> Enable Push
            </button>
          )}

          {unreadCount > 0 && (
            <button
              className="btn btn-outline btn-sm"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              aria-label="Mark all notifications as read"
              title="Mark all as read"
            >
              {markingAll
                ? <><span className="btn-spinner" aria-hidden="true" /> Marking…</>
                : <><CheckCircle2 size={14} aria-hidden="true" /> Mark All Read</>
              }
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error" role="alert"><AlertCircle size={16} aria-hidden="true" /> {error}</div>}

      {/* Push notification banner */}
      {pushPermission === 'granted' && (
        <div className="animate-fade-in-up" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', marginBottom: 'var(--space-md)',
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--accent-emerald)',
        }}>
          <CheckCircle2 size={14} /> Push notifications are enabled. You'll receive real-time alerts.
        </div>
      )}

      <div className="filter-tabs" role="tablist" aria-label="Filter notifications">
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` },
          { key: 'CLAIM_UPDATE', label: 'Claims' },
          { key: 'WEATHER_ALERT', label: 'Weather' },
          { key: 'PAYOUT_UPDATE', label: 'Payouts' },
        ].map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={filter === tab.key}
            className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div
          className="glass-card"
          style={{ padding: 0, overflow: 'hidden' }}
          role="list"
          aria-label="Notifications list"
          aria-live="polite"
        >
          {filtered.map((notification, idx) => {
            const typeInfo = getTypeInfo(notification.type);
            return (
              <div
                key={notification.id}
                role="listitem"
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => !notification.isRead && handleMarkRead(notification.id)}
                style={{ animationDelay: `${idx * 40}ms`, cursor: !notification.isRead ? 'pointer' : 'default' }}
                aria-label={`${notification.isRead ? '' : 'Unread: '}${notification.title}`}
              >
                <div className={`notification-icon-wrapper ${typeInfo.cls}`} aria-hidden="true">
                  {typeInfo.icon}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">
                    <time dateTime={notification.createdAt}>{formatTime(notification.createdAt)}</time>
                  </div>
                </div>
                {!notification.isRead && (
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={(e) => { e.stopPropagation(); handleMarkRead(notification.id); }}
                    style={{ flexShrink: 0, alignSelf: 'center' }}
                    aria-label={`Mark "${notification.title}" as read`}
                    title="Mark as read"
                  >
                    <CheckCheck size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card empty-state" role="status">
          <svg width="100" height="80" viewBox="0 0 100 80" fill="none" aria-hidden="true" style={{ marginBottom: 12 }}>
            <circle cx="50" cy="30" r="20" fill="rgba(251,113,133,0.08)" stroke="rgba(251,113,133,0.2)" strokeWidth="1.5" />
            <path d="M42 30L50 22L58 30" stroke="rgba(251,113,133,0.3)" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="47" y="30" width="6" height="18" rx="3" fill="rgba(251,113,133,0.15)" />
            <circle cx="50" cy="55" r="3" fill="rgba(251,113,133,0.2)" />
          </svg>
          <h3>{filter !== 'all' ? 'No matching notifications' : 'No notifications'}</h3>
          <p>{filter !== 'all' ? 'Try a different filter' : "You're all caught up! Notifications will appear here when there are updates."}</p>
        </div>
      )}
    </div>
  );
}

export default Notifications;
