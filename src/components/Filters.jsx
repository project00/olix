import { useState, useEffect, useRef, useMemo } from 'react';
import { offerService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FiX } from 'react-icons/fi';

const Filters = ({ onFilter, offers }) => {
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState({
    date: '',
    serviceType: '',
    maxDistance: 10,  // Valore predefinito di 10km come richiesto
    maxPrice: 1000,
    offerType: '',
    selectedOffer: ''  // Nuovo stato per l'offerta selezionata
  });
  const [offerTypes, setOfferTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const filtersRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  // Estrai le offerte uniche nel raggio selezionato
  const availableOffers = useMemo(() => {
    if (!offers) return [];
    
    // Raccogli tutte le offerte dalle officine nel raggio
    const allOffers = offers.flatMap(officina => 
      officina.Offerta.map(offerta => ({
        id: offerta.id,
        descrizione: offerta.descrizione,
        prezzo: offerta.prezzo
      }))
    );

    // Rimuovi i duplicati basandoti sulla descrizione
    const uniqueOffers = Array.from(
      new Map(allOffers.map(offer => [offer.descrizione, offer])).values()
    );

    return uniqueOffers.sort((a, b) => a.descrizione.localeCompare(b.descrizione));
  }, [offers]);

  useEffect(() => {
    const fetchOfferTypes = async () => {
      setLoading(true);
      setError(null);
      try {
        // Verifica se l'utente è autenticato
        if (!isAuthenticated) {
          // Se non autenticato, usa i dati di default
          setOfferTypes([
            { id: 1, nome: 'Cambio olio' },
            { id: 2, nome: 'Tagliando' },
            { id: 3, nome: 'Freni' },
            { id: 4, nome: 'Pneumatici' }
          ]);
          return;
        }

        // Usa i tipi di offerta predefiniti invece di chiamare l'API
        // poiché il backend non ha un endpoint specifico per i tipi di offerta
        setOfferTypes([
          { id: 1, nome: 'Cambio olio' },
          { id: 2, nome: 'Tagliando' },
          { id: 3, nome: 'Freni' },
          { id: 4, nome: 'Pneumatici' }
        ]);
      } catch (error) {
        console.error("Errore nel caricamento dei tipi di offerta:", error);
        setError('Errore nel caricamento dei servizi');
        // Usa i dati di fallback in caso di errore
        setOfferTypes([
          { id: 1, nome: 'Cambio olio' },
          { id: 2, nome: 'Tagliando' },
          { id: 3, nome: 'Freni' },
          { id: 4, nome: 'Pneumatici' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferTypes();
  }, [isAuthenticated]);

  // Gestisce il movimento della mappa quando il menu dell'header è aperto
  useEffect(() => {
    const handleHeaderMenuOpen = () => {
      const headerDropdown = document.querySelector('.absolute.right-0.mt-2.w-64.bg-white');
      if (headerDropdown && filtersRef.current) {
        filtersRef.current.style.top = '150px'; // Sposta il pannello filtri in basso
      } else if (filtersRef.current) {
        filtersRef.current.style.top = '0'; // Ripristina la posizione originale
      }
    };

    // Osserva le modifiche al DOM per rilevare quando il menu viene aperto
    const observer = new MutationObserver(handleHeaderMenuOpen);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));

    // Notifica il componente parent del cambio filtri
    onFilter({
      ...filters,
      [name]: value
    });

    // Se è cambiato il raggio, invia un evento custom
    if (name === 'maxDistance') {
      window.dispatchEvent(new CustomEvent('radiusChanged', {
        detail: { radius: parseInt(value) }
      }));
    }
  };

  return (
    <>
      <div 
        ref={filtersRef} 
        className={`absolute top-0 left-0 z-[1000] bg-white p-4 m-4 rounded-lg shadow-lg w-72 transition-all duration-300 ${
          isVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg">Filtri</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Chiudi pannello filtri"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data:</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              onChange={e => setFilters({...filters, date: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Distanza Massima (km)
            </label>
            <input
              type="range"
              name="maxDistance"
              min="1"
              max="50"
              value={filters.maxDistance}
              onChange={handleFilterChange}
              className="w-full"
            />
            <span className="text-sm text-gray-500">1{filters.maxDistance} km</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tipo di Offerta
            </label>
            <select
              name="selectedOffer"
              value={filters.selectedOffer}
              onChange={handleFilterChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Tutte le offerte</option>
              {availableOffers.map(offer => (
                <option key={offer.id} value={offer.descrizione}>
                  {offer.descrizione} - €{offer.prezzo}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onFilter(filters)}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Applica Filtri
          </button>
        </div>
      </div>

      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
          aria-label="Apri pannello filtri"
        >
          Filtri
        </button>
      )}
    </>
  );
};

export default Filters;
