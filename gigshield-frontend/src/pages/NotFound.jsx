import { Link } from 'react-router-dom';
import { LayoutDashboard, Home } from 'lucide-react';

function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        background: 'var(--bg-primary)',
      }}
    >
      {/* SVG Illustration */}
      <svg
        width="260"
        height="200"
        viewBox="0 0 260 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ marginBottom: 32 }}
        aria-hidden="true"
      >
        {/* Background circle */}
        <circle cx="130" cy="100" r="90" fill="rgba(139,92,246,0.06)" />
        {/* Shield */}
        <path
          d="M130 30 L175 52 L175 100 C175 130 152 152 130 165 C108 152 85 130 85 100 L85 52 Z"
          fill="rgba(139,92,246,0.12)"
          stroke="rgba(139,92,246,0.4)"
          strokeWidth="2"
        />
        {/* 404 text inside shield */}
        <text
          x="130"
          y="108"
          textAnchor="middle"
          fontSize="36"
          fontWeight="800"
          fill="var(--accent-violet, #8b5cf6)"
          fontFamily="system-ui, sans-serif"
        >
          404
        </text>
        {/* Stars / sparkles */}
        <circle cx="55" cy="55" r="4" fill="rgba(139,92,246,0.4)" />
        <circle cx="205" cy="65" r="3" fill="rgba(16,185,129,0.5)" />
        <circle cx="190" cy="150" r="5" fill="rgba(245,158,11,0.4)" />
        <circle cx="65" cy="155" r="3" fill="rgba(251,113,133,0.5)" />
      </svg>

      <h1
        style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: 12,
        }}
      >
        Page Not Found
      </h1>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          marginBottom: 32,
          maxWidth: 420,
          lineHeight: 1.6,
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved. 
        Let&apos;s get you back on track.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/dashboard" className="btn btn-primary">
          <LayoutDashboard size={16} />
          Go to Dashboard
        </Link>
        <button
          className="btn btn-outline"
          onClick={() => window.history.back()}
        >
          <Home size={16} />
          Go Back
        </button>
      </div>
    </div>
  );
}

export default NotFound;
