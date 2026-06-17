import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { claimApi, payoutApi } from '../api/api.js';
import { DashboardSkeleton } from '../components/ui/SkeletonLoader.jsx';
import {
  BarChart3, TrendingUp, FileText, Banknote,
  AlertCircle, CloudRain, Flame, Wind, Shield,
  Calendar, Download, ChevronDown, Loader2
} from 'lucide-react';

// SVG Donut Chart
function DonutChart({ segments, size = 140, thickness = 22 }) {
  const r = (size / 2) - thickness;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((s, sg) => s + sg.value, 0) || 1;

  const elements = segments.reduce((acc, seg, i) => {
    const dash = (seg.value / total) * circumference;
    const gap = circumference - dash;
    const el = (
      <circle
        key={i}
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={thickness}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-acc.offset}
        strokeLinecap="butt"
        style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
      />
    );
    acc.elements.push(el);
    acc.offset += dash;
    return acc;
  }, { elements: [], offset: 0 }).elements;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
        {elements}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {segments.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{seg.label}</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginLeft: 4 }}>
              {seg.value}
            </span>
          </div>
        ))}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Total: <strong style={{ color: 'var(--text-primary)' }}>{total}</strong>
        </div>
      </div>
    </div>
  );
}

// Mini Trend Line chart for predictive analysis
function TrendLine({ data, predictedData = [], color = '#10b981', height = 80 }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Not enough data</p>
      </div>
    );
  }

  const allData = [...data, ...predictedData];
  const max = Math.max(...allData, 1);
  const min = Math.min(...allData, 0);
  const range = max - min || 1;
  const w = 300;
  const h = height;

  const toPoint = (v, i, total) => {
    const x = (i / (total - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return { x, y };
  };

  const actualPoints = data.map((v, i) => toPoint(v, i, allData.length));
  const predictedPoints = predictedData.map((v, i) => toPoint(v, data.length + i, allData.length));

  const polylineActual = actualPoints.map(p => `${p.x},${p.y}`).join(' ');

  let polylinePredicted = '';
  if (predictedPoints.length > 0) {
    const bridgePoints = [actualPoints[actualPoints.length - 1], ...predictedPoints];
    polylinePredicted = bridgePoints.map(p => `${p.x},${p.y}`).join(' ');
  }

  return (
    <div className="sparkline-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline points={polylineActual} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {polylinePredicted && (
          <polyline points={polylinePredicted} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4" opacity="0.5" />
        )}
        {actualPoints.length > 0 && (
          <circle cx={actualPoints[actualPoints.length - 1].x} cy={actualPoints[actualPoints.length - 1].y}
            r="4" fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        )}
      </svg>
      {predictedPoints.length > 0 && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 16, height: 2, background: color, display: 'inline-block' }} /> Actual
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 16, height: 2, background: color, display: 'inline-block', opacity: 0.5, borderTop: '2px dashed' }} /> Predicted
          </span>
        </div>
      )}
    </div>
  );
}

const DATE_RANGES = [
  { key: '7d', label: 'Last 7 Days', days: 7 },
  { key: '30d', label: 'Last 30 Days', days: 30 },
  { key: '90d', label: 'Last 90 Days', days: 90 },
  { key: 'all', label: 'All Time', days: null },
];

