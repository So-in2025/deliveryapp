import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, Navigation, Check, X } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { motion, AnimatePresence } from 'motion/react';

// Fix for default marker icons in Leaflet with React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapSelectorProps {
  initialLocation?: { lat: number; lng: number };
  onSelect: (address: string, location: { lat: number; lng: number }) => void;
  onClose: () => void;
}

const LocationMarker = ({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
};

const ChangeView = ({ center }: { center: L.LatLngExpression }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    try {
      map.setView(center);
    } catch (e) {
      // Map instance might be stale
    }
  }, [center, map]);
  return null;
};

export const MapSelector: React.FC<MapSelectorProps> = ({ initialLocation, onSelect, onClose }) => {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLocation ? new L.LatLng(initialLocation.lat, initialLocation.lng) : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<unknown[]>([]);

  const defaultCenter: L.LatLngExpression = initialLocation 
    ? [initialLocation.lat, initialLocation.lng] 
    : [-34.6037, -58.3816]; // Buenos Aires as default

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Reverse Geocoding: Get address from coordinates
  const getAddressFromCoords = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
          setPosition(newPos);
        },
        (error) => {
          if (error.code !== 3) {
            console.error('Error getting location:', error);
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 10000
        }
      );
    }
  }, []);

  useEffect(() => {
    if (position) {
      getAddressFromCoords(position.lat, position.lng);
    } else {
      getCurrentLocation();
    }
  }, [position, getAddressFromCoords, getCurrentLocation]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: { lat: string; lon: string; display_name: string }) => {
    const newPos = new L.LatLng(parseFloat(result.lat), parseFloat(result.lon));
    setPosition(newPos);
    setAddress(result.display_name);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleConfirm = () => {
    if (position) {
      const finalAddress = address || `Ubicación: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
      onSelect(finalAddress, { lat: position.lat, lng: position.lng });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-stone-900 w-full max-w-2xl h-[80vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10"
      >
        {/* Header */}
        <div className="p-4 border-b border-amber-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
          <h3 className="font-black text-stone-900 dark:text-white uppercase tracking-tight">Seleccionar Ubicación</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
            <X size={20} className="text-stone-500 dark:text-stone-400" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 space-y-2 relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <Input 
                placeholder="Buscar dirección..." 
                className="pl-10 dark:text-white text-stone-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? '...' : 'Buscar'}
            </Button>
          </div>

          {/* Search Results Dropdown */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-4 right-4 top-full mt-1 bg-white dark:bg-stone-800 border border-amber-200 dark:border-stone-700 rounded-2xl shadow-xl z-[120] max-h-60 overflow-y-auto"
              >
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectSearchResult(result)}
                    className="w-full p-3 text-left hover:bg-stone-50 dark:hover:bg-stone-700/50 flex items-start gap-3 border-b border-stone-50 dark:border-stone-700 last:border-0"
                  >
                    <MapPin size={16} className="text-brand-500 mt-1 shrink-0" />
                    <span className="text-sm text-stone-600 dark:text-stone-300 line-clamp-2">{result.display_name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer 
            center={defaultCenter} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
            {position && <ChangeView center={position} />}
          </MapContainer>

          {/* Floating Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
            <button 
              onClick={getCurrentLocation}
              className="p-3 bg-white dark:bg-stone-800 rounded-2xl shadow-lg border border-amber-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:scale-105 transition-transform active:scale-95"
            >
              <Navigation size={20} />
            </button>
          </div>
        </div>

        {/* Footer Info & Confirm */}
        <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-amber-200 dark:border-stone-800">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-brand-500/10 rounded-xl">
              <MapPin size={20} className="text-brand-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-black text-stone-400 tracking-widest mb-0.5">Dirección Seleccionada</p>
              <p className="text-sm text-stone-700 dark:text-stone-200 font-medium line-clamp-2">
                {address || 'Toca el mapa para seleccionar una ubicación'}
              </p>
            </div>
          </div>
          <Button 
            className="w-full h-12 rounded-2xl font-black uppercase tracking-widest"
            disabled={!position || !address}
            onClick={handleConfirm}
          >
            <Check size={20} className="mr-2" />
            Confirmar Ubicación
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
