import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FileText, CloudSun, Bell, Settings
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { path: '/claims', icon: FileText, label: 'Claims' },
  { path: '/weather', icon: CloudSun, label: 'Weather' },
  { path: '/notifications', icon: Bell, label: 'Alerts' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

function MobileNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {navItems.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <item.icon size={20} aria-hidden="true" />
          <span className="mobile-nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default MobileNav;
