import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LocationContext = createContext(null);

// Indian cities are kept here only for random data generation if needed
// but LocationContext will now use exact reverse geocoded locations
const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad',
  'Kolkata', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur',
  'Lucknow', 'Nagpur', 'Indore', 'Bhopal', 'Visakhapatnam',
  'Patna', 'Vadodara', 'Guwahati', 'Chandigarh'
];

export function LocationProvider({ children }) {
  const [city, setCityState] = useState(() => {
    return localStorage.getItem('gigshield_city') || '';
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [accuracy, setAccuracy] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() => {
    return localStorage.getItem('gigshield_location_updated') || null;
  });
  const [permissionState, setPermissionState] = useState('prompt'); // 'granted' | 'denied' | 'prompt'
  const [coordinates, setCoordinates] = useState(null);
  const [locationHistory, setLocationHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gigshield_location_history') || '[]');
    } catch { return []; }
  });

  const setCity = useCallback((newCity) => {
    const prevCity = localStorage.getItem('gigshield_city');
    setCityState(newCity);
    localStorage.setItem('gigshield_city', newCity);
    const now = new Date().toISOString();
    setLastUpdated(now);
    localStorage.setItem('gigshield_location_updated', now);

    // Add to history
    if (prevCity && prevCity !== newCity) {
      setLocationHistory(prev => {
        const updated = [
          { city: newCity, timestamp: now },
          ...prev.slice(0, 9), // keep last 10
        ];
        localStorage.setItem('gigshield_location_history', JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

  // Check permission state
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(result => {
          setPermissionState(result.state);
          result.onchange = () => setPermissionState(result.state);
        })
        .catch(() => {}); // permissions API not supported
    }
  }, []);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      if (!city) setCity('Mumbai');
      return;
    }

    setIsDetecting(true);
    setLocationError('');

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 300000, // 5 min cache
        });
      });

      const { latitude, longitude, accuracy: acc } = position.coords;
      setCoordinates({ lat: latitude, lng: longitude });
      setAccuracy(acc);
      setPermissionState('granted');

      // Try reverse geocoding via BigDataCloud (free, no API key)
      try {
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const data = await res.json();
        const detectedCity = data.city || data.locality || data.principalSubdivision || 'Unknown Location';
        setCity(detectedCity);
      } catch {
        // Reverse geocode failed
        setCity('Unknown Location');
      }
    } catch (err) {
      // Geolocation denied or failed
      setPermissionState('denied');
      const errorMessages = {
        1: 'Location access denied. Please enable location permissions in your browser settings.',
        2: 'Location unavailable. Please check your device settings.',
        3: 'Location request timed out. Please try again.',
      };
      setLocationError(errorMessages[err.code] || 'Could not detect your location.');
      if (!city) {
        setCity('Mumbai');
      }
    } finally {
      setIsDetecting(false);
    }
  }, [city, setCity]);

  // Auto-detect on first load if no city saved
  useEffect(() => {
    if (!city) {
      detectLocation();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get accuracy level label
  const getAccuracyLevel = () => {
    if (!accuracy) return 'Unknown';
    if (accuracy <= 50) return 'High';
    if (accuracy <= 200) return 'Medium';
    return 'Low';
  };

  return (
    <LocationContext.Provider
      value={{
        city: city || 'Mumbai',
        setCity,
        isDetecting,
        cities: INDIAN_CITIES,
        detectLocation,
        locationError,
        accuracy,
        accuracyLevel: getAccuracyLevel(),
        lastUpdated,
        permissionState,
        coordinates,
        locationHistory,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
