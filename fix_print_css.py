import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-frontend\src\index.css'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if '@media print' not in content:
    print_styles = '''
/* ===========================================
   PRINT MEDIA STYLES (For Invoices/Receipts)
   =========================================== */
@media print {
  body {
    background: white !important;
    color: black !important;
  }
  * {
    color: black !important;
    text-shadow: none !important;
    box-shadow: none !important;
  }
  .sidebar, .mobile-bottom-nav, .page-header, .admin-action-btn, button, .btn {
    display: none !important;
  }
  .modal-overlay {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    background: white !important;
    z-index: 9999 !important;
    display: block !important;
  }
  .glass-card {
    border: none !important;
    box-shadow: none !important;
    background: white !important;
  }
}
'''
    content += print_styles
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
