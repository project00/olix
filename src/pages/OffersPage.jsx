// pages/OffersPage.jsx
import { useState, useEffect } from 'react';
import { FiPackage, FiPlusCircle, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Header from '../components/Header';
import { offerService, serviceService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentOffer, setCurrentOffer] = useState(null);
  const { user } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    descrizione: '',
    cilindrata: '',
    max: 1,
    tipo_offerta: 'Manuale',
    stato: 0,
    servizi: []
  });
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Carica i servizi per verificare se esistono
        const servicesResponse = await serviceService.getServices();
        setServices(servicesResponse.data || []);
        console.log('Servizi caricati:', servicesResponse.data);
        
        // Carica le offerte solo se l'utente è autenticato
        if (user?.id) {
          console.log('Caricamento offerte per utente:', user.id);
          try {
            const offersResponse = await offerService.getUserOffers();
            console.log('Offerte ricevute:', offersResponse.data);
            setOffers(offersResponse.data || []);
          } catch (offerError) {
            console.error('Errore nel caricamento delle offerte:', offerError);
            
            // Mostra un messaggio di errore specifico per le offerte
            if (offerError.response) {
              setError(`Errore nel caricamento delle offerte: ${offerError.response.data?.error || offerError.message}`);
            } else {
              setError(`Errore nel caricamento delle offerte: ${offerError.message}`);
            }
          }
        } else {
          console.warn('Utente non autenticato o ID mancante');
          setError('Per visualizzare le offerte devi essere autenticato.');
        }
      } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        setError('Impossibile caricare i dati. Riprova più tardi.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user?.id]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleServiceToggle = (serviceId) => {
    setFormData(prev => {
      const servizi = prev.servizi.includes(serviceId)
        ? prev.servizi.filter(id => id !== serviceId)
        : [...prev.servizi, serviceId];
      
      return {
        ...prev,
        servizi
      };
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (currentOffer) {
        console.log('Aggiornamento offerta:', currentOffer.id, formData);
        await offerService.updateOffer(currentOffer.id, formData);
      } else {
        console.log('Creazione nuova offerta:', formData);
        await offerService.createOffer(formData);
      }
      
      // Refresh data
      try {
        console.log('Aggiornamento elenco offerte');
        const offersResponse = await offerService.getUserOffers();
        console.log('Offerte aggiornate:', offersResponse.data);
        setOffers(offersResponse.data || []);
      } catch (refreshError) {
        console.error('Errore nel recupero delle offerte dopo il salvataggio:', refreshError);
      }
      
      // Reset form
      setIsFormVisible(false);
      setCurrentOffer(null);
      setFormData({
        descrizione: '',
        cilindrata: '',
        max: 1,
        tipo_offerta: 'Manuale',
        stato: 0,
        servizi: []
      });
    } catch (error) {
      console.error('Errore nel salvataggio dell\'offerta:', error);
      
      if (error.response) {
        setError(`Impossibile salvare l'offerta: ${error.response.data?.error || error.message}`);
      } else {
        setError(`Impossibile salvare l'offerta: ${error.message}`);
      }
    }
  };
  
  const handleEdit = (offer) => {
    setCurrentOffer(offer);
    setFormData({
      descrizione: offer.descrizione,
      cilindrata: offer.cilindrata,
      max: offer.max,
      tipo_offerta: offer.tipo_offerta,
      stato: offer.stato,
      servizi: offer.servizi?.map(s => s.id) || []
    });
    setIsFormVisible(true);
  };
  
  const handleDelete = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questa offerta?')) return;
    
    try {
      await offerService.deleteOffer(id);
      setOffers(offers.filter(offer => offer.id !== id));
    } catch (error) {
      console.error('Errore nell\'eliminazione dell\'offerta:', error);
      setError('Impossibile eliminare l\'offerta. Riprova più tardi.');
    }
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case 0: return 'Attiva';
      case 1: return 'Disattivata';
      case 2: return 'Cancellata';
      default: return 'Sconosciuto';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto p-4 mt-6">
        <h1 className="text-2xl font-bold mb-6">Gestione Offerte</h1>
        
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
            {services.length === 0 ? (
              <div className="text-center py-8">
                <FiPackage className="mx-auto text-gray-400 text-5xl mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  Prima di creare offerte, devi aggiungere dei servizi
                </h2>
                <p className="text-gray-500 mb-4">
                  Le offerte sono insiemi di servizi che offri ai tuoi clienti.
                </p>
                <a 
                  href="/services"
                  className="inline-block bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                >
                  Vai a gestione servizi
                </a>
              </div>
            ) : (
              <div>
                {!isFormVisible ? (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">Le tue offerte</h2>
                      <button
                        onClick={() => {
                          setCurrentOffer(null);
                          setFormData({
                            descrizione: '',
                            cilindrata: '',
                            max: 1,
                            tipo_offerta: 'Manuale',
                            stato: 0,
                            servizi: []
                          });
                          setIsFormVisible(true);
                        }}
                        className="flex items-center gap-2 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                      >
                        <FiPlusCircle /> Nuova Offerta
                      </button>
                    </div>
                    
                    {offers.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">
                        Non hai ancora creato offerte. Crea la tua prima offerta!
                      </p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {offers.map(offer => (
                          <div key={offer.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-lg text-gray-800 truncate">{offer.descrizione}</h3>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => handleEdit(offer)}
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  <FiEdit2 />
                                </button>
                                <button 
                                  onClick={() => handleDelete(offer.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <FiTrash2 />
                                </button>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-2">
                              <p>Cilindrata: {offer.cilindrata || 'Non specificata'}</p>
                              <p>Trasmissione: {offer.tipo_offerta}</p>
                              <p>Stato: <span className={`font-medium ${offer.stato === 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                {getStatusLabel(offer.stato)}
                              </span></p>
                              <p>Max prenotazioni: {offer.max}</p>
                            </div>
                            
                            <div className="mt-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Servizi inclusi:</h4>
                              <div className="flex flex-wrap gap-1">
                                {offer.servizi && offer.servizi.length > 0 ? (
                                  offer.servizi.map(servizio => (
                                    <span key={servizio.id} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      {servizio.nome}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-500">Nessun servizio associato</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">
                        {currentOffer ? 'Modifica Offerta' : 'Crea Nuova Offerta'}
                      </h2>
                      <button
                        onClick={() => setIsFormVisible(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Annulla
                      </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Descrizione
                        </label>
                        <textarea
                          name="descrizione"
                          value={formData.descrizione}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="3"
                        ></textarea>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cilindrata
                          </label>
                          <input
                            type="number"
                            name="cilindrata"
                            value={formData.cilindrata}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="0.1"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max prenotazioni
                          </label>
                          <input
                            type="number"
                            name="max"
                            value={formData.max}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo trasmissione
                          </label>
                          <select
                            name="tipo_offerta"
                            value={formData.tipo_offerta}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Manuale">Manuale</option>
                            <option value="Automatica">Automatica</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Stato
                          </label>
                          <select
                            name="stato"
                            value={formData.stato}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value={0}>Attiva</option>
                            <option value={1}>Disattivata</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Servizi inclusi
                        </label>
                        <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                          {services.length === 0 ? (
                            <p className="text-gray-500 text-sm">Nessun servizio disponibile</p>
                          ) : (
                            <div className="space-y-2">
                              {services.map(service => (
                                <div key={service.id} className="flex items-start gap-2">
                                  <input
                                    type="checkbox"
                                    id={`service-${service.id}`}
                                    checked={formData.servizi.includes(service.id)}
                                    onChange={() => handleServiceToggle(service.id)}
                                    className="mt-1"
                                  />
                                  <label htmlFor={`service-${service.id}`} className="text-sm">
                                    <div className="font-medium">{service.nome}</div>
                                    <div className="text-gray-500 text-xs">{service.descrizione}</div>
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {formData.servizi.length === 0 && (
                          <p className="text-red-500 text-xs mt-1">
                            Seleziona almeno un servizio per l'offerta
                          </p>
                        )}
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prezzo
                          </label>
                          <input
                            type="number"
                            name="prezzo"
                            value={formData.prezzo}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="1"
                          />
                        </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={formData.servizi.length === 0}
                          className={`
                            px-4 py-2 rounded-lg font-medium
                            ${formData.servizi.length === 0
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                            }
                          `}
                        >
                          {currentOffer ? 'Aggiorna Offerta' : 'Crea Offerta'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OffersPage;