import React from 'react';

// Base skeleton block
export function Skeleton({ width = '100%', height = '16px', borderRadius = '6px', style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius, ...style }}
      aria-hidden="true"
    />
  );
}

// Stat card skeleton (matches metric-card)
export function StatCardSkeleton() {
  return (
    <div className="metric-card teal" style={{ opacity: 0.6 }} aria-hidden="true">
      <div className="metric-header">
        <Skeleton width="40px" height="40px" borderRadius="10px" />
      </div>
      <Skeleton width="70px" height="32px" borderRadius="8px" style={{ marginTop: 8 }} />
      <Skeleton width="100px" height="14px" borderRadius="6px" style={{ marginTop: 8 }} />
    </div>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="table-container" aria-label="Loading data..." aria-busy="true">
      <table className="data-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><Skeleton height="14px" width={i === 0 ? '60px' : '90px'} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx}>
                  <Skeleton
                    height="14px"
                    width={colIdx === 0 ? '50px' : colIdx % 3 === 0 ? '60px' : '100px'}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Glass card skeleton
export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="glass-card" aria-hidden="true" style={{ opacity: 0.6 }}>
      <Skeleton width="140px" height="18px" style={{ marginBottom: 12 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '65%' : '100%'}
          height="13px"
          style={{ marginBottom: 8 }}
        />
      ))}
    </div>
  );
}

// Dashboard skeleton
export function DashboardSkeleton() {
  return (
    <div aria-label="Loading dashboard..." aria-busy="true">
      {/* Header */}
      <div className="page-header">
        <div>
          <Skeleton width="220px" height="32px" borderRadius="8px" style={{ marginBottom: 8 }} />
          <Skeleton width="260px" height="16px" borderRadius="6px" />
        </div>
      </div>
      {/* Metric cards */}
      <div className="metrics-grid" style={{ marginBottom: 'var(--space-xl)' }}>
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      {/* Secondary */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 'var(--space-xl)' }}>
        {[...Array(4)].map((_, i) => <CardSkeleton key={i} lines={2} />)}
      </div>
      {/* Table */}
      <TableSkeleton rows={4} cols={6} />
    </div>
  );
}

export default Skeleton;
