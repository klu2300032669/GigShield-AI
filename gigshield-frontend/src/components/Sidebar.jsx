import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { notificationApi } from '../api/api.js';
import CitySelector from './CitySelector.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { useTranslation } from 'react-i18next';
import {
  Zap, LayoutDashboard, Shield, ClipboardList, FileText,
  Bell, Settings, LogOut, MapPin, Menu, X,
  CloudSun, BarChart3, ShieldCheck
} from 'lucide-react';

function Sidebar() {
  const { worker, logout, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    if (!worker?.id) return;
    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const res = await notificationApi.getWorkerNotifications(worker.id);
        if (!cancelled) {
          const notifications = res.data || [];
          const unread = notifications.filter(n => !n.isRead && !n.read).length;
          setUnreadCount(unread);
        }
      } catch {
        // silently fail — badge just shows 0
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [worker?.id]);

  const mainNavItems = [
    { path: '/dashboard',     icon: LayoutDashboard, label: t('sidebar.dashboard') },
    { path: '/plans',         icon: Shield,          label: t('sidebar.plans') },
    { path: '/policies',      icon: ClipboardList,   label: t('sidebar.policies') },
    { path: '/claims',        icon: FileText,        label: t('sidebar.claims') },
    { path: '/weather',       icon: CloudSun,        label: t('sidebar.weather') },
    { path: '/analytics',     icon: BarChart3,       label: t('sidebar.analytics') },
    { path: '/notifications', icon: Bell,            label: t('sidebar.notifications'), badge: unreadCount },
    { path: '/settings',      icon: Settings,        label: t('sidebar.settings') },
  ];

  const adminNavItems = [
    { path: '/admin', icon: ShieldCheck, label: 'Admin Panel' },
  ];

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileOpen}
        aria-controls="sidebar-nav"
      >
        {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>
      <div
        className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Zap size={20} />
          </div>
          <div className="sidebar-logo-text">
            <h2>GigShield AI</h2>
            <span>Smart Insurance</span>
          </div>
        </div>

        {/* City Selector */}
        <CitySelector />

        <nav className="sidebar-nav" id="sidebar-nav" aria-label="Main navigation">
          <div className="sidebar-section-label" aria-hidden="true">Navigation</div>
          {mainNavItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-icon"><item.icon size={18} /></span>
              {item.label}
              {item.badge > 0 && (
                <span className="nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: '8px' }}>Administration</div>
              {adminNavItems.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="nav-icon"><item.icon size={18} /></span>
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{getInitials(worker?.fullName)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{worker?.fullName}</div>
              <span className={`sidebar-user-role ${isAdmin ? 'admin' : 'worker'}`}>
                {isAdmin ? '★ Admin' : 'Worker'}
              </span>
              <div className="sidebar-user-city">
                <MapPin size={10} />{worker?.city}
              </div>
            </div>
          </div>
          <div className="sidebar-footer-actions">
            <ThemeToggle />
            <LanguageSwitcher />
            <button
              className="sidebar-logout-btn"
              onClick={logout}
              aria-label="Sign out of GigShield"
              title="Sign out"
            >
              <LogOut size={14} aria-hidden="true" /> Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
