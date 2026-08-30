import os

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-backend\src\main\java\com\gigshield\config\AdminDataLoader.java'
with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

content = content.replace("o.", "✅")
content = content.replace(" ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ? ?", "="*50)
content = content.replace("dY\"?", "✅")
content = content.replace("dY\" ", "✉️")
content = content.replace("dY\"", "🔑")
content = content.replace("s,?", "🚨")
content = content.replace("dY'", "💡")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
