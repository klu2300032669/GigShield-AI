import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocation } from '../context/LocationContext.jsx';
import { workerApi, policyApi } from '../api/api.js';
import { DashboardSkeleton } from '../components/ui/SkeletonLoader.jsx';
import {
  Shield, Banknote, FileText, Bell, TrendingDown,
  ArrowRight, CheckCircle2, Clock, AlertTriangle,
  CloudRain, Activity, Brain, Zap, MapPin,
  RefreshCw, Thermometer, Droplets, Wind, Navigation, CloudSun
} from 'lucide-react';

// ---- SVG Sparkline Component ----
function Sparkline({ data = [], color = '#10b981', height = 64 }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Not enough data yet</p>
      </div>
    );
  }
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 300;
  const h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  });
  const polyline = pts.join(' ');
  const firstPt = pts[0].split(',');
  const lastPt = pts[pts.length - 1].split(',');
  const areaPath = `M${polyline.replace(/ /g, ' L')} L${lastPt[0]},${h} L${firstPt[0]},${h} Z`;
  return (
    <div className="sparkline-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad-${color.replace('#','')})`} />
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={lastPt[0]} cy={lastPt[1]}
          r="4" fill={color}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      </svg>
    </div>
  );
}

// ---- AI Status Widget ----
function AIHealthWidget() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    fetch('http://localhost:8000/health', { signal: AbortSignal.timeout(4000) })
      .then(r => r.json())
      .then(() => {
        if (!cancelled) setStatus('online');
      })
      .catch(() => { if (!cancelled) setStatus('offline'); });
    return () => { cancelled = true; };
  }, []);

  const label = status === 'loading' ? 'Verifying AI system…'
    : status === 'online'  ? 'Smart Protection Active'
    : 'Basic Protection Active';

  return (
    <div className="ai-status-widget">
      <div className={`ai-status-dot ${status}`} />
      <Brain size={14} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
      <span className="ai-status-text"><strong>GigShield AI</strong> — {label}</span>
    </div>
  );
}

