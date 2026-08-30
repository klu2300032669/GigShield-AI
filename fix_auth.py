import os

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\context\AuthContext.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

update_logic = '''
  const updateWorkerProfile = useCallback((updatedWorker) => {
    setWorker(updatedWorker);
    localStorage.setItem('gigshield_worker', JSON.stringify(updatedWorker));
  }, []);
'''

if 'updateWorkerProfile' not in content:
    content = content.replace("const isAdmin = worker?.role === 'ADMIN';", update_logic + "\n  const isAdmin = worker?.role === 'ADMIN';")
    content = content.replace("worker, tokens, login, logout, updateTokens,", "worker, tokens, login, logout, updateTokens, updateWorkerProfile,")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
