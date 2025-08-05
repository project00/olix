// frontend/src/components/Header.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiUser, FiMenu, FiChevronDown, FiSettings, FiTool, FiCalendar, FiPackage, FiSearch, FiClock, FiUsers, FiShield } from 'react-icons/fi';
import LoginModal from './LoginModal';
import CitySearchForm from './CitySearchForm';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showAdminDropdown, setShowAdminDropdown] = useState(false);
    const [showSearchForm, setShowSearchForm] = useState(false);
    const dropdownRef = useRef(null);
    const adminDropdownRef = useRef(null);
    const { isAuthenticated, user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    
    // Gestisce il click fuori dai dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
                setShowAdminDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    // Gestisce la ricerca di una città e l'aggiornamento della posizione
    const handleLocationFound = (cityLocation) => {
        setShowSearchForm(false);
        
        // Debug
        console.log("Posizione trovata:", cityLocation);
        console.log("Location pathname:", location.pathname);
        
        // Se siamo nella homepage, aggiorna la posizione dell'utente
        if (location.pathname === "/" || location.pathname === "") {
            // Usa l'API del browser per inviare un evento personalizzato che può essere catturato da MapView
            const locationEvent = new CustomEvent('locationSelected', { 
                detail: { 
                    lat: cityLocation.lat, 
                    lon: cityLocation.lon,
                    radius: 50
                } 
            });
            console.log("Inviando evento locationSelected");
            window.dispatchEvent(locationEvent);
        } else {
            // Se non siamo nella homepage, naviga alla homepage con i parametri di posizione
            console.log("Navigando alla homepage con lat/lon");
            navigate('/?lat=' + cityLocation.lat + '&lon=' + cityLocation.lon);
        }
    };

    // Menu per gli amministratori
    const renderAdminMenu = () => {
        const adminMenuItems = [
            { 
                name: 'Gestisci Utenti',
                icon: <FiUsers className="mr-2" />,
                path: '/admin/users',
                description: 'Visualizza e modifica gli utenti'
            },
            { 
                name: 'Gestisci Ruoli',
                icon: <FiShield className="mr-2" />,
                path: '/admin/roles',
                description: 'Gestisci i ruoli e i permessi'
            }
        ];

        return (
            <div className="relative" ref={adminDropdownRef}>
                <button
                    onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                    className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 py-2"
                >
                    <span>Admin</span>
                    <FiChevronDown className={`transition-transform ${showAdminDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showAdminDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-20 overflow-hidden">
                        <div className="p-3 bg-red-50 border-b border-red-100">
                            <span className="font-medium text-red-800">Menu Amministratore</span>
                        </div>
                        <div className="py-2">
                            {adminMenuItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className="flex items-center px-4 py-2 hover:bg-gray-100 transition-colors"
                                    onClick={() => setShowAdminDropdown(false)}
                                >
                                    <div className="flex items-center text-gray-700">
                                        {item.icon}
                                        <span>{item.name}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 ml-8">
                                        {item.description}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Menu per le officine
    const renderShopMenu = () => {
        const menuItems = [
            { 
                name: 'Servizi',
                icon: <FiTool className="mr-2" />,
                path: '/services',
                description: 'Gestisci i servizi offerti'
            },
            { 
                name: 'Offerte',
                icon: <FiPackage className="mr-2" />,
                path: '/offers',
                description: 'Crea e gestisci pacchetti di servizi'
            },
            { 
                name: 'Disponibilità',
                icon: <FiClock className="mr-2" />,
                path: '/availability',
                description: 'Imposta gli orari disponibili'
            },
            { 
                name: 'Prenotazioni',
                icon: <FiCalendar className="mr-2" />,
                path: '/bookings',
                description: 'Visualizza e gestisci le prenotazioni'
            },
            { 
                name: 'Anagrafica',
                icon: <FiSettings className="mr-2" />,
                path: '/profile',
                description: 'Modifica i dati della tua officina'
            }
        ];

        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 py-2"
                >
                    <span>Gestione</span>
                    <FiChevronDown className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-20 overflow-hidden">
                        <div className="p-3 bg-blue-50 border-b border-blue-100">
                            <span className="font-medium text-blue-800">Menu Officina</span>
                        </div>
                        <div className="py-2">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className="flex items-center px-4 py-2 hover:bg-gray-100 transition-colors"
                                    onClick={() => setShowDropdown(false)}
                                >
                                    <div className="flex items-center text-gray-700">
                                        {item.icon}
                                        <span>{item.name}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 ml-8">
                                        {item.description}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Versione mobile del menu admin
    const renderMobileAdminMenu = () => {
        return (
            <>
                <div className="pt-2 pb-1 border-t border-gray-200 mt-2">
                    <span className="text-sm text-gray-500">Menu Amministratore</span>
                </div>
                <Link
                    to="/admin/users"
                    className="flex items-center text-gray-700 py-2 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <FiUsers className="mr-2" />
                    <span>Gestisci Utenti</span>
                </Link>
                <Link
                    to="/admin/roles"
                    className="flex items-center text-gray-700 py-2 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <FiShield className="mr-2" />
                    <span>Gestisci Ruoli</span>
                </Link>
            </>
        );
    };

    // Versione mobile del menu officina
    const renderMobileShopMenu = () => {
        return (
            <>
                <div className="pt-2 pb-1 border-t border-gray-200 mt-2">
                    <span className="text-sm text-gray-500">Menu Officina</span>
                </div>
                <Link
                    to="/services"
                    className="flex items-center text-gray-700 py-2 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <FiTool className="mr-2" />
                    <span>Servizi</span>
                </Link>
                <Link
                    to="/offers"
                    className="flex items-center text-gray-700 py-2 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <FiPackage className="mr-2" />
                    <span>Offerte</span>
                </Link>
                <Link
                    to="/availability"
                    className="flex items-center text-gray-700 py-2 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <FiClock className="mr-2" />
                    <span>Disponibilità</span>
                </Link>
                <Link
                    to="/bookings"
                    className="flex items-center text-gray-700 py-2 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <FiCalendar className="mr-2" />
                    <span>Prenotazioni</span>
                </Link>
                <Link
                    to="/profile"
                    className="flex items-center text-gray-700 py-2 hover:text-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <FiSettings className="mr-2" />
                    <span>Anagrafica</span>
                </Link>
            </>
        );
    };

    return (
        <header className="bg-white shadow-md py-4 px-6 z-30 relative">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-bold text-blue-600 pl-16 md:pl-0">
                    OilNoStop app
                </Link>

                {/* Menu desktop */}
                <div className="hidden md:flex items-center space-x-6">
                    {/* Pulsante di ricerca località */}
                    <button
                        onClick={() => setShowSearchForm(true)}
                        className="flex items-center text-gray-700 hover:text-blue-600"
                        title="Cerca località"
                    >
                        <FiSearch className="text-xl" />
                    </button>
                    
                    {isAuthenticated ? (
                        <>
                            <Link to="/profile" className="flex items-center text-gray-700 hover:text-blue-600">
                                <FiUser className="mr-2" />
                                <span>{user?.email}</span>
                            </Link>
                            
                            {/* Menu dropdown per gli admin */}
                            {user?.role === 1 && renderAdminMenu()}
                            
                            {/* Menu dropdown per le officine */}
                            {user?.role === 2 && renderShopMenu()}
                            
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                        >
                            Accedi
                        </button>
                    )}
                </div>

                {/* Menu hamburger per mobile */}
                <div className="md:hidden">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="text-gray-700"
                    >
                        <FiMenu size={24} />
                    </button>
                </div>
            </div>

            {/* Menu mobile */}
            {mobileMenuOpen && (
                <div className="md:hidden mt-4 bg-white p-4">
                    {/* Pulsante di ricerca località per mobile */}
                    <button
                        onClick={() => {
                            setShowSearchForm(true);
                            setMobileMenuOpen(false);
                        }}
                        className="flex items-center text-gray-700 hover:text-blue-600 py-2 mb-2 w-full"
                    >
                        <FiSearch className="mr-2" />
                        <span>Cerca località</span>
                    </button>
                    
                    {isAuthenticated ? (
                        <div className="flex flex-col space-y-3">
                            <Link
                                to="/profile"
                                className="flex items-center text-gray-700 hover:text-blue-600"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <FiUser className="mr-2" />
                                <span>{user?.email}</span>
                            </Link>
                            
                            {/* Menu admin mobile */}
                            {user?.role === 1 && renderMobileAdminMenu()}
                            
                            {/* Menu officina mobile */}
                            {user?.role === 2 && renderMobileShopMenu()}
                            
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setMobileMenuOpen(false);
                                }}
                                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 mt-2"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => {
                                setShowLoginModal(true);
                                setMobileMenuOpen(false);
                            }}
                            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                        >
                            Accedi
                        </button>
                    )}
                </div>
            )}

            {/* LoginModal component */}
            <LoginModal
                show={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onLogin={() => {
                    setShowLoginModal(false);
                }}
            />
            
            {/* Modal for city search */}
            {showSearchForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="relative">
                        <button 
                            onClick={() => setShowSearchForm(false)}
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <CitySearchForm onLocationFound={handleLocationFound} />
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
