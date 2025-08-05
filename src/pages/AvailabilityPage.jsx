// frontend/src/pages/AvailabilityPage.jsx
import { useState, useEffect } from 'react';
import { FiSave, FiX, FiCheck, FiCalendar } from 'react-icons/fi';
import Header from '../components/Header';
import { offerService, bookingService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AvailabilityPage = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availabilityPattern, setAvailabilityPattern] = useState({
    1: { // Lunedì
      isActive: true,
      hours: Array(21).fill(false) // 8:00 to 18:00 with half-hour slots
    },
    2: { // Martedì
      isActive: true,
      hours: Array(21).fill(false)
    },
    3: { // Mercoledì
      isActive: true,
      hours: Array(21).fill(false)
    },
    4: { // Giovedì
      isActive: true,
      hours: Array(21).fill(false)
    },
    5: { // Venerdì
      isActive: true,
      hours: Array(21).fill(false)
    },
    6: { // Sabato
      isActive: true,
      hours: Array(21).fill(false)
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  // Carica le offerte dell'utente
  useEffect(() => {
    const loadOffers = async () => {
      setLoading(true);
      
      try {
        const response = await offerService.getUserOffers();
        setOffers(response.data || []);
        
        if (response.data && response.data.length > 0) {
          setSelectedOffer(response.data[0].id);
          loadAvailability(response.data[0].id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Errore nel caricamento delle offerte:', error);
        setError('Impossibile caricare le offerte. Riprova più tardi.');
        setLoading(false);
      }
    };
    
    loadOffers();
  }, []);

  // Carica la disponibilità per l'offerta selezionata
  const loadAvailability = async (offerId) => {
    setLoading(true);
    
    try {
      const response = await bookingService.getAvailabilityPattern(offerId);
      
      // Se esiste un pattern di disponibilità, lo impostiamo
      if (response.data) {
        const pattern = {
          1: { isActive: true, hours: Array(21).fill(false) },
          2: { isActive: true, hours: Array(21).fill(false) },
          3: { isActive: true, hours: Array(21).fill(false) },
          4: { isActive: true, hours: Array(21).fill(false) },
          5: { isActive: true, hours: Array(21).fill(false) },
          6: { isActive: true, hours: Array(21).fill(false) }
        };
        
        // Popoliamo il pattern con i dati ricevuti dal server
        response.data.forEach(slot => {
          const day = slot.giorno_settimana;
          const hourIndex = (slot.ora_inizio - 8) * 2; // Convertiamo l'ora in indice dell'array (8:00 = 0, 8:30 = 1, ecc.)
          
          if (pattern[day]) {
            pattern[day].hours[hourIndex] = slot.disponibile;
          }
        });
        
        setAvailabilityPattern(pattern);
      }
    } catch (error) {
      console.error('Errore nel caricamento della disponibilità:', error);
      setError('Impossibile caricare la disponibilità. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  // Cambia l'offerta selezionata
  const handleOfferChange = (e) => {
    const offerId = parseInt(e.target.value);
    setSelectedOffer(offerId);
    loadAvailability(offerId);
  };

  // Aggiorna lo stato di disponibilità per un giorno
  const toggleDayActive = (day) => {
    setAvailabilityPattern(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isActive: !prev[day].isActive
      }
    }));
  };

  // Aggiorna lo stato di disponibilità per uno slot orario
  const toggleHourSlot = (day, hourIndex) => {
    setAvailabilityPattern(prev => {
      const newHours = [...prev[day].hours];
      newHours[hourIndex] = !newHours[hourIndex];
      
      return {
        ...prev,
        [day]: {
          ...prev[day],
          hours: newHours
        }
      };
    });
  };

  // Seleziona/deseleziona tutti gli slot di un giorno
  const selectAllHoursForDay = (day, select) => {
    setAvailabilityPattern(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        hours: prev[day].hours.map(() => select)
      }
    }));
  };

  // Seleziona/deseleziona uno slot specifico per tutti i giorni attivi
  const selectHourForAllDays = (hourIndex, select) => {
    setAvailabilityPattern(prev => {
      const newPattern = { ...prev };
      
      Object.keys(newPattern).forEach(day => {
        if (newPattern[day].isActive) {
          newPattern[day].hours[hourIndex] = select;
        }
      });
      
      return newPattern;
    });
  };

  // Salva il pattern di disponibilità
  const saveAvailability = async () => {
    if (!selectedOffer) return;
    
    setIsSaving(true);
    
    try {
      // Convertiamo il pattern in un formato adatto al backend
      const availabilityData = [];
      
      Object.keys(availabilityPattern).forEach(day => {
        const dayObj = availabilityPattern[day];
        
        if (dayObj.isActive) {
          dayObj.hours.forEach((isAvailable, index) => {
            const hour = Math.floor(index / 2) + 8;
            const minute = (index % 2) * 30;
            
            availabilityData.push({
              giorno_settimana: parseInt(day),
              ora_inizio: hour + (minute / 60),
              disponibile: isAvailable
            });
          });
        }
      });
      
      await bookingService.setAvailabilityPattern(selectedOffer, availabilityData);
      alert('Disponibilità salvata con successo!');
    } catch (error) {
      console.error('Errore nel salvataggio della disponibilità:', error);
      setError('Impossibile salvare la disponibilità. Riprova più tardi.');
    } finally {
      setIsSaving(false);
    }
  };

  // Genera gli orari da visualizzare nella tabella
  const generateTimeSlots = () => {
    const slots = [];
    
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) continue; // Non mostriamo slot dopo le 18:00
        
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        
        slots.push(`${formattedHour}:${formattedMinute}`);
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const weekdays = [
    { day: 1, name: 'Lunedì' },
    { day: 2, name: 'Martedì' },
    { day: 3, name: 'Mercoledì' },
    { day: 4, name: 'Giovedì' },
    { day: 5, name: 'Venerdì' },
    { day: 6, name: 'Sabato' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto p-4 mt-6">
        <h1 className="text-2xl font-bold mb-6">Gestione Disponibilità</h1>
        
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
          <div className="bg-white shadow-md rounded-lg p-6">
            {offers.length === 0 ? (
              <div className="text-center py-8">
                <FiCalendar className="mx-auto text-gray-400 text-5xl mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  Prima di gestire la disponibilità, devi creare delle offerte
                </h2>
                <p className="text-gray-500 mb-4">
                  Vai alla sezione offerte per creare il tuo primo servizio.
                </p>
                <a 
                  href="/offers"
                  className="inline-block bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                >
                  Vai a gestione offerte
                </a>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleziona l'offerta
                  </label>
                  <select
                    value={selectedOffer || ''}
                    onChange={handleOfferChange}
                    className="w-full md:w-1/2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {offers.map(offer => (
                      <option key={offer.id} value={offer.id}>
                        {offer.descrizione}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Imposta la tua disponibilità settimanale</h2>
                    <button
                      onClick={saveAvailability}
                      disabled={isSaving}
                      className="flex items-center gap-2 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-300"
                    >
                      <FiSave /> {isSaving ? 'Salvataggio...' : 'Salva disponibilità'}
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full border divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                            Giorno
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                            Attivo
                          </th>
                          {timeSlots.map((slot, index) => (
                            <th key={slot} className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                              <div className="flex flex-col">
                                <span>{slot}</span>
                                <div className="mt-2 flex justify-center gap-1">
                                  <button
                                    onClick={() => selectHourForAllDays(index, true)}
                                    className="text-green-500 hover:text-green-700 text-xs p-1"
                                    title="Seleziona per tutti i giorni"
                                  >
                                    <FiCheck size={12} />
                                  </button>
                                  <button
                                    onClick={() => selectHourForAllDays(index, false)}
                                    className="text-red-500 hover:text-red-700 text-xs p-1"
                                    title="Deseleziona per tutti i giorni"
                                  >
                                    <FiX size={12} />
                                  </button>
                                </div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {weekdays.map(({ day, name }) => (
                          <tr key={day} className={availabilityPattern[day].isActive ? '' : 'bg-gray-100'}>
                            <td className="px-4 py-4 whitespace-nowrap font-medium">
                              {name}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-4">
                                <label className="inline-flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={availabilityPattern[day].isActive}
                                    onChange={() => toggleDayActive(day)}
                                    className="form-checkbox h-5 w-5 text-blue-600"
                                  />
                                </label>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => selectAllHoursForDay(day, true)}
                                    disabled={!availabilityPattern[day].isActive}
                                    className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 disabled:opacity-50"
                                    title="Seleziona tutti gli orari per questo giorno"
                                  >
                                    Tutti
                                  </button>
                                  <button
                                    onClick={() => selectAllHoursForDay(day, false)}
                                    disabled={!availabilityPattern[day].isActive}
                                    className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 disabled:opacity-50"
                                    title="Deseleziona tutti gli orari per questo giorno"
                                  >
                                    Nessuno
                                  </button>
                                </div>
                              </div>
                            </td>
                            {timeSlots.map((_, index) => (
                              <td key={`${day}-${index}`} className="px-1 py-2 text-center">
                                <div className="flex justify-center">
                                  <input
                                    type="checkbox"
                                    checked={availabilityPattern[day].hours[index]}
                                    onChange={() => toggleHourSlot(day, index)}
                                    disabled={!availabilityPattern[day].isActive}
                                    className="form-checkbox h-5 w-5 text-blue-600 disabled:opacity-50"
                                  />
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityPage;