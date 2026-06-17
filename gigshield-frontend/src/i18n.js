import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// --- Translation Files ---
const resources = {
  en: {
    translation: {
      sidebar: {
        dashboard: "Dashboard",
        plans: "Plans",
        policies: "My Policies",
        claims: "Claims",
        weather: "Weather",
        analytics: "Analytics",
        notifications: "Notifications",
        settings: "Settings",
        profile: "Profile",
        admin: "Admin",
        logout: "Log Out"
      },
      dashboard: {
        welcome: "Welcome back",
        active_policies: "Active Policies",
        total_claims: "Total Claims",
        payouts_received: "Payouts Received",
        risk_score: "AI Risk Score",
        weather_alert: "Weather Alert",
        buy_policy: "Buy Policy"
      },
      plans: {
        title: "Available Insurance Plans",
        subtitle: "AI pricing is continuously adjusting based on real-time risk in your area.",
        dynamic_price: "Dynamic Price",
        base_price: "Base Price",
        max_payout: "Max Payout",
        purchase: "Purchase Now",
        purchasing: "Processing...",
        ai_reasoning: "AI Reasoning"
      }
    }
  },
  es: {
    translation: {
      sidebar: {
        dashboard: "Panel",
        plans: "Planes",
        policies: "Mis Pólizas",
        claims: "Reclamos",
        weather: "Clima",
        analytics: "Analítica",
        notifications: "Notificaciones",
        settings: "Ajustes",
        profile: "Perfil",
        admin: "Administración",
        logout: "Cerrar Sesión"
      },
      dashboard: {
        welcome: "Bienvenido de nuevo",
        active_policies: "Pólizas Activas",
        total_claims: "Reclamos Totales",
        payouts_received: "Pagos Recibidos",
        risk_score: "Riesgo de IA",
        weather_alert: "Alerta del Clima",
        buy_policy: "Comprar Póliza"
      },
      plans: {
        title: "Planes de Seguro Disponibles",
        subtitle: "Los precios de IA se ajustan continuamente según el riesgo en tiempo real en su área.",
        dynamic_price: "Precio Dinámico",
        base_price: "Precio Base",
        max_payout: "Pago Máximo",
        purchase: "Comprar Ahora",
        purchasing: "Procesando...",
        ai_reasoning: "Razonamiento de IA"
      }
    }
  },
  hi: {
    translation: {
      sidebar: {
        dashboard: "डैशबोर्ड",
        plans: "योजनाएं",
        policies: "मेरी नीतियां",
        claims: "दावे",
        weather: "मौसम",
        analytics: "एनालिटिक्स",
        notifications: "सूचनाएं",
        settings: "सेटिंग्स",
        profile: "प्रोफ़ाइल",
        admin: "व्यवस्थापक",
        logout: "लॉग आउट"
      },
      dashboard: {
        welcome: "वापसी पर स्वागत है",
        active_policies: "सक्रिय नीतियां",
        total_claims: "कुल दावे",
        payouts_received: "प्राप्त भुगतान",
        risk_score: "एआई जोखिम स्कोर",
        weather_alert: "मौसम चेतावनी",
        buy_policy: "पॉलिसी खरीदें"
      },
      plans: {
        title: "उपलब्ध बीमा योजनाएं",
        subtitle: "एआई मूल्य निर्धारण आपके क्षेत्र में वास्तविक समय के जोखिम के आधार पर समायोजित हो रहा है।",
        dynamic_price: "गतिशील मूल्य",
        base_price: "मूल मूल्य",
        max_payout: "अधिकतम भुगतान",
        purchase: "अभी खरीदें",
        purchasing: "प्रसंस्करण...",
        ai_reasoning: "एआई तर्क"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
