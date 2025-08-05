import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import MapView from './components/MapView';
import Header from './components/Header';
import Filters from './components/Filters';
import OffersList from './components/OffersList';
import { fetchOffers, profileService } from './services/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProfileForm from './components/ProfileForm';
import ServicesPage from './pages/ServicesPage';
import OffersPage from './pages/OffersPage';
import BookingsPage from './pages/BookingsPage';
import ProfilePage from './pages/ProfilePage';
import BookingPage from './pages/BookingPage';
import AvailabilityPage from './pages/AvailabilityPage';
import UsersManagementPage from './pages/UsersManagementPage';
import RolesManagementPage from './pages/RolesManagementPage';

// Componente privato che verifica l'autenticazione
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return isAuthenticated ? children : <Navigate to="/" />;
};

// Componente che verifica se l'utente ha un profilo anagrafica
const ProfileRequired = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [hasProfile, setHasProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isAuthenticated) {
      const checkProfile = async () => {
        try {
          const response = await profileService.getProfile();
          setHasProfile(response.data.exists);
        } catch (error) {
          console.error('Errore nel recupero del profilo:', error);
          setHasProfile(false);
        } finally {
          setLoading(false);
        }
      };
      
      checkProfile();
    }
  }, [isAuthenticated]);
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }
  
  return hasProfile ? children : <Navigate to="/create-profile" />;
};

// HomePage component con mappa e offerte
const HomePage = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationFilters, setLocationFilters] = useState(null);
  const [filters, setFilters] = useState({});
  const [showOffersList, setShowOffersList] = useState(false);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [allOffers, setAllOffers] = useState([]);

  // Combina i filtri di localizzazione con gli altri filtri
  const handleFilterChange = (newFilters) => {
    if (locationFilters) {
      // Preveniamo loop di aggiornamento verificando se i filtri sono effettivamente cambiati
      const newRadius = newFilters.maxDistance;
      const oldRadius = locationFilters.radius;
      
      // Aggiorna i filtri combinati in un'unica operazione
      const combinedFilters = {
        ...locationFilters,
        ...newFilters
      };
      
      // Aggiorna entrambi gli stati in un modo che previene aggiornamenti ciclici
      setFilters(combinedFilters);
      
      // Aggiorna locationFilters solo se maxDistance è effettivamente cambiato
      if (newRadius !== oldRadius) {
        setLocationFilters(prev => ({
          ...prev,
          radius: newRadius
        }));
      }
    }
  };

  // Aggiorna i filtri di localizzazione quando cambia la posizione
  const handleLocationChange = (location) => {
    // Usa un callback per evitare problemi con il closure
    setLocationFilters(prev => {
      // Se i valori sono gli stessi, non aggiornare per evitare re-render
      if (prev && 
          prev.lat === location.lat && 
          prev.lon === location.lon && 
          prev.radius === location.radius) {
        return prev;
      }
      return location;
    });
    
    // Aggiorna anche i filtri, ma solo se la location è effettivamente cambiata
    setFilters(prevFilters => {
      // Verifica se qualcosa è effettivamente cambiato
      if (prevFilters.lat === location.lat && 
          prevFilters.lon === location.lon && 
          prevFilters.radius === location.radius) {
        return prevFilters;
      }
      return {
        ...prevFilters,
        ...location
      };
    });
  };

  // Carica le offerte quando cambiano i filtri
  useEffect(() => {
    const loadOffers = async () => {
      console.log('1. Iniziando caricamento offerte con filtri:', filters);
      setLoading(true);
      try {
        console.log('2. Chiamata API con filtri:', filters);
        const response = await fetchOffers(filters);
        console.log('3. Risposta ricevuta:', response);
        
        // fetchOffers ora restituisce sempre un array
        console.log('4. Impostazione offerte:', response);
        setOffers(response);
        setAllOffers(response);
      } catch (error) {
        console.error('4. Errore nel caricamento:', error);
        setOffers([]);
        setAllOffers([]);
      } finally {
        console.log('5. Fine caricamento');
        setLoading(false);
      }
    };

    if (filters.lat && filters.lon && filters.radius) {
      console.log('0. Filtri validi, avvio caricamento');
      loadOffers();
    } else {
      console.log('0. Filtri non validi:', filters);
    }
  }, [filters]);

  // Toggle la visualizzazione dell'elenco delle offerte
  const toggleOffersList = () => {
    setShowOffersList(prev => !prev);
  };

  const handleFilter = (filters) => {
    if (!allOffers) return;

    let filtered = [...allOffers];

    // Filtra per distanza
    filtered = filtered.filter(offer => 
      offer.distance <= filters.maxDistance
    );

    // Filtra per tipo di offerta se selezionata
    if (filters.selectedOffer) {
      filtered = filtered.filter(officina => 
        officina.Offerta.some(offerta => 
          offerta.descrizione === filters.selectedOffer
        )
      );
    }

    setFilteredOffers(filtered);
  };

  return (
    <div className="relative">
      <Header />
      <Filters onFilter={handleFilter} offers={allOffers} />
      <MapView 
        offers={filteredOffers}
        onLocationChange={handleLocationChange}
      />
      
      {/* Pulsante per mostrare/nascondere l'elenco delle offerte */}
      <button
        className="absolute top-16 right-4 z-[1050] bg-white p-2 rounded-lg shadow-lg hover:bg-gray-50"
        onClick={toggleOffersList}
      >
        {showOffersList ? 'Nascondi offerte' : 'Mostra offerte'}
      </button>
      
      {/* Elenco delle offerte disponibili */}
      {showOffersList && (
        <div className="absolute top-28 right-4 z-[1040] w-80 max-h-[calc(100vh-150px)] overflow-hidden">
          <OffersList offers={filteredOffers} loading={loading} />
        </div>
      )}
    </div>
  );
};

