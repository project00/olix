// frontend/src/components/LoginModal.jsx
import { useState, useEffect } from 'react';
import { FiX, FiUser, FiLock, FiMail, FiCheckCircle } from 'react-icons/fi';
import { authService } from '../services/api';
import Loader from './Loader';
import { useAuth } from '../contexts/AuthContext';

const LoginModal = ({ show, onClose }) => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '', // Changed from 'user' to 'email' for login
    psw: '',
    confirmPsw: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [show]);

  const validateForm = (isRegister) => {
    const newErrors = {};

    if (!formData.email.trim() || !formData.email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      newErrors.email = 'Email non valida';
    }

    if (!formData.psw) {
      newErrors.psw = 'Password obbligatoria';
    } else if (formData.psw.length < 6) {
      newErrors.psw = 'Minimo 6 caratteri';
    }

    if (isRegister) {
      if (!formData.email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
        newErrors.email = 'Email non valida';
      }

      if (formData.psw !== formData.confirmPsw) {
        newErrors.confirmPsw = 'Le password non coincidono';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isRegister = activeTab === 'register';

    if (!validateForm(isRegister)) return;

    setLoading(true);
    try {
      let response;
      let response;
      if (isRegister) {
        // For registration, we send email and password
        response = await authService.register({ email: formData.email, password: formData.psw });
        setSuccessMessage('Registrazione completata!');
      } else {
        // For login, we send email and password
        response = await authService.login({
          email: formData.email,
          password: formData.psw
        });
        // The backend now expects 'email' and 'password'
        // The service passes the object as is.
        login(response.data.token);
        onClose();
      }

      if (isRegister) {
        setTimeout(() => {
          setActiveTab('login');
          setSuccessMessage('');
        }, 2000);
      }
    } catch (error) {
      setErrors({
        general: error.response?.data?.error || 'Errore durante l\'operazione'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 w-full max-w-md relative">
          <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <FiX size={24} />
          </button>

          <div className="flex mb-6 border-b">
            <button
                className={`flex-1 py-2 text-lg font-medium ${
                    activeTab === 'login'
                        ? 'border-b-2 border-blue-500 text-blue-500'
                        : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button
                className={`flex-1 py-2 text-lg font-medium ${
                    activeTab === 'register'
                        ? 'border-b-2 border-blue-500 text-blue-500'
                        : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('register')}
            >
              Registrati
            </button>
          </div>

          {successMessage && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded flex items-center">
                <FiCheckCircle className="mr-2" /> {successMessage}
              </div>
          )}

          {errors.general && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {errors.general}
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-gray-400" />
                <input
                    type="password"
                    value={formData.psw}
                    onChange={(e) => setFormData({...formData, psw: e.target.value})}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                        errors.psw ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
              </div>
              {errors.psw && (
                  <p className="text-red-500 text-sm mt-1">{errors.psw}</p>
              )}
            </div>

            {activeTab === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conferma Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-3 text-gray-400" />
                    <input
                        type="password"
                        value={formData.confirmPsw}
                        onChange={(e) => setFormData({...formData, confirmPsw: e.target.value})}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg ${
                            errors.confirmPsw ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                  </div>
                  {errors.confirmPsw && (
                      <p className="text-red-500 text-sm mt-1">{errors.confirmPsw}</p>
                  )}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 flex items-center justify-center"
            >
              {loading ? (
                  <Loader size="small" />
              ) : activeTab === 'login' ? (
                  'Accedi'
              ) : (
                  'Registrati'
              )}
            </button>
          </form>
        </div>
      </div>
  );
};

export default LoginModal;
