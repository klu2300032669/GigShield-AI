import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Optimistic Updates logic
old_logic = '''      try {
        if (type === 'approve') {
          await adminApi.approveClaim(id);
          showSuccess('Claim Approved', Claim # has been approved.);
        } else if (type === 'reject') {
          await adminApi.rejectClaim(id);
          showSuccess('Claim Rejected', Claim # has been rejected.);
        } else if (type === 'toggle') {
          await adminApi.toggleWorkerStatus(id);
          showSuccess('Worker Updated', Worker status has been toggled.);
        } else if (type === 'promote') {
          await adminApi.promoteWorker(id);
          showSuccess('Worker Updated', Worker role has been changed.);
        } else if (type === 'delete-worker') {
          await adminApi.deleteWorker(id);
          showSuccess('Worker Deleted', Worker # has been permanently deleted.);
        } else if (type === 'delete-claim') {
          await adminApi.deleteClaim(id);
          showSuccess('Claim Deleted', Claim # has been permanently deleted.);
        }
        fetchAll();'''

new_logic = '''      try {
        // Optimistic UI Updates for smooth realtime feel
        if (type === 'approve') {
          setClaims(prev => prev.map(c => c.id === id ? { ...c, status: 'APPROVED' } : c));
          await adminApi.approveClaim(id);
          showSuccess('Claim Approved', Claim # has been approved.);
        } else if (type === 'reject') {
          setClaims(prev => prev.map(c => c.id === id ? { ...c, status: 'REJECTED' } : c));
          await adminApi.rejectClaim(id);
          showSuccess('Claim Rejected', Claim # has been rejected.);
        } else if (type === 'toggle') {
          setWorkers(prev => prev.map(w => w.id === id ? { ...w, isActive: !w.isActive } : w));
          await adminApi.toggleWorkerStatus(id);
          showSuccess('Worker Updated', Worker status has been toggled.);
        } else if (type === 'promote') {
          setWorkers(prev => prev.map(w => w.id === id ? { ...w, role: w.role === 'ADMIN' ? 'WORKER' : 'ADMIN' } : w));
          await adminApi.promoteWorker(id);
          showSuccess('Worker Updated', Worker role has been changed.);
        } else if (type === 'delete-worker') {
          setWorkers(prev => prev.filter(w => w.id !== id));
          await adminApi.deleteWorker(id);
          showSuccess('Worker Deleted', Worker # has been permanently deleted.);
        } else if (type === 'delete-claim') {
          setClaims(prev => prev.filter(c => c.id !== id));
          await adminApi.deleteClaim(id);
          showSuccess('Claim Deleted', Claim # has been permanently deleted.);
        }
        // fetchAll() will sync the exact data in background
        fetchAll();'''

content = content.replace(old_logic, new_logic)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
