import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages\Settings.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update notifPrefs to use localStorage and remove fake ones
notif_state_old = '''const [notifPrefs, setNotifPrefs] = useState({
    emailAlerts: true,
    pushNotifications: true,
    smsAlerts: false,
    weeklyDigest: true,
    claimUpdates: true,
    weatherAlerts: true,
    notificationSound: true,
  });'''
notif_state_new = '''const [notifPrefs, setNotifPrefs] = useState(() => {
    const saved = localStorage.getItem('gigshield_notif_prefs');
    return saved ? JSON.parse(saved) : {
      emailAlerts: true,
      pushNotifications: true,
      claimUpdates: true,
      weatherAlerts: true,
      notificationSound: true,
    };
  });

  const togglePref = (key) => {
    setNotifPrefs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('gigshield_notif_prefs', JSON.stringify(next));
      return next;
    });
  };'''

content = re.sub(r'const \[notifPrefs, setNotifPrefs\] = useState\(.*?\}\);.*?const togglePref = \(key\) => \{.*?setNotifPrefs.*?\}\);.*?\};', notif_state_new, content, flags=re.DOTALL)

# 2. Update toggle list rendering to match
map_old = r"\[\s*\{\s*key:\s*'emailAlerts'.*?\].map"
map_new = '''[
            { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive email notifications for important updates' },
            { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications for real-time alerts' },
            { key: 'claimUpdates', label: 'Claim Updates', desc: 'Notifications when claim status changes' },
            { key: 'weatherAlerts', label: 'Weather Alerts', desc: 'Alerts for severe weather in your area' },
            { key: 'notificationSound', label: 'Notification Sound', desc: 'Play sound when notifications arrive', icon: notifPrefs.notificationSound ? <Volume2 size={14} /> : <VolumeX size={14} /> },
          ].map'''
content = re.sub(r'\[\s*\{\s*key:\s*\'emailAlerts\'.*?\].map', map_new, content, flags=re.DOTALL)


# 3. Add Edit Profile feature
import_auth = "const { worker, updateWorkerProfile } = useAuth();"
content = content.replace("const { worker } = useAuth();", import_auth)

profile_old = '''<div className="settings-field">
            <div className="settings-field-label">Full Name</div>
            <div className="settings-field-value">{worker?.fullName || '—'}</div>
          </div>
          <div className="settings-field">
            <div className="settings-field-label">Email Address</div>
            <div className="settings-field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={14} style={{ color: 'var(--text-muted)' }} />
              {worker?.email || '—'}
            </div>
          </div>
          <div className="settings-field">
            <div className="settings-field-label">Phone Number</div>
            <div className="settings-field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={14} style={{ color: 'var(--text-muted)' }} />
              {worker?.phone || '—'}
            </div>
          </div>'''

# Inject Edit Profile state at the top of the component
state_inject = '''
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: worker?.fullName || '', phone: worker?.phone || '' });
  const [profileLoading, setProfileLoading] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await workerApi.updateWorker(worker.id, { fullName: profileForm.fullName, phone: profileForm.phone });
      updateWorkerProfile(res.data.data);
      showSuccess('Success', 'Profile updated successfully.');
      setIsEditingProfile(false);
    } catch (err) {
      showError('Error', 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };
'''

content = content.replace("const [requestingPush, setRequestingPush] = useState(false);", "const [requestingPush, setRequestingPush] = useState(false);" + state_inject)

profile_new = '''
          <div style={{ padding: '0 16px 16px', display: 'flex', justifyContent: 'flex-end' }}>
            {!isEditingProfile && <button className="btn btn-primary btn-sm" onClick={() => setIsEditingProfile(true)}>Edit Profile</button>}
          </div>
          {isEditingProfile ? (
            <form onSubmit={handleProfileSave} style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input type="text" required className="form-input" value={profileForm.fullName} onChange={e => setProfileForm({...profileForm, fullName: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone Number</label>
                <input type="text" required className="form-input" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" disabled={profileLoading} className={tn btn-primary }>Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditingProfile(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <div className="settings-field">
                <div className="settings-field-label">Full Name</div>
                <div className="settings-field-value">{worker?.fullName || '—'}</div>
              </div>
              <div className="settings-field">
                <div className="settings-field-label">Email Address</div>
                <div className="settings-field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                  {worker?.email || '—'}
                </div>
              </div>
              <div className="settings-field">
                <div className="settings-field-label">Phone Number</div>
                <div className="settings-field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                  {worker?.phone || '—'}
                </div>
              </div>
            </>
          )}
'''

content = content.replace(profile_old, profile_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
