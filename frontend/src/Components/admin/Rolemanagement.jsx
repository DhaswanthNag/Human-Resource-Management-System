import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminRoleManagement = () => {
  // State management
  const [roles, setRoles] = useState([]);
  const [, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: []
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRoles, setFilteredRoles] = useState([]);

  // Permission options
  const permissionOptions = [
    'read_users',
    'write_users',
    'delete_users',
    'read_roles',
    'write_roles',
    'delete_roles',
    'read_reports',
    'write_reports',
    'export_data',
    'system_config'
  ];

  // API base URL
  const API_URL = 'http://localhost:5000/api/roles';

  // Data initialization from backend
  useEffect(() => {
    // Fetch roles from backend
    const fetchRoles = async () => {
      try {
        const res = await axios.get(API_URL);
        setRoles(res.data);
        setFilteredRoles(res.data);
      } catch (err) {
        console.error('Error fetching roles:', err);
      }
    };

    // Fetch users from backend (if needed later)
    const fetchUsers = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users');
        setUsers(res.data);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    fetchRoles();
    fetchUsers();
  }, []);

  // Filter roles based on search term
  useEffect(() => {
    const filtered = roles.filter(role => 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredRoles(filtered);
  }, [searchTerm, roles]);

  // Handle permission toggle
  const togglePermission = (permission) => {
    if (newRole.permissions.includes(permission)) {
      setNewRole({
        ...newRole,
        permissions: newRole.permissions.filter(p => p !== permission)
      });
    } else {
      setNewRole({
        ...newRole,
        permissions: [...newRole.permissions, permission]
      });
    }
  };

  // Handle role creation
  const handleCreateRole = async () => {
    try {
      const res = await axios.post(API_URL, newRole);
      const createdRole = res.data;
      setRoles([...roles, createdRole]);
      setFilteredRoles([...roles, createdRole]);
      setIsCreateModalOpen(false);
      setNewRole({ name: '', description: '', permissions: [] });
    } catch (err) {
      console.error('Error creating role:', err);
    }
  };

  // Handle role deletion
  const handleDeleteRole = async (roleId) => {
    if (window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/${roleId}`);
        const updatedRoles = roles.filter(role => role.id !== roleId);
        setRoles(updatedRoles);
        setFilteredRoles(updatedRoles);
      } catch (err) {
        console.error('Error deleting role:', err);
      }
    }
  };

  // Handle role update
  const handleUpdateRole = async () => {
    try {
      const res = await axios.put(`${API_URL}/${selectedRole.id}`, selectedRole);
      const updatedRole = res.data;
      const updatedRoles = roles.map(role => 
        role.id === updatedRole.id ? updatedRole : role
      );
      setRoles(updatedRoles);
      setFilteredRoles(updatedRoles);
      setIsEditModalOpen(false);
      setSelectedRole(null);
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  return (
    <div className='bg-gradient-to-br from-blue-400 via-white to-blue-50 min-h-screen '>
      <header className=" flex items-center justify-center bg-blue-900 py-5 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-100 dark:text-white text-center ">
            Role Management
        </h1>
      </header> 
      
      {/* Header with search and create button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 ml-6 mr-6">
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search roles..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg 
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center"
        >
          <svg 
            className="w-5 h-5 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Create New Role
        </button>
      </div>
      
      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ml-6 mr-6">
        {filteredRoles.map(role => (
          <div key={role.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-gray-800">{role.name}</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  {role.user_count || 0} users
                </span>
              </div>
              <p className="text-gray-600 mt-2 text-sm">{role.description}</p>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Key Permissions:</h4>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 3).map(permission => (
                    <span 
                      key={permission} 
                      className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                    >
                      {permission.replace('_', ' ')}
                    </span>
                  ))}
                  {role.permissions.length > 3 && (
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      +{role.permissions.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-between items-center">
                <span className="text-xs text-gray-500">Created: {role.created_at ? role.created_at.split('T')[0] : ''}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setIsEditModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                    disabled={role.user_count > 0}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Empty state */}
      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No roles found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search term or create a new role.
          </p>
        </div>
      )}
      
      {/* Create Role Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Create New Role</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newRole.name}
                  onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                  placeholder="e.g., Content Manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  rows="3"
                  placeholder="Describe the purpose of this role..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-60 overflow-y-auto">
                  {permissionOptions.map(permission => (
                    <div key={permission} className="flex items-center px-4 py-2">
                      <input
                        type="checkbox"
                        id={`permission-${permission}`}
                        checked={newRole.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`permission-${permission}`} className="ml-3 block text-sm text-gray-700">
                        {permission.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={!newRole.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Role Modal */}
      {isEditModalOpen && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Edit Role</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole({...selectedRole, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedRole.description}
                  onChange={(e) => setSelectedRole({...selectedRole, description: e.target.value})}
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-60 overflow-y-auto">
                  {permissionOptions.map(permission => (
                    <div key={permission} className="flex items-center px-4 py-2">
                      <input
                        type="checkbox"
                        id={`edit-permission-${permission}`}
                        checked={selectedRole.permissions.includes(permission)}
                        onChange={() => {
                          if (selectedRole.permissions.includes(permission)) {
                            setSelectedRole({
                              ...selectedRole,
                              permissions: selectedRole.permissions.filter(p => p !== permission)
                            });
                          } else {
                            setSelectedRole({
                              ...selectedRole,
                              permissions: [...selectedRole.permissions, permission]
                            });
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`edit-permission-${permission}`} className="ml-3 block text-sm text-gray-700">
                        {permission.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoleManagement;
