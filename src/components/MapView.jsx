import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { useSearchParams, useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import CitySearchForm from './CitySearchForm';
import { useAuth } from '../contexts/AuthContext';
import officinaIcon from '../assets/officina.png';  // Importa l'icona

// Fix per le icone di Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Icona personalizzata per il marker dell'utente
const carIcon = new L.Icon({
    iconUrl: "https://autofaidate.net/wp-content/uploads/2024/06/favicon.png",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35],
});

// Icona personalizzata per le officine
const workshopIcon = new L.Icon({
    iconUrl: officinaIcon,
    iconSize: [40, 20],
    iconAnchor: [18, 36],
    popupAnchor: [0, -32],
});

// Componente che aggiorna la vista della mappa solo quando cambia la posizione
const MapController = ({ position }) => {
    const map = useMap();
    const [initialPositionSet, setInitialPositionSet] = useState(false);
    const [lastPosition, setLastPosition] = useState(null);
    
    useEffect(() => {
        // Se non abbiamo ancora una posizione, non fare nulla
        if (!position) return;
        
        // Se è la prima impostazione della posizione o se è cambiata in modo significativo (ricerca di nuova città)
        if (!initialPositionSet || (lastPosition && 
            (Math.abs(position[0] - lastPosition[0]) > 0.01 || 
             Math.abs(position[1] - lastPosition[1]) > 0.01))) {
            map.setView(position, 13);
            setInitialPositionSet(true);
            setLastPosition(position);
        }
    }, [map, position, initialPositionSet, lastPosition]);
    
    return null;
};

