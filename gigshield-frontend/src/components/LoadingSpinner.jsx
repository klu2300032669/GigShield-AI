import { Loader2 } from 'lucide-react';

function LoadingSpinner() {
  return (
    <div className="spinner-container">
      <Loader2 size={36} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--accent-blue)' }} />
      <div className="spinner-text">Loading...</div>
    </div>
  );
}

export default LoadingSpinner;
