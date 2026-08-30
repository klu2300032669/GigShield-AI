import { useLocation } from '../context/LocationContext.jsx';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

function CitySelector() {
  const { city, isDetecting } = useLocation();

  return (
    <div className="city-selector" style={{ cursor: 'default' }}>
      <div
        className="city-selector-trigger"
        style={{ 
          pointerEvents: 'none', 
          background: 'var(--bg-secondary)', 
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px'
        }}
        aria-label={`Auto-detected city: ${city}`}
      >
        {isDetecting ? (
          <Loader2 size={14} className="spin-icon" style={{ color: 'var(--accent-emerald)' }} />
        ) : (
          <Navigation size={14} style={{ color: 'var(--accent-emerald)' }} />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            {isDetecting ? 'Locating...' : 'Auto-Detected'}
          </span>
          <span className="city-selector-label" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {city}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CitySelector;
