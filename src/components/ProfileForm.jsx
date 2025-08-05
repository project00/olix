// components/ProfileForm.jsx
import { useState, useEffect } from 'react';
import { FiUser, FiMapPin, FiPhone, FiMail, FiBook } from 'react-icons/fi';
import { profileService, geoService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ProfileForm = ({ onProfileCreated }) => {
  const { user } = useAuth();
  const isOfficina = user?.role === 2;

  const [formData, setFormData] = useState({
    ragione_sociale: '',
    cognome: '',
    nome: '',
    indirizzo: '',
    citta: '',
    provincia: '',
    cap: '',
    latitudine: '',
    longitudine: '',
    piva: '',
    codice_fiscale: '',
    sdi: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);

  // Al caricamento iniziale, genera un codice cliente per utenti non officina
  useEffect(() => {
    if (!isOfficina && !formData.piva) {
      // Genera un numero casuale tra 1 e 9999 e lo formatta con zeri iniziali
      const randomNum = Math.floor(Math.random() * 9999) + 1;
      const paddedNum = randomNum.toString().padStart(4, '0');
      setFormData(prev => ({
        ...prev,
        piva: `Cliente${paddedNum}`
      }));
    }
  }, [isOfficina, formData.piva]);

  // Aggiorna il form quando cambia l'indirizzo o la città
  useEffect(() => {
    const updateGeoLocation = async () => {
      const { indirizzo, citta } = formData;

      if (indirizzo && citta && !searchingLocation) {
        setSearchingLocation(true);

        try {
          // Cerca la geolocalizzazione dell'indirizzo
          const searchQuery = `${indirizzo}, ${citta}`;
          const location = await geoService.searchCity(searchQuery);

          if (location) {
            setFormData(prev => ({
              ...prev,
              latitudine: location.lat,
              longitudine: location.lon
            }));
          }
        } catch (error) {
          console.error('Errore nella geolocalizzazione:', error);
        } finally {
          setSearchingLocation(false);
        }
      }
    };

    const timeoutId = setTimeout(updateGeoLocation, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.indirizzo, formData.citta, searchingLocation]);

  const validateForm = () => {
    const newErrors = {};

    if (isOfficina) {
      if (!formData.ragione_sociale) {
        newErrors.ragione_sociale = 'Ragione sociale obbligatoria';
      }

      if (!formData.piva || formData.piva.length !== 11) {
        newErrors.piva = 'Partita IVA obbligatoria (11 caratteri)';
      }
    } else {
      if (!formData.nome) {
        newErrors.nome = 'Nome obbligatorio';
      }

      if (!formData.cognome) {
        newErrors.cognome = 'Cognome obbligatorio';
      }

      if (!formData.codice_fiscale || formData.codice_fiscale.length !== 16) {
        newErrors.codice_fiscale = 'Codice fiscale obbligatorio (16 caratteri)';
      }

      // Per utenti non officina, verifica che piva sia nel formato Cliente#### (11 caratteri)
      if (!formData.piva || formData.piva.length !== 11 || !formData.piva.startsWith('Cliente')) {
        // Qui non generiamo un errore visibile, ma assicuriamo che il valore sia corretto
        const randomNum = Math.floor(Math.random() * 9999) + 1;
        const paddedNum = randomNum.toString().padStart(4, '0');
        setFormData(prev => ({
          ...prev,
          piva: `Cliente${paddedNum}`
        }));
      }
    }

    if (!formData.indirizzo) {
      newErrors.indirizzo = 'Indirizzo obbligatorio';
    }

    if (!formData.citta) {
      newErrors.citta = 'Città obbligatoria';
    }

    if (!formData.provincia || formData.provincia.length !== 2) {
      newErrors.provincia = 'Provincia obbligatoria (2 caratteri)';
    }

    if (!formData.cap || formData.cap.length !== 5) {
      newErrors.cap = 'CAP obbligatorio (5 caratteri)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Aggiungi data consenso
      const dataToSend = {
        ...formData,
        consenso_privacy: true,
        data_consenso: new Date()
      };

      await profileService.createProfile(dataToSend);
      onProfileCreated?.();
    } catch (error) {
      console.error('Errore nella creazione del profilo:', error);
      setErrors({
        general: error.response?.data?.error || 'Errore nella creazione del profilo'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">
        {isOfficina ? 'Dati Officina' : 'Dati Personali'}
      </h2>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Prima riga */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isOfficina ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ragione Sociale *
              </label>
              <div className="relative">
                <FiBook className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  name="ragione_sociale"
                  value={formData.ragione_sociale}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                    errors.ragione_sociale ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.ragione_sociale && (
                <p className="text-red-500 text-sm mt-1">{errors.ragione_sociale}</p>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                      errors.nome ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.nome && (
                  <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cognome *
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="cognome"
                    value={formData.cognome}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                      errors.cognome ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.cognome && (
                  <p className="text-red-500 text-sm mt-1">{errors.cognome}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Indirizzo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Indirizzo *
          </label>
          <div className="relative">
            <FiMapPin className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              name="indirizzo"
              value={formData.indirizzo}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                errors.indirizzo ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Via, numero civico"
            />
          </div>
          {errors.indirizzo && (
            <p className="text-red-500 text-sm mt-1">{errors.indirizzo}</p>
          )}
        </div>

        {/* Città, Provincia, CAP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Città *
            </label>
            <input
              type="text"
              name="citta"
              value={formData.citta}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg ${
                errors.citta ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.citta && (
              <p className="text-red-500 text-sm mt-1">{errors.citta}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provincia (2 lettere) *
            </label>
            <input
              type="text"
              name="provincia"
              value={formData.provincia}
              onChange={handleChange}
              maxLength={2}
              className={`w-full px-4 py-2 border rounded-lg ${
                errors.provincia ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Es: MI"
            />
            {errors.provincia && (
              <p className="text-red-500 text-sm mt-1">{errors.provincia}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CAP *
            </label>
            <input
              type="text"
              name="cap"
              value={formData.cap}
              onChange={handleChange}
              maxLength={5}
              className={`w-full px-4 py-2 border rounded-lg ${
                errors.cap ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Es: 20100"
            />
            {errors.cap && (
              <p className="text-red-500 text-sm mt-1">{errors.cap}</p>
            )}
          </div>
        </div>

        {/* Coordinate geografiche */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Latitudine (auto)
            </label>
            <input
              type="text"
              name="latitudine"
              value={formData.latitudine}
              readOnly
              className="w-full px-4 py-2 border rounded-lg bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Longitudine (auto)
            </label>
            <input
              type="text"
              name="longitudine"
              value={formData.longitudine}
              readOnly
              className="w-full px-4 py-2 border rounded-lg bg-gray-100"
            />
          </div>
        </div>

        {/* Dati fiscali */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isOfficina ? 'Partita IVA *' : 'Codice Fiscale *'}
            </label>
            <input
              type="text"
              name={isOfficina ? 'piva' : 'codice_fiscale'}
              value={isOfficina ? formData.piva : formData.codice_fiscale}
              onChange={handleChange}
              maxLength={isOfficina ? 11 : 16}
              className={`w-full px-4 py-2 border rounded-lg ${
                errors[isOfficina ? 'piva' : 'codice_fiscale'] ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors[isOfficina ? 'piva' : 'codice_fiscale'] && (
              <p className="text-red-500 text-sm mt-1">
                {errors[isOfficina ? 'piva' : 'codice_fiscale']}
              </p>
            )}
          </div>

          {isOfficina && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Codice SDI
              </label>
              <input
                type="text"
                name="sdi"
                value={formData.sdi}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Campo piva nascosto per clienti non officina */}
        {!isOfficina && (
          <input
            type="hidden"
            name="piva"
            value={formData.piva}
          />
        )}

        {/* Consenso privacy */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="privacy"
            checked={true}
            readOnly
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="privacy" className="ml-2 block text-sm text-gray-700">
            Accetto il trattamento dei dati personali secondo la Privacy Policy
          </label>
        </div>

        {/* Pulsante di invio */}
        <div>
          <button
            type="submit"
            disabled={loading || searchingLocation}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center"
          >
            {loading ? 'Salvataggio in corso...' : 'Salva Profilo'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileForm;
