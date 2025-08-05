// components/CitySearchForm.jsx
import { useState } from 'react';
import { FiSearch, FiMapPin } from 'react-icons/fi';
import { geoService } from '../services/api';

const CitySearchForm = ({ onLocationFound, onClose }) => {
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!city.trim()) {
      setError('Inserisci il nome di una città');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const location = await geoService.searchCity(city);
      
      if (location) {
        onLocationFound(location);
        onClose();
      } else {
        setError('Città non trovata');
      }
    } catch (err) {
      console.error('Errore nella ricerca della città:', err);
      setError('Errore nella ricerca della città');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-lg w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <FiMapPin className="mr-2 text-blue-500" />
        Trova servizi nella tua città
      </h2>
      
      <p className="text-gray-600 mb-4">
        Inserisci il nome della tua città per trovare le officine e i servizi disponibili nella tua zona.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Inserisci la città..."
            className={`w-full px-4 py-2 border rounded-lg pl-10 ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center"
        >
          {loading ? 'Ricerca in corso...' : 'Cerca'}
        </button>
      </form>
    </div>
  );
};

export default CitySearchForm;