// Componente per la creazione del profilo anagrafica
const CreateProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleProfileCreated = () => {
    // Reindirizza l'utente alla home o al profilo dopo la creazione
    if (user?.role === 2) {
      navigate('/services'); // Officina
    } else {
      navigate('/'); // Utente normale
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <Header />
      <div className="mt-6">
        <h1 className="text-2xl font-bold mb-4">Completa il tuo profilo</h1>
        <p className="text-gray-600 mb-6">
          Per utilizzare il servizio, è necessario completare il tuo profilo.
        </p>
        <ProfileForm onProfileCreated={handleProfileCreated} />
      </div>
    </div>
  );
};

// Componente che verifica se l'utente è un amministratore
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }
  
  // Verifica se l'utente è autenticato e ha il ruolo di admin (1)
  if (isAuthenticated && user?.role === 1) {
    return children;
  }
  
  return <Navigate to="/" />;
};

// App principale con Routes, ma senza Router
const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* Route protette che richiedono autenticazione */}
        <Route path="/profile" element={
          <PrivateRoute>
            <ProfileRequired>
              <ProfilePage />
            </ProfileRequired>
          </PrivateRoute>
        } />
        
        <Route path="/create-profile" element={
          <PrivateRoute>
            <CreateProfilePage />
          </PrivateRoute>
        } />
        
        {/* Route solo per officine */}
        <Route path="/services" element={
          <PrivateRoute>
            <ProfileRequired>
              <ServicesPage />
            </ProfileRequired>
          </PrivateRoute>
        } />
        
        <Route path="/offers" element={
          <PrivateRoute>
            <ProfileRequired>
              <OffersPage />
            </ProfileRequired>
          </PrivateRoute>
        } />
        
        <Route path="/bookings" element={
          <PrivateRoute>
            <ProfileRequired>
              <BookingsPage />
            </ProfileRequired>
          </PrivateRoute>
        } />
        
        <Route path="/booking/:offerId" element={
          <PrivateRoute>
            <ProfileRequired>
              <BookingPage />
            </ProfileRequired>
          </PrivateRoute>
        } />
        
        <Route path="/availability" element={
          <PrivateRoute>
            <ProfileRequired>
              <AvailabilityPage />
            </ProfileRequired>
          </PrivateRoute>
        } />
        
        {/* Route solo per amministratori */}
        <Route path="/admin/users" element={
          <AdminRoute>
            <UsersManagementPage />
          </AdminRoute>
        } />
        
        <Route path="/admin/roles" element={
          <AdminRoute>
            <RolesManagementPage />
          </AdminRoute>
        } />
      </Routes>
    </AuthProvider>
  );
};

export default App;
