// frontend/src/pages/RolesManagementPage.jsx
import { useState, useEffect } from 'react';
import { FiEdit, FiCheck, FiX, FiShield, FiUsers, FiLock } from 'react-icons/fi';
import Header from '../components/Header';
import { roleService } from '../services/api';

const RolesManagementPage = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [roleUsers, setRoleUsers] = useState({});
  const [viewingRoleUsers, setViewingRoleUsers] = useState(null);
  
  // Carica i ruoli al caricamento della pagina
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoading(true);
        const rolesResponse = await roleService.getAllRoles();
        setRoles(rolesResponse.data);
        
        const permissionsResponse = await roleService.getAllPermissions();
        setPermissions(permissionsResponse.data);
        
        setError(null);
      } catch (err) {
        console.error('Errore nel caricamento dei ruoli:', err);
        setError('Impossibile caricare i ruoli. Verifica la tua connessione e i permessi.');
      } finally {
        setLoading(false);
      }
    };
    
    loadRoles();
  }, []);
  
  // Gestisce l'avvio della modifica dei permessi di un ruolo
  const handleEditRole = async (role) => {
    try {
      setLoading(true);
      const response = await roleService.getRolePermissions(role.id);
      setSelectedPermissions(response.data);
      setEditingRole(role.id);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento dei permessi del ruolo:', err);
      setError('Impossibile caricare i permessi del ruolo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Salva la modifica dei permessi di un ruolo
  const handleSavePermissions = async (roleId) => {
    try {
      setLoading(true);
      await roleService.updateRolePermissions(roleId, selectedPermissions);
      
      // Aggiorna lo stato locale
      setEditingRole(null);
      setSelectedPermissions([]);
      
      // Ricarica i ruoli per avere i dati aggiornati
      const rolesResponse = await roleService.getAllRoles();
      setRoles(rolesResponse.data);
      
      setError(null);
    } catch (err) {
      console.error('Errore nell\'aggiornamento dei permessi:', err);
      setError('Impossibile aggiornare i permessi del ruolo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Annulla la modifica dei permessi
  const handleCancelEdit = () => {
    setEditingRole(null);
    setSelectedPermissions([]);
  };
  
  // Gestisce il toggle di un permesso nella lista
  const handlePermissionToggle = (permissionId) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };
  
  // Carica gli utenti associati a un ruolo
  const handleViewRoleUsers = async (roleId) => {
    if (viewingRoleUsers === roleId) {
      // Se stiamo già visualizzando gli utenti per questo ruolo, chiudiamo il pannello
      setViewingRoleUsers(null);
      return;
    }
    
    try {
      setLoading(true);
      const response = await roleService.getRoleUsers(roleId);
      setRoleUsers({ ...roleUsers, [roleId]: response.data });
      setViewingRoleUsers(roleId);
      setError(null);
    } catch (err) {
      console.error('Errore nel caricamento degli utenti del ruolo:', err);
      setError('Impossibile caricare gli utenti associati al ruolo.');
    } finally {
      setLoading(false);
    }
  };
  
  // Raggruppa i permessi per categoria
  const groupPermissionsByCategory = () => {
    const grouped = {};
    
    permissions.forEach(permission => {
      const category = permission.category || 'Altro';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    });
    
    return grouped;
  };
  
  return (
    <div className="container mx-auto p-4">
      <Header />
      
      <div className="mt-6">
        <h1 className="text-2xl font-bold mb-4">Gestione Ruoli</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading && !editingRole ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lista dei ruoli */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h2 className="text-lg font-semibold flex items-center">
                  <FiShield className="mr-2" /> Ruoli Disponibili
                </h2>
              </div>
              
              <ul className="divide-y divide-gray-200">
                {roles.map(role => (
                  <li key={role.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-gray-900">{role.name}</h3>
                        <p className="text-sm text-gray-500">Livello: {role.id}</p>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewRoleUsers(role.id)}
                          className="text-blue-500 hover:text-blue-700 p-1"
                          title="Visualizza utenti"
                        >
                          <FiUsers />
                        </button>
                        
                        <button
                          onClick={() => handleEditRole(role)}
                          className="text-green-500 hover:text-green-700 p-1"
                          title="Modifica permessi"
                          disabled={editingRole !== null}
                        >
                          <FiEdit />
                        </button>
                      </div>
                    </div>
                    
                    {/* Pannello utenti del ruolo */}
                    {viewingRoleUsers === role.id && roleUsers[role.id] && (
                      <div className="mt-4 bg-gray-50 p-3 rounded">
                        <h4 className="font-medium text-sm mb-2 flex items-center">
                          <FiUsers className="mr-1" /> Utenti con ruolo {role.name}
                        </h4>
                        
                        {roleUsers[role.id].length > 0 ? (
                          <ul className="text-sm divide-y divide-gray-200">
                            {roleUsers[role.id].map(user => (
                              <li key={user.id} className="py-2">
                                {user.user} {user.Anagrafica && (
                                  <span className="text-gray-500">
                                    ({user.Anagrafica.ragione_sociale || 
                                      `${user.Anagrafica.nome || ''} ${user.Anagrafica.cognome || ''}`.trim()})
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500">Nessun utente con questo ruolo</p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
                
                {roles.length === 0 && (
                  <li className="p-4 text-center text-gray-500">
                    Nessun ruolo disponibile
                  </li>
                )}
              </ul>
            </div>
            
            {/* Pannello di modifica permessi */}
            {editingRole !== null && (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FiLock className="mr-2" /> 
                    Permessi per {roles.find(r => r.id === editingRole)?.name}
                  </h2>
                </div>
                
                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <>
                      {Object.entries(groupPermissionsByCategory()).map(([category, categoryPermissions]) => (
                        <div key={category} className="mb-4">
                          <h3 className="font-medium text-gray-700 mb-2">{category}</h3>
                          
                          <div className="space-y-2">
                            {categoryPermissions.map(permission => (
                              <div key={permission.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`permission-${permission.id}`}
                                  checked={selectedPermissions.includes(permission.id)}
                                  onChange={() => handlePermissionToggle(permission.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label 
                                  htmlFor={`permission-${permission.id}`}
                                  className="ml-2 block text-sm text-gray-900"
                                >
                                  {permission.name}
                                  <p className="text-xs text-gray-500">{permission.description}</p>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Annulla
                        </button>
                        
                        <button
                          onClick={() => handleSavePermissions(editingRole)}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        >
                          Salva Permessi
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RolesManagementPage;