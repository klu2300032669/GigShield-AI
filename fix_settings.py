import os

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\Settings.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure workerApi is imported
if 'workerApi' not in content:
    content = content.replace("import { useLocation }", "import { useLocation }\nimport { workerApi } from '../api/api.js';\nimport { useToast } from '../context/ToastContext.jsx';")

# Replace Change Password redirect with a real form state
if 'const [requestingPush' in content:
    state_injection = '''
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      showError('Validation Error', 'New passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      await workerApi.changePassword(worker.id, {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new
      });
      showSuccess('Success', 'Your password has been updated securely.');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      showError('Error', err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };
'''
    content = content.replace('const [requestingPush, setRequestingPush] = useState(false);', 'const [requestingPush, setRequestingPush] = useState(false);' + state_injection)


# Replace the simplistic redirect section
old_section = '''<div className="settings-field" style={{ display: 'block' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Keep your account secure by using a strong password. You can reset your password using your current password or via email OTP if you forgot it.
            </p>
            <button 
              className="btn btn-primary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              onClick={() => {
                // For simplicity, just redirect them to Forgot Password since we fixed OTP bypass!
                window.location.href = '/forgot-password';
              }}
            >
              Change Password
            </button>
          </div>'''

new_section = '''<form onSubmit={handlePasswordChange} className="settings-field" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input type="password" required className="form-input" placeholder="Current Password" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input type="password" required className="form-input" placeholder="New Password" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input type="password" required className="form-input" placeholder="Confirm New Password" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} />
            </div>
            <button type="submit" disabled={passwordLoading} className={tn btn-primary } style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
              {!passwordLoading && 'Update Password'}
            </button>
          </form>'''

content = content.replace(old_section, new_section)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