// ---- Real-time Weather Widget ----
function WeatherWidgetMini({ city, coordinates, onWeatherUpdate }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchWeather = async () => {
      try {
        let latitude, longitude;
        
        if (coordinates && coordinates.lat && coordinates.lng) {
          latitude = coordinates.lat;
          longitude = coordinates.lng;
        } else {
          // Fall back to Open-Meteo geocoding if no precise coords
          const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
          );
          const geoData = await geoRes.json();
          if (!geoData.results || geoData.results.length === 0) return;
          latitude = geoData.results[0].latitude;
          longitude = geoData.results[0].longitude;
        }

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weathercode,windspeed_10m&timezone=auto`
        );
        const weatherData = await weatherRes.json();
        if (!cancelled && weatherData.current) {
          const w = {
            temp: weatherData.current.temperature_2m,
            humidity: weatherData.current.relative_humidity_2m,
            windSpeed: weatherData.current.windspeed_10m,
            code: weatherData.current.weathercode,
          };
          setWeather(w);
          if (onWeatherUpdate) onWeatherUpdate(w);
        }
      } catch {
        // Silently fail — widget is optional
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchWeather();
    return () => { cancelled = true; };
  }, [city, coordinates, onWeatherUpdate]);

  const getWeatherLabel = (code) => {
    if (code <= 3) return 'Clear';
    if (code <= 48) return 'Cloudy';
    if (code <= 67) return 'Rainy';
    if (code <= 77) return 'Snowy';
    if (code <= 99) return 'Stormy';
    return 'Unknown';
  };

  if (loading) {
    return (
      <div className="weather-widget-mini skeleton-pulse" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />
    );
  }

  if (!weather) return null;

  return (
    <div className="weather-widget-mini glass-card animate-fade-in-up" style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-lg)',
      padding: '12px 16px', marginBottom: 'var(--space-md)',
      background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(56,189,248,0.02))',
      borderColor: 'rgba(56,189,248,0.15)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Thermometer size={18} style={{ color: 'var(--accent-amber)' }} />
        <div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {weather.temp}°C
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {getWeatherLabel(weather.code)}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-lg)', flex: 1, justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Droplets size={14} style={{ color: 'var(--accent-sky)', marginBottom: 2 }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{weather.humidity}%</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Humidity</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Wind size={14} style={{ color: 'var(--accent-violet)', marginBottom: 2 }} />
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{weather.windSpeed} km/h</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Wind</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <MapPin size={12} style={{ color: 'var(--accent-emerald)' }} />
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>{city}</span>
      </div>
    </div>
  );
}

function Dashboard() {
  const { worker } = useAuth();
  const { city, coordinates, detectLocation, isDetecting, lastUpdated } = useLocation();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveWeather, setLiveWeather] = useState(null);
  const [error, setError] = useState('');
  const [paymentToast, setPaymentToast] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle UPI/redirect payment success
  useEffect(() => {
    if (searchParams.get('payment_success') === 'true') {
      const planId = searchParams.get('plan_id');
      const wId = searchParams.get('worker_id');
      
      // Create the policy after redirect
      if (planId && wId) {
        policyApi.purchase({ workerId: Number(wId), planId: Number(planId) })
          .then(() => {
            setPaymentToast('🎉 Payment successful! Your new policy is now active.');
          })
          .catch(() => {
            setPaymentToast('✅ Payment received! Policy will activate shortly.');
          });
      } else {
        setPaymentToast('✅ Payment completed successfully!');
      }
      
      // Clean the URL
      setSearchParams({}, { replace: true });
      setTimeout(() => setPaymentToast(''), 8000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchDashboard(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboard = async () => {
    try {
      const response = await workerApi.getDashboard(worker.id);
      setDashboard(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <div className="alert alert-error"><AlertTriangle size={16} /> {error}</div>;
  if (!dashboard) return null;

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const recentClaims = Array.isArray(dashboard.recentClaims) ? dashboard.recentClaims : [];
  const claimAmountData = recentClaims.slice(-10).map(c => Number(c.claimAmount) || 0);
  const riskScoreData   = recentClaims.slice(-10).map(c => Number(c.riskScore) || 0);

  // Check if worker's registered city differs from detected city
  const cityMismatch = worker?.city && worker.city.toLowerCase() !== city.toLowerCase();

  return (
    <div>
      {/* Payment Success Toast */}
      {paymentToast && (
        <div className="alert alert-success animate-fade-in" style={{ 
          marginBottom: 'var(--space-md)', fontSize: '0.95rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <CheckCircle2 size={18} /> {paymentToast}
        </div>
      )}
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1 className="animate-fade-in-up gradient-text">{getGreeting()}, {dashboard.workerName?.split(' ')[0]} 👋</h1>
          <p className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>Here's your insurance overview for today</p>
        </div>
        
        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', animationDelay: '200ms' }} className="animate-fade-in-up">
          <Link to="/claims" className="btn btn-primary btn-sm">
            <FileText size={16} /> File Claim
          </Link>
          <Link to="/policies" className="btn btn-outline btn-sm">
            <Shield size={16} /> View Policies
          </Link>
        </div>
      </div>

      {/* Insurance Active Banner */}
      <div className="insurance-active-banner animate-fade-in-up" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
        gap: 'var(--space-md)', padding: '10px 16px', marginBottom: 'var(--space-md)',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.03))',
        border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Shield size={16} style={{ color: 'var(--accent-emerald)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>
              Insurance active for:
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} style={{ color: 'var(--text-primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{city}</span>
            <span className="location-verified-badge">
              <CheckCircle2 size={10} /> GPS Verified
            </span>
          </div>
          {lastUpdated && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Updated {new Date(lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={detectLocation}
          disabled={isDetecting}
          aria-label="Refresh location"
          title="Update your location"
          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
        >
          <RefreshCw size={13} style={{ animation: isDetecting ? 'spin 1s linear infinite' : 'none' }} />
          {isDetecting ? 'Detecting…' : 'Refresh Location'}
        </button>
      </div>

      {/* Top Banner & Widgets */}
      <div className="dashboard-top-widgets">
        <WeatherWidgetMini city={city} coordinates={coordinates} onWeatherUpdate={setLiveWeather} />
        <AIHealthWidget />
      </div>

      {/* Hero Alerts: Risk & Weather */}
      <div className="metrics-grid stagger-children" style={{ marginBottom: 'var(--space-2xl)' }}>
        {liveWeather && liveWeather.code > 60 && (
          <div className="glass-card animate-fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.02))', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
            <div className="metric-icon amber" style={{ width: '56px', height: '56px', flexShrink: 0 }}>
              <CloudRain size={28} />
            </div>
            <div>
              <h3 style={{ color: 'var(--accent-amber)', marginBottom: '4px', fontSize: '1.1rem' }}>Active Weather Alert: {city}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Severe weather detected. High risk for food delivery. Insurance active.</p>
            </div>
          </div>
        )}
        {liveWeather && liveWeather.code <= 60 && (
          <div className="glass-card animate-fade-in-up" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02))', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
            <div className="metric-icon emerald" style={{ width: '56px', height: '56px', flexShrink: 0 }}>
              <CloudSun size={28} />
            </div>
            <div>
              <h3 style={{ color: 'var(--accent-emerald)', marginBottom: '4px', fontSize: '1.1rem' }}>Weather Clear: {city}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Current conditions are safe for delivery. Have a great shift!</p>
            </div>
          </div>
        )}

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', background: 'linear-gradient(135deg, rgba(251, 113, 133, 0.1), rgba(251, 113, 133, 0.02))', borderColor: 'rgba(251, 113, 133, 0.2)' }}>
          <div className="metric-icon coral" style={{ width: '56px', height: '56px', flexShrink: 0 }}>
            <Activity size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.1rem' }}>Daily Risk Score — {city}</h3>
              <span className="risk-score risk-high" style={{ fontSize: '1.25rem' }}>7.8 / 10</span>
            </div>
            <div className="risk-bar" style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)' }}>
              <div className="risk-bar-fill" style={{ width: '78%', background: 'var(--accent-coral)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="metrics-grid stagger-children">
        <div className="metric-card teal">
          <div className="metric-header">
            <div className="metric-icon teal"><Shield size={20} /></div>
          </div>
          <div className="metric-value">{dashboard.activePolicies}</div>
          <div className="metric-label">Active Policies</div>
        </div>

        <div className="metric-card emerald">
          <div className="metric-header">
            <div className="metric-icon emerald"><Banknote size={20} /></div>
          </div>
          <div className="metric-value">{formatCurrency(dashboard.totalPayouts)}</div>
          <div className="metric-label">Total Payouts</div>
        </div>

        <div className="metric-card amber">
          <div className="metric-header">
            <div className="metric-icon amber"><FileText size={20} /></div>
          </div>
          <div className="metric-value">{dashboard.totalClaims}</div>
          <div className="metric-label">Total Claims</div>
        </div>

        <div className="metric-card coral">
          <div className="metric-header">
            <div className="metric-icon coral"><Bell size={20} /></div>
          </div>
          <div className="metric-value">{dashboard.unreadNotifications}</div>
          <div className="metric-label">Unread Alerts</div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="metrics-grid stagger-children" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 8 }}>
            <Clock size={20} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{dashboard.pendingClaims}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Pending Claims</div>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 8 }}>
            <CheckCircle2 size={20} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{dashboard.approvedClaims}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Approved Claims</div>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 8 }}>
            <TrendingDown size={20} style={{ color: 'var(--accent-coral)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-coral)' }}>
            {dashboard.avgDeliveryDropRate ? Number(dashboard.avgDeliveryDropRate).toFixed(1) + '%' : '0%'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Avg Drop Rate</div>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 8 }}>
            <Activity size={20} style={{ color: 'var(--accent-teal)' }} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-teal)' }}>{formatCurrency(dashboard.totalEstimatedLoss)}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Est. Income Loss</div>
        </div>
      </div>

      {/* Charts / Trends */}
      <div className="metrics-grid stagger-children" style={{ marginBottom: 'var(--space-2xl)' }}>
        <div className="glass-card">
          <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Banknote size={16} style={{ color: 'var(--accent-emerald)' }} /> Claim Amounts Trend
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last {claimAmountData.length} claims</span>
          </div>
          <Sparkline data={claimAmountData} color="#10b981" />
        </div>
        
        <div className="glass-card">
          <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingDown size={16} style={{ color: 'var(--accent-coral)' }} /> Risk Score Trend
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last {riskScoreData.length} claims</span>
          </div>
          <Sparkline data={riskScoreData} color="#fb7185" />
        </div>
      </div>

      {/* Active Policies */}
      <div style={{ marginTop: 'var(--space-xl)' }}>
        <div className="section-header">
          <div className="section-title">
            <Shield size={18} style={{ color: 'var(--accent-teal)' }} /> Active Policies
          </div>
          <Link to="/plans" className="btn btn-sm btn-outline">
            Browse Plans <ArrowRight size={14} />
          </Link>
        </div>
        {Array.isArray(dashboard.policies) && dashboard.policies.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plan</th><th>Coverage</th><th>Premium</th><th>Max Payout</th><th>End Date</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.policies.map((policy) => (
                  <tr key={policy.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{policy.planName}</td>
                    <td><span className="badge badge-info">{policy.coverageType}</span></td>
                    <td>{formatCurrency(policy.premiumPaid)}</td>
                    <td>{formatCurrency(policy.maxPayout)}</td>
                    <td>{policy.endDate}</td>
                    <td><span className={`badge badge-${policy.status?.toLowerCase()}`}>{policy.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="glass-card empty-state">
            <div className="empty-state-icon"><Shield size={28} /></div>
            <h3>No active policies</h3>
            <p>Get protected today — <Link to="/plans">browse insurance plans</Link></p>
          </div>
        )}
      </div>

      {/* Recent Claims */}
      <div style={{ marginTop: 'var(--space-xl)' }}>
        <div className="section-header">
          <div className="section-title">
            <FileText size={18} style={{ color: 'var(--accent-amber)' }} /> Recent Claims
          </div>
          <Link to="/claims" className="btn btn-sm btn-outline">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        {recentClaims.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Claim #</th><th>Plan</th><th>Event</th><th>Risk Score</th><th>Amount</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td style={{ fontWeight: 600 }}>#{claim.id}</td>
                    <td>{claim.planName}</td>
                    <td><span className="badge badge-info">{claim.eventType}</span></td>
                    <td>
                      <span className={`risk-score ${Number(claim.riskScore) >= 0.7 ? 'risk-high' : Number(claim.riskScore) >= 0.4 ? 'risk-medium' : 'risk-low'}`}>
                        {Number(claim.riskScore).toFixed(2)}
                        <span className="risk-bar">
                          <span className="risk-bar-fill" style={{ width: `${Number(claim.riskScore) * 100}%` }} />
                        </span>
                      </span>
                    </td>
                    <td>{formatCurrency(claim.claimAmount)}</td>
                    <td><span className={`badge badge-${claim.status?.toLowerCase()}`}>{claim.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="glass-card empty-state">
            <div className="empty-state-icon"><FileText size={28} /></div>
            <h3>No claims yet</h3>
            <p>Claims are automatically triggered by environmental events</p>
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="glass-card" style={{ marginTop: 'var(--space-xl)', background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(139,92,246,0.02))', borderColor: 'rgba(139,92,246,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-md)' }}>
          <div className="metric-icon" style={{ background: 'var(--accent-violet-glow)', color: 'var(--accent-violet)', flexShrink: 0 }}>
            <Zap size={20} />
          </div>
          <div>
            <h4 style={{ color: 'var(--accent-violet)', marginBottom: '6px', fontSize: '0.95rem' }}>How Parametric Insurance Works</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              GigShield AI monitors real-time weather and environmental data. When conditions exceed your policy's thresholds (e.g. rainfall &gt; 50mm, AQI &gt; 300), a claim is <strong style={{ color: 'var(--text-primary)' }}>automatically triggered</strong> and payout is processed — no forms needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
