// frontend/src/pages/UsersManagementPage.jsx
import { useState, useEffect } from 'react';
import { userService } from '../services/api';
import Header from '../components/Header';
import { FiEdit, FiCheck, FiX, FiUser, FiTool, FiUserCheck } from 'react-icons/fi';

const UsersManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Definizione dei ruoli disponibili
  const roles = [
    { id: 1, name: 'Admin', icon: <FiUser className="text-red-500" /> },
    { id: 2, name: 'Officina', icon: <FiTool className="text-blue-500" /> },
    { id: 3, name: 'Cliente', icon: <FiUser className="text-green-500" /> },
    { id: 4, name: 'Staff', icon: <FiUserCheck className="text-purple-500" /> }
  ];
  
  // Carica gli utenti al caricamento della pagina
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await userService.getAllUsers();
        setUsers(response.data);
        setError(null);
      } catch (err) {
        console.error('Errore nel caricamento degli utenti:', err);
        setError('Impossibile caricare gli utenti. Verifica la tua connessione e i permessi.');
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, []);
  
  // Gestisce l'avvio della modifica del ruolo
  const handleEditRole = (user) => {
    setEditingUser(user.id);
    setSelectedRole(user.role);
  };
  
  // Salva la modifica del ruolo
  const handleSaveRole = async (userId) => {
    if (!selectedRole) return;
    
    try {
      const response = await userService.updateUserRole(userId, selectedRole);
      
      // Aggiorna lo stato locale con il nuovo ruolo
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: response.data.role } : user
      ));
      
      setEditingUser(null);
      setSelectedRole(null);
    } catch (err) {
      console.error('Errore nell\'aggiornamento del ruolo:', err);
      setError('Impossibile aggiornare il ruolo utente.');
    }
  };
  
  // Annulla la modifica del ruolo
  const handleCancelEdit = () => {
    setEditingUser(null);
    setSelectedRole(null);
  };
  
  // Gestisce l'attivazione/disattivazione di un utente
  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const response = await userService.toggleUserStatus(userId, newStatus);
      
      // Aggiorna lo stato locale con il nuovo stato
      setUsers(users.map(user => 
        user.id === userId ? { ...user, active: response.data.active } : user
      ));
    } catch (err) {
      console.error('Errore nella modifica dello stato dell\'utente:', err);
      setError('Impossibile cambiare lo stato dell\'utente.');
    }
  };
  
  // Ottiene il nome del ruolo dall'ID
  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Sconosciuto';
  };
  
  // Ottiene l'icona del ruolo dall'ID
  const getRoleIcon = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.icon : <FiUser />;
  };
  
  // Formatta la data di registrazione
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  return (
    <div className="container mx-auto p-4">
      <Header />
      
      <div className="mt-6">
        <h1 className="text-2xl font-bold mb-4">Gestione Utenti</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">ID</th>
                  <th className="py-3 px-4 text-left">Username</th>
                  <th className="py-3 px-4 text-left">Nome/Ragione Sociale</th>
                  <th className="py-3 px-4 text-left">Registrazione</th>
                  <th className="py-3 px-4 text-left">Ruolo</th>
                  <th className="py-3 px-4 text-left">Stato</th>
                  <th className="py-3 px-4 text-center">Azioni</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{user.id}</td>
                    <td className="py-3 px-4">{user.user}</td>
                    <td className="py-3 px-4">
                      {console.log(user.Anagrafica)}
                      {user.Anagrafica ? 
                        (user.Anagrafica.ragione_sociale || 
                         `${user.Anagrafica.nome || ''} ${user.Anagrafica.cognome || ''}`.trim()) : 
                        '—'}
                    </td>
                    <td className="py-3 px-4">{formatDate(user.registration)}</td>
                    
                    <td className="py-3 px-4">
                      {editingUser === user.id ? (
                        <div className="flex items-center">
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(Number(e.target.value))}
                            className="border rounded p-1 mr-2"
                          >
                            {roles.map(role => (
                              <option key={role.id} value={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                          
                          <button 
                            onClick={() => handleSaveRole(user.id)}
                            className="text-green-500 p-1"
                            title="Salva"
                          >
                            <FiCheck />
                          </button>
                          
                          <button 
                            onClick={handleCancelEdit}
                            className="text-red-500 p-1"
                            title="Annulla"
                          >
                            <FiX />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          {getRoleIcon(user.role)}
                          <span className="ml-2">{getRoleName(user.role)}</span>
                        </div>
                      )}
                    </td>
                    
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.active === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active === 1 ? 'Attivo' : 'Disattivato'}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center items-center space-x-2">
                        {editingUser !== user.id && (
                          <button 
                            onClick={() => handleEditRole(user)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Modifica ruolo"
                          >
                            <FiEdit />
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleToggleStatus(user.id, user.active)}
                          className={`hover:${user.active === 1 ? 'text-red-700' : 'text-green-700'} ${
                            user.active === 1 ? 'text-red-500' : 'text-green-500'
                          }`}
                          title={user.active === 1 ? 'Disattiva utente' : 'Attiva utente'}
                        >
                          {user.active === 1 ? <FiX /> : <FiCheck />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {users.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-4 text-center text-gray-500">
                      Nessun utente trovato
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagementPage;