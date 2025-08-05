// pages/BookingsPage.jsx
import { useState, useEffect } from 'react';
import { FiCalendar, FiCheck, FiX } from 'react-icons/fi';
import Header from '../components/Header';
import { bookingService } from '../services/api';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadBookings = async () => {
      setLoading(true);
      try {
        const response = await bookingService.getShopBookings();
        setBookings(response.data || []);
      } catch (error) {
        console.error('Errore nel caricamento delle prenotazioni:', error);
        setError('Impossibile caricare le prenotazioni. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };
    
    loadBookings();
  }, []);
  
  // Gestione dell'aggiornamento dello stato della prenotazione
  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus);
      
      // Aggiorna lo stato localmente
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, stato: newStatus } : booking
      ));
    } catch (error) {
      console.error('Errore nell\'aggiornamento dello stato:', error);
      alert('Errore nell\'aggiornamento dello stato. Riprova più tardi.');
    }
  };
  
  // Conversione dello stato numerico a testo
  const getStatusText = (status) => {
    switch (status) {
      case 0: return { text: 'In attesa', color: 'bg-yellow-100 text-yellow-800' };
      case 1: return { text: 'Confermata', color: 'bg-green-100 text-green-800' };
      case 2: return { text: 'Completata', color: 'bg-blue-100 text-blue-800' };
      case 3: return { text: 'Annullata', color: 'bg-red-100 text-red-800' };
      default: return { text: 'Sconosciuto', color: 'bg-gray-100 text-gray-800' };
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto p-4 mt-6">
        <h1 className="text-2xl font-bold mb-6">Gestione Prenotazioni</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <FiCalendar className="mx-auto text-gray-400 text-5xl mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  Nessuna prenotazione trovata
                </h2>
                <p className="text-gray-500">
                  Non ci sono ancora prenotazioni per i tuoi servizi.
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Ora
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servizio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking) => {
                    const statusInfo = getStatusText(booking.stato);
                    return (
                      <tr key={booking.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(booking.data).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.ora}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {booking.userId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {booking.offerName || 'Servizio generico'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.costo && `€${booking.costo.toFixed(2)}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.color}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {booking.stato === 0 && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateStatus(booking.id, 1)}
                                className="text-green-600 hover:text-green-900 flex items-center"
                              >
                                <FiCheck className="mr-1" />
                                Conferma
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, 3)}
                                className="text-red-600 hover:text-red-900 flex items-center"
                              >
                                <FiX className="mr-1" />
                                Rifiuta
                              </button>
                            </div>
                          )}
                          {booking.stato === 1 && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateStatus(booking.id, 2)}
                                className="text-blue-600 hover:text-blue-900 flex items-center"
                              >
                                <FiCheck className="mr-1" />
                                Completa
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(booking.id, 3)}
                                className="text-red-600 hover:text-red-900 flex items-center"
                              >
                                <FiX className="mr-1" />
                                Annulla
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;