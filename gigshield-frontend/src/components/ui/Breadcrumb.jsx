import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  plans: 'Plans',
  policies: 'My Policies',
  claims: 'Claims',
  notifications: 'Notifications',
  settings: 'Settings',
  weather: 'Weather',
  analytics: 'Analytics',
  admin: 'Admin Panel',
  login: 'Login',
  register: 'Register',
};

export function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
    return null; // No breadcrumb on dashboard home
  }

  return (
    <nav aria-label="Breadcrumb" className="breadcrumb">
      <ol className="breadcrumb-list">
        <li className="breadcrumb-item">
          <Link to="/dashboard" className="breadcrumb-link" aria-label="Go to Dashboard">
            <Home size={12} />
          </Link>
        </li>
        {segments.map((seg, idx) => {
          const path = '/' + segments.slice(0, idx + 1).join('/');
          const label = ROUTE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
          const isLast = idx === segments.length - 1;

          return (
            <li key={path} className="breadcrumb-item">
              <ChevronRight size={12} className="breadcrumb-sep" aria-hidden="true" />
              {isLast ? (
                <span className="breadcrumb-current" aria-current="page">{label}</span>
              ) : (
                <Link to={path} className="breadcrumb-link">{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
