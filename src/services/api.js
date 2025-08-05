// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Interceptor per aggiungere il token alle richieste
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Servizi di autenticazione
export const authService = {
    login: async (credentials) => {
        return api.post('/auth/login', credentials);
    },
    register: async (userData) => {
        return api.post('/auth/register', userData);
    }
};

// Servizio per la geolocalizzazione
export const geoService = {
    searchCity: async (city) => {
        try {
            // Utilizza OpenStreetMap/Nominatim API
            const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q: city,
                    format: 'json',
                    limit: 1,
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': 'OilNoStop-App'
                }
            });
            
            if (response.data && response.data.length > 0) {
                const location = response.data[0];
                return {
                    lat: parseFloat(location.lat),
                    lon: parseFloat(location.lon),
                    display_name: location.display_name,
                    city: location.address.city || location.address.town || location.address.village || ''
                };
            }
            return null;
        } catch (error) {
            console.error('Error searching city:', error);
            throw error;
        }
    }
};

// Servizio per le offerte
export const fetchOffers = async (filters) => {
    try {
        // Aggiungi parametri come query string
        const params = {
            lat: filters.lat,
            lon: filters.lon,
            radius: filters.maxDistance || 10,
            // Altri filtri che potrebbero essere necessari
            date: filters.date,
            offerType: filters.offerType || ''
        };

        const response = await api.get('/offers/nearby', { params });
        
        // Gestisci correttamente la risposta
        if (response.data && response.data.offers) {
            return response.data.offers;
        } else if (response.data) {
            return response.data;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error fetching offers:', error);
        // Restituisci un array vuoto in caso di errore invece di lanciare un'eccezione
        return [];
    }
};

// Servizi per offerte
export const offerService = {
    getOffers: async (filters) => {
        try {
            const response = await api.get('/offers', {
                params: filters
            });
            return response.data;
        } catch (error) {
            console.error('Errore nel recupero delle offerte:', error);
            throw error;
        }
    },
    getOfferDetails: async (id) => {
        return api.get(`/offers/${id}`);
    },
    getUserOffers: async () => {
        return api.get(`/offers/user`);
    },
    createOffer: async (offerData) => {
        return api.post('/offers', offerData);
    },
    updateOffer: async (id, offerData) => {
        return api.put(`/offers/${id}`, offerData);
    },
    deleteOffer: async (id) => {
        return api.delete(`/offers/${id}`);
    }
};

// Servizi per prenotazioni
export const bookingService = {
    createBooking: async (bookingData) => {
        return api.post('/bookings', bookingData);
    },
    getUserBookings: async () => {
        return api.get('/bookings/user');
    },
    getShopBookings: async () => {
        return api.get('/bookings/shop');
    },
    updateBookingStatus: async (id, status) => {
        return api.put(`/bookings/${id}/status`, { status });
    },
    // Gestione della disponibilità
    getAvailabilityPattern: async (offerId) => {
        return api.get(`/bookings/availability/${offerId}`);
    },
    setAvailabilityPattern: async (offerId, availabilityData) => {
        return api.post(`/bookings/availability/${offerId}`, { availability: availabilityData });
    },
    checkAvailability: async (offerId, date) => {
        return api.get(`/bookings/availability/check`, { params: { offerId, date } });
    }
};

// Servizi per l'anagrafica
export const profileService = {
    getProfile: async () => {
        return api.get('/profile');
    },
    createProfile: async (profileData) => {
        return api.post('/profile', profileData);
    },
    updateProfile: async (profileData) => {
        return api.put('/profile', profileData);
    }
};

// Servizi per i servizi offerti
export const serviceService = {
    getServices: async () => {
        return api.get('/services');
    },
    createService: async (serviceData) => {
        return api.post('/services', serviceData);
    },
    updateService: async (id, serviceData) => {
        return api.put(`/services/${id}`, serviceData);
    },
    deleteService: async (id) => {
        return api.delete(`/services/${id}`);
    }
};

// Servizi per la gestione utenti (solo admin)
export const userService = {
    getAllUsers: async () => {
        return api.get('/users');
    },
    getUserById: async (id) => {
        return api.get(`/users/${id}`);
    },
    updateUserRole: async (id, role) => {
        return api.put(`/users/${id}/role`, { role });
    },
    toggleUserStatus: async (id, active) => {
        return api.put(`/users/${id}/status`, { active });
    }
};

// Servizi per la gestione dei ruoli (solo admin)
export const roleService = {
    getAllRoles: async () => {
        return api.get('/roles');
    },
    getRoleById: async (id) => {
        return api.get(`/roles/${id}`);
    },
    getAllPermissions: async () => {
        return api.get('/roles/permissions');
    },
    getRolePermissions: async (roleId) => {
        return api.get(`/roles/${roleId}/permissions`);
    },
    updateRolePermissions: async (roleId, permissions) => {
        return api.put(`/roles/${roleId}/permissions`, { permissions });
    },
    getRoleUsers: async (roleId) => {
        return api.get(`/roles/${roleId}/users`);
    }
};
