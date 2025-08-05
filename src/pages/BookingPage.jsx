// frontend/src/pages/BookingPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiCalendar, FiClock, FiArrowLeft } from 'react-icons/fi';
import Header from '../components/Header';
import { offerService, bookingService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const BookingPage = () => {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  
  // Genera date disponibili (prossimi 15 giorni, escludendo oggi)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 15; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      
      // Escludi le domeniche
      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }
    
    return dates;
  };
  
  // Genera fasce orarie disponibili (8:00 - 18:00, a intervalli di 1 ora)
  const generateTimeSlots = () => {
    const slots = [];
    
    for (let hour = 8; hour <= 17; hour++) {
      const formattedHour = hour.toString().padStart(2, '0');
      slots.push(`${formattedHour}:00`, `${formattedHour}:30`);
    }
    
    return slots;
  };
  
  // Carica i dettagli dell'offerta
  useEffect(() => {
    const fetchOfferDetails = async () => {
      setLoading(true);
      
      try {
        const response = await offerService.getOfferDetails(offerId);
        setOffer(response.data);
        setTimeSlots(generateTimeSlots());
      } catch (error) {
        console.error('Errore nel caricamento dei dettagli offerta:', error);
        setError('Impossibile caricare i dettagli dell\'offerta. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOfferDetails();
  }, [offerId]);
  
  // Gestisce l'invio della prenotazione
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTimeSlot) {
      alert('Seleziona data e orario per continuare.');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Prepara i dati della prenotazione
      const bookingData = {
        offerId: parseInt(offerId),
        userId: user.id,
        date: selectedDate,
        time: selectedTimeSlot,
        // Altri dati necessari...
      };
      
      // Invia la richiesta di prenotazione
      const response = await bookingService.createBooking(bookingData);
      
      // Reindirizza l'utente alla pagina delle prenotazioni
      navigate('/bookings');
      
    } catch (error) {
      console.error('Errore nella creazione della prenotazione:', error);
      alert('Si è verificato un errore durante la prenotazione. Riprova più tardi.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const availableDates = generateAvailableDates();
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto p-4 mt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 mb-4"
        >
          <FiArrowLeft className="mr-2" />
          Torna indietro
        </button>
        
        <h1 className="text-2xl font-bold mb-6">Prenota un servizio</h1>
        
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
            {offer && (
              <div className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">{offer.descrizione || "Servizio"}</h2>
                  {offer.officinaInfo && (
                    <p className="text-gray-600">
                      Presso: {offer.officinaInfo.ragione_sociale}, {offer.officinaInfo.indirizzo}
                    </p>
                  )}
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FiCalendar className="inline mr-2" />
                      Seleziona una data
                    </label>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {availableDates.map((date, index) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = dateStr === selectedDate;
                        
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setSelectedDate(dateStr)}
                            className={`p-3 rounded-lg border ${
                              isSelected
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                            }`}
                          >
                            <div className="font-medium">
                              {date.toLocaleDateString('it-IT', { weekday: 'short' })}
                            </div>
                            <div className="text-lg">
                              {date.getDate()}
                            </div>
                            <div className="text-sm">
                              {date.toLocaleDateString('it-IT', { month: 'short' })}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FiClock className="inline mr-2" />
                        Seleziona un orario
                      </label>
                      
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {timeSlots.map((slot, index) => {
                          const isSelected = slot === selectedTimeSlot;
                          
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setSelectedTimeSlot(slot)}
                              className={`p-2 rounded-lg border ${
                                isSelected
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={submitting || !selectedDate || !selectedTimeSlot}
                      className="w-full bg-green-500 text-white py-3 rounded-lg disabled:bg-gray-300 hover:bg-green-600 transition-colors"
                    >
                      {submitting ? 'Elaborazione in corso...' : 'Conferma prenotazione'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;