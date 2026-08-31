import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

export_ledger_code = '''
          <button 
            className="btn btn-outline" 
            style={{ color: 'var(--accent-indigo)', borderColor: 'var(--accent-indigo)' }}
            onClick={() => {
              if (!claims || claims.length === 0) return showError("No data", "There are no claims to export.");
              
              // Build CSV
              const headers = ["ID", "Plan", "Event", "Risk Score", "Amount", "Status", "Date"];
              const csvRows = [headers.join(",")];
              
              claims.forEach(c => {
                csvRows.push([
                  c.id, 
                  "", 
                  c.eventType, 
                  c.riskScore, 
                  c.claimAmount, 
                  c.status, 
                  c.createdAt || new Date().toISOString()
                ].join(","));
              });
              
              const csvString = csvRows.join("\\n");
              const blob = new Blob([csvString], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = gigshield_global_ledger.csv;
              a.click();
              showSuccess("Exported", "Global ledger downloaded successfully.");
            }}
          >
            <FileText size={16} /> Export Ledger (CSV)
          </button>
'''

content = content.replace('<div style={{ display: \'flex\', gap: \'12px\', alignItems: \'center\' }}>', '<div style={{ display: \'flex\', gap: \'12px\', alignItems: \'center\' }}>\n' + export_ledger_code)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
