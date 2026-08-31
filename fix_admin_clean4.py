import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\AdminDashboard.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Delete lines containing the orphaned try-catch block
bad_code = '''        const res = await aiApi.analyzeFraud(payload);
      const result = res.data;
      if (result.is_suspicious) {
        showError('AI Fraud Alert', High Risk! Anomaly Score: . Flags: );
      } else {
        showSuccess('AI Check Passed', Low Risk. Anomaly Score: .);
      }
    } catch (err) {
      showError('AI Service Error', err.response?.data?.detail || err.message || 'Could not reach AI prediction service.');
    } finally {
      setActionLoading(null);
    }
  };'''

content = content.replace(bad_code, '')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
