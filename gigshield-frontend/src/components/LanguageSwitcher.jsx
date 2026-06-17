import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useState } from 'react';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'hi', label: 'हिन्दी' }
  ];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <div className="language-switcher" style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'var(--bg-glass)', 
          border: '1px solid var(--border-color)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '4px 8px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px',
          color: 'var(--text-color)',
          cursor: 'pointer',
          fontSize: '0.8rem'
        }}
      >
        <Globe size={14} />
        {currentLang.label}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          marginBottom: '8px',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          minWidth: '100px',
          overflow: 'hidden'
        }}>
          {languages.map((lng) => (
            <button
              key={lng.code}
              onClick={() => changeLanguage(lng.code)}
              style={{
                background: i18n.language === lng.code ? 'var(--primary-color-alpha)' : 'transparent',
                border: 'none',
                padding: '8px 12px',
                textAlign: 'left',
                color: 'var(--text-color)',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              {lng.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
