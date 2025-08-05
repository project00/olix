import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OffersList = ({ offers, loading }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleBookingClick = (offerId) => {
    if (!isAuthenticated) {
      alert('È necessario accedere per effettuare una prenotazione.');
      localStorage.setItem('pendingBookingOffer', offerId);
      document.querySelector('button[onclick*="setShowLoginModal"]').click();
    } else {
      navigate(`/booking/${offerId}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!offers || offers.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        <p className="text-center text-gray-500 py-4">
          Nessuna offerta trovata con i filtri attuali.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      <h3 className="font-bold text-lg mb-3">Offerte disponibili ({offers.length})</h3>
      <div className="space-y-3">
        {offers.map((offer) => {
          // Estrai le offerte dal workshop se presenti
          const workshopOffers = offer.offerte || [];
          
          return (
            <div key={offer.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-blue-700">{offer.ragione_sociale || offer.name}</h4>
              <p className="text-gray-600 text-sm">{offer.indirizzo}</p>
              <p className="text-sm mt-1">Distanza: {Math.round(offer.distance * 10) / 10} km</p>
              
              {offer.length > 0 ? (
                <div className="mt-2">
                  <p className="text-sm font-medium">Offerte disponibili:</p>
                  <div className="mt-1 space-y-2">
                    {workshopOffers.map(workshopOffer => (
                      <div key={workshopOffer.id} className="border-t pt-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{offer.descrizione}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              <span className="mr-2">Cambio: {workshopOffer.tipo_offerta}</span>
                              {workshopOffer.cilindrata && (
                                <span>Cilindrata: {workshopOffer.cilindrata}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleBookingClick(workshopOffer.id)}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded"
                          >
                            Prenoti
                          </button>
                        </div>
                        
                        {/* Mostra i servizi inclusi nell'offerta */}
                        {workshopOffer.servizi && workshopOffer.servizi.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {workshopOffer.servizi.map(servizio => (
                              <span key={servizio.id} className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">
                                {servizio.nome}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-2">Nessuna offerta specifica disponibile</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OffersList;