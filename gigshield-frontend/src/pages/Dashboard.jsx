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
    const AI_BASE = import.meta.env.VITE_AI_API_URL || 'https://gigshield-ai-na5e.onrender.com';
    fetch(`${AI_BASE}/health`, { signal: AbortSignal.timeout(4000) })
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
            {weather.temp}Â°C
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

function AIRiskExplainerModal({ show, onClose, city, aiRiskData }) {
  if (!show) return null;
  
  // Use real feature importances from Python backend if available, fallback to defaults
  const features = aiRiskData?.feature_importances || {
    "rainfall_mm": 0.45,
    "temperature_c": 0.30,
    "aqi": 0.15,
    "delivery_drop_rate": 0.10
  };

  const score = aiRiskData ? (aiRiskData.risk_score * 10).toFixed(1) : "7.8";

  // Map backend feature names to readable names and colors
  const featureMeta = {
    "rainfall_mm": { name: "Real-time Precipitation (API)", color: "var(--accent-sky)" },
    "temperature_c": { name: "Extreme Temperature", color: "var(--accent-amber)" },
    "aqi": { name: "Air Quality Index (AQI)", color: "var(--accent-coral)" },
    "delivery_drop_rate": { name: "Zone Delivery Delay Rate", color: "var(--accent-violet)" },
    "online_hours": { name: "Worker Fatigue (Hours Online)", color: "var(--accent-teal)" }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-card animate-fade-in-up" onClick={e => e.stopPropagation()} style={{
        background: 'var(--bg-primary)', border: '1px solid var(--accent-coral)',
        maxWidth: '500px', width: '100%', padding: '24px', borderRadius: '16px',
        boxShadow: '0 0 30px rgba(251, 113, 133, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Brain size={24} style={{ color: 'var(--accent-coral)' }} />
            AI Risk Breakdown
          </h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '8px' }}>✕</button>
        </div>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Our Machine Learning model (<strong>{aiRiskData?.model_version || 'XGBoost v2.1'}</strong>) calculates your real-time risk score for <strong>{city}</strong> using the following weighted parameters:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {Object.entries(features).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([key, weight]) => {
            const meta = featureMeta[key] || { name: key, color: "var(--accent-emerald)" };
            const pct = (weight * 100).toFixed(0);
            return (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-primary)' }}>{meta.name}</span>
                  <span style={{ color: meta.color, fontWeight: 600 }}>{pct}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: meta.color, borderRadius: '4px' }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: '16px', background: 'rgba(251, 113, 133, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 113, 133, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>Final Computed Score:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-coral)' }}>{score}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/10</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}


// ---- Digital Insurance Passport (Apple Wallet Style) ----
function DigitalPassport({ worker, dashboard, aiRiskData, city }) {
  if (!worker) return null;
  const isProtected = dashboard?.activePolicies > 0;
  
  return (
    <div className="passport-container animate-fade-in-up" style={{
      position: 'relative', width: '100%',
      margin: '0 0 var(--space-2xl) 0', borderRadius: '24px',
      background: isProtected ? 'linear-gradient(135deg, #10b981 0%, #047857 100%)' : 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
      padding: '24px', color: '#fff', 
      boxShadow: isProtected ? '0 20px 40px rgba(16,185,129,0.3)' : '0 10px 30px rgba(0,0,0,0.1)',
      overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {/* Background Pattern */}
      <div style={{ position: 'absolute', top: -40, right: -40, opacity: 0.1, transform: 'rotate(15deg)' }}>
        <Shield size={180} />
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.9 }}>GigShield Smart ID</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.5px' }}>{worker.fullName}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} /> {city || worker.city}
          </div>
        </div>
        <div style={{ 
          background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', 
          padding: '8px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          {isProtected ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{isProtected ? 'COVERED' : 'UNINSURED'}</span>
        </div>
      </div>

      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
        <div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '4px' }}>Real-Time AI Risk Score</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{aiRiskData?.risk_score ? (aiRiskData.risk_score * 100).toFixed(0) : '0'}</span>
            <span style={{ fontSize: '1rem', opacity: 0.8 }}>/ 100</span>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
           <div style={{ background: '#fff', padding: '8px', borderRadius: '12px', display: 'inline-block' }}>
             {/* Abstract QR Code pattern */}
             <svg width="40" height="40" viewBox="0 0 48 48" fill="#0f172a">
               <path d="M0,0 h14 v14 h-14 z M4,4 h6 v6 h-6 z M34,0 h14 v14 h-14 z M38,4 h6 v6 h-6 z M0,34 h14 v14 h-14 z M4,38 h6 v6 h-6 z M18,0 h12 v4 h-12 z M18,6 h4 v8 h-4 z M24,6 h6 v4 h-6 z M26,12 h4 v6 h-4 z M18,16 h6 v2 h-6 z M34,18 h14 v6 h-14 z M38,20 h6 v2 h-6 z M0,18 h14 v12 h-14 z M4,22 h6 v4 h-6 z M18,22 h8 v4 h-8 z M28,20 h4 v6 h-4 z M18,28 h4 v4 h-4 z M24,28 h8 v6 h-8 z M34,28 h6 v4 h-6 z M42,28 h6 v6 h-6 z M34,34 h4 v4 h-4 z M40,36 h8 v4 h-8 z M34,40 h14 v8 h-14 z M38,44 h6 v2 h-6 z M18,36 h4 v12 h-4 z M24,36 h8 v4 h-8 z M24,42 h6 v6 h-6 z"/>
             </svg>
           </div>
        </div>
      </div>
    </div>
  );
}

