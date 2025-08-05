// pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { FiUser, FiMapPin, FiMail, FiEdit } from 'react-icons/fi';
import Header from '../components/Header';
import { profileService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ProfileForm from '../components/ProfileForm';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await profileService.getProfile();
        setProfile(response.data.profile);
      } catch (error) {
        console.error('Errore nel caricamento del profilo:', error);
        setError('Impossibile caricare i dati del profilo. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, []);
  
  const handleProfileUpdated = () => {
    // Ricarica il profilo dopo l'aggiornamento
    setIsEditing(false);
    window.location.reload(); // Soluzione semplice per ricaricare tutti i dati
  };
  
  // Formatta l'indirizzo completo
  const formatAddress = (profile) => {
    if (!profile) return '';
    
    const parts = [
      profile.indirizzo,
      profile.cap,
      profile.citta,
      profile.provincia && `(${profile.provincia})`
    ].filter(Boolean);
    
    return parts.join(' ');
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto p-4 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {user?.role === 2 ? 'Profilo Officina' : 'Profilo Utente'}
          </h1>
          
          {!isEditing && profile && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
            >
              <FiEdit className="mr-2" />
              Modifica Profilo
            </button>
          )}
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : isEditing ? (
          <ProfileForm 
            initialData={profile}
            onProfileCreated={handleProfileUpdated}
            onCancel={() => setIsEditing(false)}
          />
        ) : profile ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FiUser className="mr-2 text-blue-500" />
                Informazioni Personali
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user?.role === 2 ? (
                  <div>
                    <div className="text-sm text-gray-500">Ragione Sociale</div>
                    <div className="font-medium">{profile.ragione_sociale || 'Non specificato'}</div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="text-sm text-gray-500">Nome</div>
                      <div className="font-medium">{profile.nome || 'Non specificato'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Cognome</div>
                      <div className="font-medium">{profile.cognome || 'Non specificato'}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FiMapPin className="mr-2 text-blue-500" />
                Indirizzo
              </h2>
              
              <div className="mb-4">
                <div className="font-medium">{formatAddress(profile)}</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-500">Latitudine</div>
                  <div className="font-medium">{profile.latitudine || 'Non specificato'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Longitudine</div>
                  <div className="font-medium">{profile.longitudine || 'Non specificato'}</div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FiMail className="mr-2 text-blue-500" />
                Dati Fiscali
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user?.role === 2 ? (
                  <>
                    <div>
                      <div className="text-sm text-gray-500">Partita IVA</div>
                      <div className="font-medium">{profile.piva || 'Non specificato'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Codice SDI</div>
                      <div className="font-medium">{profile.sdi || 'Non specificato'}</div>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="text-sm text-gray-500">Codice Fiscale</div>
                    <div className="font-medium">{profile.codice_fiscale || 'Non specificato'}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-500">Profilo non trovato. Crea il tuo profilo per utilizzare tutte le funzionalità.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;