function Analytics() {
  const { worker } = useAuth();
  const [claims, setClaims] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [exporting, setExporting] = useState(false);
  const chartsRef = useRef(null);

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      const [claimsRes, payoutsRes] = await Promise.all([
        claimApi.getWorkerClaims(worker.id),
        payoutApi.getWorkerPayouts(worker.id),
      ]);
      // Safe array extraction with Array.isArray check
      const claimsData = claimsRes?.data;
      const payoutsData = payoutsRes?.data;
      setClaims(Array.isArray(claimsData) ? claimsData : (Array.isArray(claimsData?.content) ? claimsData.content : []));
      setPayouts(Array.isArray(payoutsData) ? payoutsData : (Array.isArray(payoutsData?.content) ? payoutsData.content : []));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // Filter by date range
  const filterByDateRange = useCallback((items) => {
    if (!Array.isArray(items)) return [];
    const range = DATE_RANGES.find(r => r.key === dateRange);
    if (!range || !range.days) return items;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range.days);
    return items.filter(item => {
      const date = new Date(item.triggeredAt || item.createdAt || item.processedAt);
      return !isNaN(date.getTime()) && date >= cutoff;
    });
  }, [dateRange]);

  const filteredClaims = filterByDateRange(claims);
  const filteredPayouts = filterByDateRange(payouts);

  const formatCurrency = (val) => {
    if (!val) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  };

  // Export charts as PNG
  const handleExportPNG = async () => {
    if (!chartsRef.current) return;
    setExporting(true);
    try {
      // Use canvas-based approach for SVG export
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0a0f1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Inter, system-ui, sans-serif';
      ctx.fillText('GigShield Analytics Report', 40, 50);
      ctx.font = '14px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#8b8fa3';
      ctx.fillText(`Generated: ${new Date().toLocaleDateString('en-IN')} | Range: ${DATE_RANGES.find(r => r.key === dateRange)?.label}`, 40, 78);

      // Draw summary stats
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#14b8a6';
      ctx.fillText(`Total Claims: ${filteredClaims.length}`, 40, 130);
      ctx.fillStyle = '#10b981';
      ctx.fillText(`Total Earned: ${formatCurrency(totalPayoutAmt)}`, 300, 130);
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`Avg Payout: ${formatCurrency(avgPayoutAmt)}`, 560, 130);
      ctx.fillStyle = '#fb7185';
      ctx.fillText(`Avg Risk: ${avgRisk.toFixed(2)}`, 820, 130);

      // Draw bars for event types
      const barY = 180;
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('Claims by Event Type', 40, barY);
      const bars = [
        { label: 'Heavy Rain', value: rainClaims, color: '#14b8a6' },
        { label: 'Extreme Heat', value: heatClaims, color: '#f59e0b' },
        { label: 'High Pollution', value: pollutionClaims, color: '#8b5cf6' },
      ];
      bars.forEach((bar, i) => {
        const y = barY + 30 + i * 40;
        ctx.fillStyle = '#8b8fa3';
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.fillText(bar.label, 40, y + 14);
        ctx.fillStyle = bar.color;
        const barWidth = maxEventCount > 0 ? (bar.value / maxEventCount) * 400 : 0;
        ctx.fillRect(180, y, barWidth, 20);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Inter, system-ui, sans-serif';
        ctx.fillText(String(bar.value), 185 + barWidth, y + 14);
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gigshield_analytics_${new Date().toISOString().slice(0,10)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div>
      <div className="page-header">
        <h1>
          <div className="page-header-icon" style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
            <BarChart3 size={20} />
          </div>
          Analytics
        </h1>
        <p>Insights into your claims, payouts, and risk profile</p>
      </div>
      <DashboardSkeleton />
    </div>
  );

  // Compute analytics with safe array checks
  const safeClaims = Array.isArray(filteredClaims) ? filteredClaims : [];
  const safePayouts = Array.isArray(filteredPayouts) ? filteredPayouts : [];

  const totalClaims = safeClaims.length;
  const approved = safeClaims.filter(c => c.status === 'APPROVED' || c.status === 'PAID').length;
  const rejected = safeClaims.filter(c => c.status === 'REJECTED').length;
  const pending  = safeClaims.filter(c => c.status === 'PENDING').length;

  const rainClaims      = safeClaims.filter(c => c.eventType === 'HEAVY_RAIN').length;
  const heatClaims      = safeClaims.filter(c => c.eventType === 'EXTREME_HEAT').length;
  const pollutionClaims = safeClaims.filter(c => c.eventType === 'HIGH_POLLUTION').length;
  const maxEventCount   = Math.max(rainClaims, heatClaims, pollutionClaims, 1);

  const totalPayoutAmt = safePayouts
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const completedPayouts = safePayouts.filter(p => p.status === 'COMPLETED').length;
  const avgPayoutAmt = completedPayouts > 0 ? totalPayoutAmt / completedPayouts : 0;

  const avgRisk = safeClaims.length > 0
    ? (safeClaims.reduce((sum, c) => sum + Number(c.riskScore || 0), 0) / safeClaims.length)
    : 0;

  // Risk distribution
  const lowRisk  = safeClaims.filter(c => Number(c.riskScore) < 0.4).length;
  const medRisk  = safeClaims.filter(c => Number(c.riskScore) >= 0.4 && Number(c.riskScore) < 0.7).length;
  const highRisk = safeClaims.filter(c => Number(c.riskScore) >= 0.7).length;

  // Donut segments for claim status
  const statusSegments = [
    { label: 'Approved', value: approved, color: '#10b981' },
    { label: 'Pending',  value: pending,  color: '#f59e0b' },
    { label: 'Rejected', value: rejected, color: '#fb7185' },
  ].filter(s => s.value > 0);

  // Donut segments for risk distribution
  const riskSegments = [
    { label: 'Low Risk',    value: lowRisk,  color: '#10b981' },
    { label: 'Medium Risk', value: medRisk,  color: '#f59e0b' },
    { label: 'High Risk',   value: highRisk, color: '#fb7185' },
  ].filter(s => s.value > 0);

  // Data for trend lines
  const riskTrendData = safeClaims.slice(-10).map(c => Number(c.riskScore || 0));
  // Simple predicted values: linear projection of last 3 data points
  const predictRiskTrend = () => {
    if (riskTrendData.length < 3) return [];
    const last3 = riskTrendData.slice(-3);
    const trend = (last3[2] - last3[0]) / 2;
    return [
      Math.max(0, Math.min(1, last3[2] + trend)),
      Math.max(0, Math.min(1, last3[2] + trend * 2)),
      Math.max(0, Math.min(1, last3[2] + trend * 3)),
    ];
  };

  // Compare with previous period
  const previousPeriodClaims = (() => {
    const range = DATE_RANGES.find(r => r.key === dateRange);
    if (!range || !range.days || !Array.isArray(claims)) return [];
    const now = new Date();
    const cutoffStart = new Date(now);
    cutoffStart.setDate(cutoffStart.getDate() - range.days * 2);
    const cutoffEnd = new Date(now);
    cutoffEnd.setDate(cutoffEnd.getDate() - range.days);
    return claims.filter(item => {
      const date = new Date(item.triggeredAt || item.createdAt);
      return !isNaN(date.getTime()) && date >= cutoffStart && date < cutoffEnd;
    });
  })();

  const prevPeriodCount = previousPeriodClaims.length;
  const periodChange = prevPeriodCount > 0 ? ((totalClaims - prevPeriodCount) / prevPeriodCount * 100).toFixed(1) : null;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
          <h1>
            <div className="page-header-icon" style={{ background: 'var(--accent-teal-glow)', color: 'var(--accent-teal)' }}>
              <BarChart3 size={20} />
            </div>
            Analytics
          </h1>
          <p>Insights into your claims, payouts, and risk profile</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Date Range Filter */}
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              aria-expanded={showDateDropdown}
              aria-haspopup="listbox"
              aria-label="Select date range filter"
            >
              <Calendar size={14} />
              {DATE_RANGES.find(r => r.key === dateRange)?.label}
              <ChevronDown size={14} />
            </button>
            {showDateDropdown && (
              <div className="dropdown-menu" role="listbox" aria-label="Date range options" style={{
                position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50,
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)', overflow: 'hidden', minWidth: 160,
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}>
                {DATE_RANGES.map(range => (
                  <button
                    key={range.key}
                    role="option"
                    aria-selected={dateRange === range.key}
                    className="dropdown-item"
                    onClick={() => { setDateRange(range.key); setShowDateDropdown(false); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 14px', border: 'none', cursor: 'pointer',
                      background: dateRange === range.key ? 'var(--accent-teal-glow)' : 'transparent',
                      color: dateRange === range.key ? 'var(--accent-teal)' : 'var(--text-secondary)',
                      fontSize: '0.85rem', fontWeight: dateRange === range.key ? 600 : 400,
                    }}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export PNG */}
          <button
            className="btn btn-outline btn-sm"
            onClick={handleExportPNG}
            disabled={exporting}
            title="Export analytics charts as PNG image"
            aria-label="Export charts as PNG"
          >
            {exporting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={14} />}
            Export PNG
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error"><AlertCircle size={16} /> {error}</div>}

      {/* Comparative analysis banner */}
      {periodChange !== null && dateRange !== 'all' && (
        <div className="glass-card animate-fade-in-up" style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--space-lg)',
          background: Number(periodChange) >= 0
            ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))'
            : 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
          borderColor: Number(periodChange) >= 0 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
          padding: '12px 16px',
        }}>
          <TrendingUp size={18} style={{ color: Number(periodChange) >= 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: Number(periodChange) >= 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
              {Number(periodChange) >= 0 ? '+' : ''}{periodChange}%
            </strong> claims vs previous {DATE_RANGES.find(r => r.key === dateRange)?.label?.toLowerCase()} ({prevPeriodCount} → {totalClaims})
          </span>
        </div>
      )}

      {/* Summary Metrics */}
      <div ref={chartsRef} className="metrics-grid stagger-children" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <FileText size={20} style={{ color: 'var(--accent-teal)', marginBottom: 8 }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-teal)' }}>{totalClaims}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Total Claims</div>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <TrendingUp size={20} style={{ color: 'var(--accent-emerald)', marginBottom: 8 }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>{formatCurrency(totalPayoutAmt)}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Total Earned</div>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <Banknote size={20} style={{ color: 'var(--accent-amber)', marginBottom: 8 }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{formatCurrency(avgPayoutAmt)}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Avg Payout</div>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <Shield size={20} style={{ color: 'var(--accent-coral)', marginBottom: 8 }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-coral)' }}>{avgRisk.toFixed(2)}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>Avg Risk Score</div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Claims by Event Type */}
        <div className="analytics-card">
          <h3><CloudRain size={18} style={{ color: 'var(--accent-sky)' }} /> Claims by Event Type</h3>
          <div className="bar-chart">
            <div className="bar-row">
              <div className="bar-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CloudRain size={14} /> Heavy Rain
              </div>
              <div className="bar-track">
                <div className="bar-fill teal" style={{ width: `${(rainClaims/maxEventCount)*100}%` }}>
                  {rainClaims}
                </div>
              </div>
            </div>
            <div className="bar-row">
              <div className="bar-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Flame size={14} /> Extreme Heat
              </div>
              <div className="bar-track">
                <div className="bar-fill amber" style={{ width: `${(heatClaims/maxEventCount)*100}%` }}>
                  {heatClaims}
                </div>
              </div>
            </div>
            <div className="bar-row">
              <div className="bar-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Wind size={14} /> High Pollution
              </div>
              <div className="bar-track">
                <div className="bar-fill violet" style={{ width: `${(pollutionClaims/maxEventCount)*100}%` }}>
                  {pollutionClaims}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Distribution — donut chart */}
        <div className="analytics-card">
          <h3><BarChart3 size={18} style={{ color: 'var(--accent-emerald)' }} /> Risk Score Distribution</h3>
          {riskSegments.length > 0 ? (
            <DonutChart segments={riskSegments} />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl) 0' }}>
              No risk data to display
            </div>
          )}
        </div>

        {/* Claim Status Donut */}
        <div className="analytics-card">
          <h3><FileText size={18} style={{ color: 'var(--accent-amber)' }} /> Claim Status</h3>
          {statusSegments.length > 0 ? (
            <DonutChart segments={statusSegments} />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl) 0' }}>
              No claims to display
            </div>
          )}
        </div>

        {/* Payout Summary */}
        <div className="analytics-card">
          <h3><Banknote size={18} style={{ color: 'var(--accent-emerald)' }} /> Payout Summary</h3>
          {safePayouts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Total Payouts</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>{safePayouts.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Completed</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-emerald)' }}>
                  {completedPayouts}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Pending</span>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-amber)' }}>
                  {safePayouts.filter(p => p.status === 'INITIATED').length}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 600 }}>Total Earned</span>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent-emerald)' }}>{formatCurrency(totalPayoutAmt)}</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-xl) 0' }}>
              No payouts yet
            </div>
          )}
        </div>

        {/* Predictive Trend */}
        <div className="analytics-card" style={{ gridColumn: '1 / -1' }}>
          <h3><TrendingUp size={18} style={{ color: 'var(--accent-violet)' }} /> Risk Score Trend &amp; Prediction</h3>
          <TrendLine
            data={riskTrendData}
            predictedData={predictRiskTrend()}
            color="#8b5cf6"
            height={100}
          />
          <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Dashed line shows predicted trend based on recent claim patterns. Last {riskTrendData.length} claims shown.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
