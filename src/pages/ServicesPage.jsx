// frontend/src/pages/ServicesPage.jsx
import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiClock, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import Header from '../components/Header';
import { serviceService } from '../services/api';

const ServiceForm = ({ service, onSave, onCancel }) => {
  // Ensure service is an object, even if null is passed
  const initialService = service || {};

  const [formData, setFormData] = useState({
    nome: initialService.nome || '',
    descrizione: initialService.descrizione || '',
    durata: initialService.durata || 60,
    attivo: initialService.attivo !== undefined ? initialService.attivo : true
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome del servizio obbligatorio';
    }

    if (formData.durata < 15) {
      newErrors.durata = 'La durata minima è di 15 minuti';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Errore nel salvataggio del servizio:', error);
      setErrors({
        general: error.response?.data?.error || 'Errore nel salvataggio del servizio'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          {initialService.id ? 'Modifica Servizio' : 'Nuovo Servizio'}
        </h3>

        {errors.general && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {errors.general}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome del servizio *
            </label>
            <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg ${
                    errors.nome ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.nome && (
                <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
                name="descrizione"
                value={formData.descrizione}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durata (minuti) *
            </label>
            <input
                type="number"
                name="durata"
                value={formData.durata}
                onChange={handleChange}
                min="15"
                className={`w-full px-4 py-2 border rounded-lg ${
                    errors.durata ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.durata && (
                <p className="text-red-500 text-sm mt-1">{errors.durata}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
                type="checkbox"
                id="attivo"
                name="attivo"
                checked={formData.attivo}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="attivo" className="ml-2 block text-sm text-gray-700">
              Servizio attivo
            </label>
          </div>

          <div className="flex justify-end space-x-3">
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? 'Salvataggio...' : 'Salva Servizio'}
            </button>
          </div>
        </form>
      </div>
  );
};

// Il resto del componente ServicesPage rimane invariato
const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentService, setCurrentService] = useState(null);

  // Carica i servizi
  const loadServices = async () => {
    setLoading(true);
    try {
      const response = await serviceService.getServices();
      setServices(response.data);
    } catch (error) {
      console.error('Errore nel caricamento dei servizi:', error);
      setError('Impossibile caricare i servizi. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Apre il form per creare un nuovo servizio
  const handleAddService = () => {
    setCurrentService(null);
    setShowForm(true);
  };

  // Apre il form per modificare un servizio esistente
  const handleEditService = (service) => {
    setCurrentService(service);
    setShowForm(true);
  };

  // Salva il servizio (nuovo o modificato)
  const handleSaveService = async (formData) => {
    try {
      if (currentService?.id) {
        // Aggiorna servizio esistente
        await serviceService.updateService(currentService.id, formData);
      } else {
        // Crea nuovo servizio
        await serviceService.createService(formData);
      }

      // Ricarica la lista dei servizi
      await loadServices();

      // Chiudi il form
      setShowForm(false);
    } catch (error) {
      console.error('Errore nel salvataggio del servizio:', error);
      throw error;
    }
  };

  // Cambia lo stato attivo/disattivo di un servizio
  const handleToggleActive = async (service) => {
    try {
      await serviceService.updateService(service.id, {
        ...service,
        attivo: !service.attivo
      });

      // Aggiorna localmente lo stato
      setServices(services.map(s =>
          s.id === service.id ? { ...s, attivo: !s.attivo } : s
      ));
    } catch (error) {
      console.error('Errore nella modifica dello stato del servizio:', error);
    }
  };

  // Elimina (disattiva) un servizio
  const handleDeleteService = async (serviceId) => {
    if (!confirm('Sei sicuro di voler disattivare questo servizio?')) {
      return;
    }

    try {
      await serviceService.deleteService(serviceId);

      // Ricarica la lista dei servizi
      await loadServices();
    } catch (error) {
      console.error('Errore nella disattivazione del servizio:', error);
    }
  };

  return (
      <div className="min-h-screen bg-gray-100">
        <Header />

        <div className="container mx-auto p-4 mt-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Gestione Servizi</h1>

            {!showForm && (
                <button
                    onClick={handleAddService}
                    className="flex items-center bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
                >
                  <FiPlus className="mr-2" />
                  Nuovo Servizio
                </button>
            )}
          </div>

          {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
          )}

          {showForm && (
              <div className="mb-6">
                <ServiceForm
                    service={currentService}
                    onSave={handleSaveService}
                    onCancel={() => setShowForm(false)}
                />
              </div>
          )}

          {loading && !showForm ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
          ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {services.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      Nessun servizio disponibile. Aggiungi il tuo primo servizio!
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrizione
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Durata
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stato
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Azioni
                        </th>
                      </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {services.map((service) => (
                          <tr key={service.id} className={!service.attivo ? 'bg-gray-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {service.nome}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {service.descrizione || 'Nessuna descrizione'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500 flex items-center">
                                <FiClock className="mr-1" />
                                {service.durata} min
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                  onClick={() => handleToggleActive(service)}
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      service.attivo
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-100 text-gray-800'
                                  }`}
                              >
                                {service.attivo ? (
                                    <>
                                      <FiToggleRight className="mr-1" />
                                      Attivo
                                    </>
                                ) : (
                                    <>
                                      <FiToggleLeft className="mr-1" />
                                      Disattivato
                                    </>
                                )}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                  onClick={() => handleEditService(service)}
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                <FiEdit />
                              </button>
                              <button
                                  onClick={() => handleDeleteService(service.id)}
                                  className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash2 />
                              </button>
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                )}
              </div>
          )}
        </div>
      </div>
  );
};

export default ServicesPage;
