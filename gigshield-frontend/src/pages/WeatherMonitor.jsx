import { useState, useEffect } from 'react';
import { eventApi } from '../api/api.js';
import { useLocation } from '../context/LocationContext.jsx';
import { TableSkeleton } from '../components/ui/SkeletonLoader.jsx';
import {
  CloudSun, CloudRain, Flame, Wind,
  AlertCircle, Droplets, Thermometer, Activity, MapPin,
  Search, AlertTriangle, TrendingUp
} from 'lucide-react';

// 7-day forecast mini chart
function ForecastChart({ city, coordinates }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchForecast = async () => {
      try {
        let latitude, longitude;
        
        if (coordinates && coordinates.lat && coordinates.lng) {
          latitude = coordinates.lat;
          longitude = coordinates.lng;
        } else {
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
          );
          const geoData = await geoRes.json();
          if (!geoData.results || geoData.results.length === 0) return;
          latitude = geoData.results[0].latitude;
          longitude = geoData.results[0].longitude;
        }
        
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto`
        );
          const data = await res.json();
          if (!cancelled && data.daily) {
            setForecast(data.daily);
          }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchForecast();
    return () => { cancelled = true; };
  }, [city, coordinates]);

  if (loading) return <div className="skeleton-pulse" style={{ height: 120, borderRadius: 'var(--radius-md)' }} />;
  if (!forecast) return null;

  const days = forecast.time?.slice(0, 7) || [];
  const maxTemps = forecast.temperature_2m_max?.slice(0, 7) || [];
  const minTemps = forecast.temperature_2m_min?.slice(0, 7) || [];
  const rain = forecast.precipitation_sum?.slice(0, 7) || [];
  const codes = forecast.weathercode?.slice(0, 7) || [];

  const getWeatherEmoji = (code) => {
    if (code <= 3) return '☀️';
    if (code <= 48) return '☁️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    return '⛈️';
  };

  const getDayLabel = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) return 'Tmrw';
    return d.toLocaleDateString('en-IN', { weekday: 'short' });
  };

  return (
    <div className="forecast-chart glass-card" style={{ overflow: 'hidden' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-md)', fontSize: '1rem' }}>
        <TrendingUp size={16} style={{ color: 'var(--accent-sky)' }} />
        7-Day Forecast — {city}
      </h3>
      <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
        {days.map((day, i) => {
          const isSevere = rain[i] > 30 || maxTemps[i] > 42;
          return (
            <div key={day} style={{
              flex: '1 0 auto', minWidth: 70, textAlign: 'center', padding: '8px 6px',
              borderRight: i < days.length - 1 ? '1px solid var(--border-color)' : 'none',
              background: isSevere ? 'rgba(245,158,11,0.05)' : 'transparent',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {getDayLabel(day)}
              </div>
              <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{getWeatherEmoji(codes[i])}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {Math.round(maxTemps[i])}°
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {Math.round(minTemps[i])}°
              </div>
              {rain[i] > 0 && (
                <div style={{ fontSize: '0.68rem', color: 'var(--accent-sky)', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <Droplets size={10} /> {rain[i].toFixed(1)}mm
                </div>
              )}
              {isSevere && (
                <div style={{ marginTop: 4 }}>
                  <AlertTriangle size={12} style={{ color: 'var(--accent-amber)' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeatherMonitor() {
  const { city, coordinates } = useLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [viewCity, setViewCity] = useState('');

  const fetchEvents = useCallback(async () => {
    try {
      const response = await eventApi.getRecent();
      const data = response?.data;
      setEvents(Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'HEAVY_RAIN': return <CloudRain size={22} />;
      case 'EXTREME_HEAT': return <Flame size={22} />;
      case 'HIGH_POLLUTION': return <Wind size={22} />;
      default: return <CloudSun size={22} />;
    }
  };

  const getEventClass = (type) => {
    switch (type) {
      case 'HEAVY_RAIN': return 'rain';
      case 'EXTREME_HEAT': return 'heat';
      case 'HIGH_POLLUTION': return 'pollution';
      default: return '';
    }
  };

  const formatTime = (dt) => {
    if (!dt) return '';
    try {
      const date = new Date(dt);
      const now = new Date();
      const diff = now - date;
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch { return dt; }
  };

  const safeEvents = Array.isArray(events) ? events : [];
  const displayCity = viewCity || city;

  // Sort events — selected city first, then others
  const sortedEvents = [...safeEvents].sort((a, b) => {
    const aMatch = a.city?.toLowerCase() === displayCity.toLowerCase() ? 0 : 1;
    const bMatch = b.city?.toLowerCase() === displayCity.toLowerCase() ? 0 : 1;
    return aMatch - bMatch;
  });

  // Check for severe weather alerts
  const severeAlerts = safeEvents.filter(e =>
    e.city?.toLowerCase() === city.toLowerCase() &&
    (e.severity === 'HIGH' || e.severity === 'EXTREME')
  );

  if (loading) return (
    <div>
      <div className="page-header">
        <h1>
          <div className="page-header-icon" style={{ background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)' }}>
            <CloudSun size={20} />
          </div>
          Weather Monitor
        </h1>
      </div>
      <TableSkeleton rows={4} cols={4} />
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1>
            <div className="page-header-icon" style={{ background: 'var(--accent-amber-glow)', color: 'var(--accent-amber)' }}>
              <CloudSun size={20} />
            </div>
            Weather Monitor
          </h1>
          <p>
            Real-time environmental events — showing <strong style={{ color: 'var(--accent-emerald)' }}>
              <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {displayCity}
            </strong> first
          </p>
        </div>
        {/* City Search (view only, not for insurance) */}
        <div style={{ position: 'relative' }}>
          <div className="form-input-wrapper" style={{ margin: 0 }}>
            <span className="form-input-icon"><Search size={14} /></span>
            <input
              className="form-input has-icon"
              type="text"
              placeholder="Search city to view..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchCity.trim()) {
                  setViewCity(searchCity.trim());
                }
              }}
              style={{ width: 200, fontSize: '0.85rem', padding: '6px 8px 6px 32px' }}
              aria-label="Search city for weather viewing"
            />
          </div>
          {viewCity && viewCity !== city && (
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', marginTop: 4, textAlign: 'right' }}>
              Viewing {viewCity} (insurance stays on {city})
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setViewCity(''); setSearchCity(''); }}
                style={{ padding: '1px 6px', fontSize: '0.7rem', marginLeft: 4 }}
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error"><AlertCircle size={16} /> {error}</div>}

      {/* Severe Weather Alert Banner */}
      {severeAlerts.length > 0 && (
        <div className="severe-weather-banner animate-fade-in-up" role="alert" style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          marginBottom: 'var(--space-lg)',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))',
          border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)',
        }}>
          <AlertTriangle size={22} style={{ color: '#ef4444', flexShrink: 0, animation: 'pulse 2s infinite' }} />
          <div>
            <div style={{ fontWeight: 700, color: '#ef4444', fontSize: '0.95rem', marginBottom: 2 }}>
              ⚠️ Severe Weather Alert — {city}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {severeAlerts.length} severe event{severeAlerts.length > 1 ? 's' : ''} detected:
              {' '}{severeAlerts.map(a => a.eventType?.replace('_', ' ')).join(', ')}.
              Auto-claims may be triggered for affected policies.
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Forecast */}
      <ForecastChart city={displayCity} coordinates={displayCity === city ? coordinates : null} />

      {sortedEvents.length > 0 ? (
        <div className="weather-grid stagger-children" style={{ marginTop: 'var(--space-lg)' }}>
          {sortedEvents.map((event, idx) => (
            <div key={event.id} className={`weather-card ${getEventClass(event.eventType)} ${event.city?.toLowerCase() === displayCity.toLowerCase() ? 'weather-card-highlighted' : ''}`}
              style={{ animationDelay: `${idx * 60}ms` }}>
              <div className="weather-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {getEventIcon(event.eventType)}
                  <div>
                    <div className="weather-city">{event.city}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {event.eventType?.replace('_', ' ')} • {formatTime(event.eventTimestamp)}
                    </div>
                  </div>
                </div>
                <span className={`weather-severity ${event.severity?.toLowerCase()}`}>
                  {event.severity}
                </span>
              </div>

              <div className="weather-details">
                <div className="weather-detail">
                  <Droplets size={14} style={{ color: 'var(--accent-sky)', margin: '0 auto 4px' }} />
                  <div className="weather-detail-value" style={{ color: 'var(--accent-sky)' }}>
                    {event.rainfallMm || 0}mm
                  </div>
                  <div className="weather-detail-label">Rainfall</div>
                </div>
                <div className="weather-detail">
                  <Thermometer size={14} style={{ color: 'var(--accent-amber)', margin: '0 auto 4px' }} />
                  <div className="weather-detail-value" style={{ color: 'var(--accent-amber)' }}>
                    {event.temperatureC || 0}°C
                  </div>
                  <div className="weather-detail-label">Temp</div>
                </div>
                <div className="weather-detail">
                  <Activity size={14} style={{ color: 'var(--accent-violet)', margin: '0 auto 4px' }} />
                  <div className="weather-detail-value" style={{ color: 'var(--accent-violet)' }}>
                    {event.aqi || 0}
                  </div>
                  <div className="weather-detail-label">AQI</div>
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Source: {event.sourceApi || 'System'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card empty-state" style={{ marginTop: 'var(--space-lg)' }}>
          <svg width="100" height="80" viewBox="0 0 100 80" fill="none" aria-hidden="true" style={{ marginBottom: 12 }}>
            <circle cx="50" cy="28" r="18" fill="rgba(245,158,11,0.08)" stroke="rgba(245,158,11,0.2)" strokeWidth="1.5" />
            <path d="M42 28Q46 20 50 28Q54 36 58 28" stroke="rgba(245,158,11,0.3)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <line x1="35" y1="55" x2="65" y2="55" stroke="rgba(245,158,11,0.15)" strokeWidth="1.5" />
            <line x1="40" y1="62" x2="60" y2="62" stroke="rgba(245,158,11,0.1)" strokeWidth="1.5" />
          </svg>
          <h3>No recent events</h3>
          <p>Environmental events will appear here when detected</p>
        </div>
      )}
    </div>
  );
}

export default WeatherMonitor;