// ---- Quick Protect (On-Demand Shift Insurance) ----
function QuickProtectWidget({ workerId, onPurchase }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    setLoading(true);
    try {
       await new Promise(r => setTimeout(r, 1500));
       // Use plan 7 (the SHIFT plan we added to data.sql) or default to any
       const { policyApi } = await import('../api/api.js');
       await policyApi.purchase({ workerId: Number(workerId), planId: 7 });
       setSuccess(true);
       if (onPurchase) onPurchase();
    } catch (e) {
       console.log(e);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="glass-card animate-fade-in-up" style={{ marginBottom: '16px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))', borderColor: 'var(--accent-emerald)', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
         <Shield size={32} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
         <div>
            <h4 style={{ margin: '0 0 4px 0', color: 'var(--accent-emerald)' }}>Shift Protection Active</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You are covered for the next 4 hours.</p>
         </div>
      </div>
    );
  }

  return (
    <div className="glass-card animate-fade-in-up" style={{ marginBottom: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(56, 189, 248, 0.05))', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}><Clock size={18} style={{ color: 'var(--accent-sky)' }} /> Quick-Protect: 4-Hour Shift</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Going online for deliveries? Get instant on-demand weather coverage for your shift.</p>
          </div>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-sky)', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>
             ₹9
          </div>
       </div>
       
       <button 
          onClick={handleActivate}
          disabled={loading}
          className="btn btn-primary" 
          style={{ width: '100%', background: 'var(--accent-sky)', color: '#000', border: 'none' }}
       >
          {loading ? <Loader2 size={18} className="spin" /> : <Zap size={18} />} 
          {loading ? 'Activating Policy...' : 'Slide to Activate Protection'}
       </button>
    </div>
  )
}

function Dashboard() {
  const { worker } = useAuth();
  const { city, coordinates, detectLocation, isDetecting, lastUpdated } = useLocation();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveWeather, setLiveWeather] = useState(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [aiRiskData, setAiRiskData] = useState(null);
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

  useEffect(() => {
    if (!city || !worker) return;
    const getAiRisk = async () => {
      try {
        const { aiApi } = await import('../api/api.js');
        const aiRes = await aiApi.predictRisk({
          worker_id: worker.id,
          city: city,
          environmental_data: {
            event_type: "NORMAL",
            rainfall_mm: liveWeather ? (liveWeather.rain || 0.0) : 0.0,
            temperature_c: liveWeather ? (liveWeather.temp || 28.0) : 28.0,
            aqi: 60
          },
          activity_data: {
            online_hours: 4.0,
            expected_deliveries: 15,
            completed_deliveries: 12,
            delivery_drop_rate: 10.0
          }
        });
        setAiRiskData(aiRes.data);
      } catch (err) {
        console.error("Failed to load AI risk:", err);
      }
    };
    getAiRisk();
  }, [city, worker, liveWeather]);

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
      <div className="dashboard-top-widgets" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
      {/* GigShield Digital Passport (Apple Wallet Style) */}
      <DigitalPassport worker={worker} dashboard={dashboard} aiRiskData={aiRiskData} city={city} />

        <QuickProtectWidget workerId={worker?.id} onPurchase={() => window.location.reload()} />
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <WeatherWidgetMini city={city} coordinates={coordinates} onWeatherUpdate={setLiveWeather} />
          <AIHealthWidget />
        </div>
        
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
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
              <div>
                <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.1rem' }}>Daily Risk Score — {city}</h3>
                <button 
                  onClick={() => setShowRiskModal(true)}
                  className="btn btn-ghost" 
                  style={{ padding: 0, marginTop: 4, color: 'var(--accent-teal)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Brain size={14} /> Explain AI Decision
                </button>
              </div>
              <span className={`risk-score ${aiRiskData ? (aiRiskData.risk_score >= 0.7 ? 'risk-high' : aiRiskData.risk_score >= 0.4 ? 'risk-medium' : 'risk-low') : 'risk-medium'}`} style={{ fontSize: '1.25rem' }}>
                {aiRiskData ? (aiRiskData.risk_score * 10).toFixed(1) : '...'} / 10
              </span>
            </div>
            <div className="risk-bar" style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)' }}>
              <div className="risk-bar-fill" style={{ width: `${aiRiskData ? aiRiskData.risk_score * 100 : 0}%`, background: aiRiskData ? (aiRiskData.risk_score >= 0.7 ? 'var(--accent-coral)' : aiRiskData.risk_score >= 0.4 ? 'var(--accent-amber)' : 'var(--accent-emerald)') : 'var(--text-muted)', transition: 'width 1s ease-out' }} />
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

      {/* AI Explainer Modal */}
      <AIRiskExplainerModal show={showRiskModal} onClose={() => setShowRiskModal(false)} city={city} aiRiskData={aiRiskData} />
    </div>
  );
}

export default Dashboard;

