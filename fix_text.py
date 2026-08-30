import os

replacements = {
    'â‚¹': '₹',
    'â€¢': '•',
    'â€”': '—',
    'â†’': '→',
    'âœ•': '✕',
    'âš ï¸ ': '⚠️',
    'â€¦': '…'
}

src_dir = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\pages'

for filename in os.listdir(src_dir):
    if not filename.endswith('.jsx'):
        continue
    filepath = os.path.join(src_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    for bad, good in replacements.items():
        if bad in content:
            content = content.replace(bad, good)
            modified = True
            
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed {filename}')
