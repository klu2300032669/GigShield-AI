import { useState, useRef, useEffect } from 'react';
import { useLocation } from '../context/LocationContext.jsx';
import { MapPin, ChevronDown, Search, Navigation, Loader2 } from 'lucide-react';

function CitySelector() {
  const { city, setCity, cities, isDetecting, detectLocation } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const filteredCities = cities.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (selectedCity) => {
    setCity(selectedCity);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="city-selector" ref={dropdownRef}>
      <button
        className="city-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Current city: ${city}. Click to change.`}
      >
        <MapPin size={14} className="city-selector-icon" />
        <span className="city-selector-label">{city}</span>
        <ChevronDown size={12} className={`city-selector-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="city-selector-dropdown" role="listbox" aria-label="Select your city">
          <div className="city-selector-search">
            <Search size={14} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="city-selector-search-input"
            />
          </div>

          <button
            className="city-selector-detect"
            onClick={detectLocation}
            disabled={isDetecting}
          >
            {isDetecting ? <Loader2 size={14} className="spin-icon" /> : <Navigation size={14} />}
            {isDetecting ? 'Detecting...' : 'Auto-detect location'}
          </button>

          <div className="city-selector-list">
            {filteredCities.map((c) => (
              <button
                key={c}
                className={`city-selector-option ${c === city ? 'active' : ''}`}
                onClick={() => handleSelect(c)}
                role="option"
                aria-selected={c === city}
              >
                <MapPin size={12} />
                {c}
                {c === city && <span className="city-selector-check">✓</span>}
              </button>
            ))}
            {filteredCities.length === 0 && (
              <div className="city-selector-empty">No cities match "{search}"</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CitySelector;
