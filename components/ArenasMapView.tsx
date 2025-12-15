import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Arena } from '../types';
import { MapPin } from 'lucide-react';

// Fix for default Leaflet icons in React
const iconPerson = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface ArenasMapViewProps {
  arenas: Arena[];
}

const ArenasMapView: React.FC<ArenasMapViewProps> = ({ arenas }) => {
  // Center map based on first arena or default to Sao Paulo coordinates
  const centerLat = arenas.length > 0 ? arenas[0].lat : -23.55052;
  const centerLng = arenas.length > 0 ? arenas[0].lng : -46.633308;

  return (
    <div className="h-[500px] w-full bg-slate-200 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={13} 
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {arenas.map(arena => (
          <Marker 
            key={arena.id} 
            position={[arena.lat, arena.lng]} 
            icon={iconPerson}
          >
            <Popup>
              <div className="p-1 min-w-[150px]">
                <h3 className="font-bold text-slate-900 flex items-center gap-1">
                  <span className="text-emerald-600"><MapPin size={14}/></span>
                  {arena.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">{arena.address}</p>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${arena.lat},${arena.lng}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block mt-2 text-xs font-bold text-emerald-600 hover:underline"
                >
                  Abrir no Google Maps
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ArenasMapView;