const MapView = ({ offers, onLocationChange }) => {
    const defaultPosition = [41.9028, 12.4964]; // Roma
    const [userPosition, setUserPosition] = useState(null);
    const [showSearchForm, setShowSearchForm] = useState(false);
    const [geoError, setGeoError] = useState(false);
    const [searchParams] = useSearchParams();
    const [initialLocationSet, setInitialLocationSet] = useState(false);
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [radius, setRadius] = useState(10);
    const mapRef = useRef(null);
    const [searchRadius, setSearchRadius] = useState(10000); // 10km in metri
    
    // Geolocalizzazione solo all'avvio
    useEffect(() => {
        // Se abbiamo già una posizione (da URL o geolocalizzazione precedente), non fare nulla
        if (initialLocationSet) return;
        
        const urlLat = searchParams.get('lat');
        const urlLon = searchParams.get('lon');
        
        // Se ci sono parametri URL, usa quelli
        if (urlLat && urlLon) {
            const position = [parseFloat(urlLat), parseFloat(urlLon)];
            setUserPosition(position);
            onLocationChange({
                lat: parseFloat(urlLat),
                lon: parseFloat(urlLon),
                radius: searchParams.get('radius') ? parseInt(searchParams.get('radius')) : 10
            });
            setInitialLocationSet(true);
            return;
        }
        
        // Altrimenti, prova la geolocalizzazione
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setUserPosition([latitude, longitude]);
                    onLocationChange({
                        lat: latitude,
                        lon: longitude,
                        radius: 10
                    });
                    setInitialLocationSet(true);
                },
                (err) => {
                    console.error("Errore nella geolocalizzazione:", err);
                    setGeoError(true);
                    setShowSearchForm(true);
                }
            );
        } else {
            setGeoError(true);
            setShowSearchForm(true);
        }
    }, []); // Esegui solo all'avvio

    // Gestione ricerca città
    const handleLocationFound = (location) => {
        const newPosition = [location.lat, location.lon];
        setUserPosition(newPosition);
        setInitialLocationSet(true);
        
        onLocationChange({
            lat: location.lat,
            lon: location.lon,
            radius: searchRadius / 1000
        });
        
        setShowSearchForm(false);
    };

    // Aggiungi questo nuovo useEffect per ascoltare l'evento radiusChanged
    useEffect(() => {
        const handleRadiusChange = (event) => {
            const newRadius = event.detail.radius;
            setRadius(newRadius);
            
            // Aggiorna anche i parametri URL
            const params = new URLSearchParams(window.location.search);
            params.set('radius', newRadius);
            window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
            
            // Notifica il componente parent del cambio di raggio
            if (userPosition) {
                onLocationChange && onLocationChange({
                    lat: userPosition[0],
                    lon: userPosition[1],
                    radius: newRadius
                });
            }
        };

        window.addEventListener('radiusChanged', handleRadiusChange);
        return () => {
            window.removeEventListener('radiusChanged', handleRadiusChange);
        };
    }, [userPosition, onLocationChange]);

    // Precomputa il raggio una volta sola, non dentro l'handler
    const currentRadius = radius;
    
    // Gestisce il click su "Prenota"
    const handleBookingClick = (offerId) => {
        if (!isAuthenticated) {
            // Reindirizza al login se l'utente non è autenticato
            alert('È necessario accedere per effettuare una prenotazione.');
            // Salva l'offerta che l'utente voleva prenotare nel localStorage
            localStorage.setItem('pendingBookingOffer', offerId);
            document.querySelector('button[onclick*="setShowLoginModal"]').click();
        } else {
            // Vai direttamente alla pagina di prenotazione
            navigate(`/booking/${offerId}`);
        }
    };

    // Aggiungi controllo per le coordinate delle offerte
    const validOffers = offers.filter(offer => {
        const isValid = offer && 
                       typeof offer.latitudine === 'number' && 
                       typeof offer.longitudine === 'number' &&
                       !isNaN(offer.latitudine) && 
                       !isNaN(offer.longitudine);
        
        if (!isValid) {
            console.warn('Offerta con coordinate non valide:', offer);
        }
        return isValid;
    });

    return (
        <div className="relative h-screen w-full">
            {/* Mostra il form di ricerca città se la geolocalizzazione fallisce o l'utente lo richiede */}
            {showSearchForm && (
                <div className="absolute top-0 left-0 z-[1100] w-full h-full flex items-center justify-center bg-black bg-opacity-50">
                    <CitySearchForm 
                        onLocationFound={handleLocationFound} 
                        onClose={() => setShowSearchForm(false)} 
                    />
                </div>
            )}
            
            {/* Pulsante per mostrare il form di ricerca */}
            {!showSearchForm && (
                <button 
                    onClick={() => setShowSearchForm(true)}
                    className="absolute top-4 right-4 z-[1050] bg-white p-2 rounded-full shadow-lg"
                    title="Cerca località"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </button>
            )}
            
            {/* Mappa */}
            <MapContainer 
                ref={mapRef}
                center={userPosition || defaultPosition} 
                zoom={userPosition ? 13 : 6} 
                className="h-full w-full z-0"
                dragging={true}
                scrollWheelZoom={true}
                doubleClickZoom={true}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                
                {/* Controller per aggiornare la vista della mappa */}
                <MapController position={userPosition} />
                
                {/* Mostra il raggio di ricerca dinamico in base al filtro di distanza */}
                {userPosition && (
                    <Circle 
                        center={userPosition} 
                        radius={radius * 1000} // Usa il nuovo stato radius invece di searchParams
                        pathOptions={{ 
                            fillColor: 'blue', 
                            fillOpacity: 0.05, 
                            color: 'blue', 
                            opacity: 0.3 
                        }} 
                    />
                )}
                
                {/* Marker per la posizione dell'utente */}
                {userPosition && (
                    <Marker position={userPosition} icon={carIcon}>
                        <Popup>📍 Sei qui!</Popup>
                    </Marker>
                )}
                
                {/* Marker per le officine */}
                {validOffers.map((offer) => (
                    <Marker
                        key={offer.id}
                        position={[offer.latitudine, offer.longitudine]}
                        icon={workshopIcon}
                    >
                        <Popup>
                            <div className="p-2 min-w-64">
                                <h3 className="font-bold text-lg font-semibold text-blue-600">{offer.ragione_sociale}</h3>
                                <p className="text-gray-400">{offer.indirizzo}</p>
                                <p className="text-gray-600 mb-2">Distanza: {offer.distance.toFixed(2)} km</p>
                                
                                {/* Mostra tutte le offerte disponibili */}
                                {offer.Offerta && offer.Offerta.length > 0 && (
                                    <div className="mt-2">
                                        <p className="font-medium text-wrap">Offerte disponibili:</p>
                                        {offer.Offerta.map((offerta, index) => (
                                            <div key={offerta.id} className="mt-2 border-t pt-2">
                                                <p><b>{offerta.descrizione}</b> - €{offerta.prezzo} - 
                                                <button 
                                                    onClick={() => handleBookingClick(offerta.id)}
                                                    className="ml-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
                                                >  Prenota
                                                </button></p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapView;