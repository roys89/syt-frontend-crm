// src/components/users/UserForm.js
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import userService from '../../services/userService';

const UserForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    employeeId: '',
    role: 'user',
    permissions: {
      canAddLead: false,
      canRemoveLead: false,
      canViewLeads: true,
      canAddUser: false,
      canRemoveUser: false,
      bookings: false
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchUser(id);
    } else {
      // Ensure default permissions are set for 'user' role when adding new
      if (formData.role === 'user') {
        setFormData(prev => ({ 
          ...prev, 
          permissions: { 
            canAddLead: false, 
            canRemoveLead: false, 
            canViewLeads: true, 
            canAddUser: false, 
            canRemoveUser: false, 
            bookings: false 
          }
        }));
      }
    }
  }, [id]); // Removed formData.role dependency to avoid potential loop

  const fetchUser = async (userId) => {
    try {
      setIsLoading(true);
      const response = await userService.getUserById(userId);
      const user = response.data;
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', 
        role: user.role || 'user',
        // Ensure permissions object exists and provide defaults
        permissions: {
          canAddLead: user.permissions?.canAddLead || false,
          canRemoveLead: user.permissions?.canRemoveLead || false,
          canViewLeads: user.permissions?.canViewLeads === undefined ? true : user.permissions.canViewLeads, // Default view to true if undefined
          canAddUser: user.permissions?.canAddUser || false,
          canRemoveUser: user.permissions?.canRemoveUser || false,
          bookings: user.permissions?.bookings || false
        },
        employeeId: user.employeeId || ''
      });
      
    } catch (error) {
      console.error("Failed to fetch user details:", error);
      toast.error(`Failed to fetch user details: ${error.message || 'Server error'}`);
      navigate('/users');
    } finally {
      setIsLoading(false);
    }
  };

  const onChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const onPermissionChange = (e) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [e.target.name]: e.target.checked
      }
    });
  };

  // When role changes, update relevant permissions
  const onRoleChange = (e) => {
    const newRole = e.target.value;
    let newPermissions = { ...formData.permissions };

    if (newRole === 'admin') {
      // Admin gets all permissions
      newPermissions = {
        canAddLead: true,
        canRemoveLead: true,
        canViewLeads: true,
        canAddUser: true,
        canRemoveUser: true,
        bookings: true,
      };
    } else if (newRole === 'manager') {
       // Manager permissions (example)
        newPermissions = {
            ...newPermissions, // Keep existing non-admin perms like bookings
            canAddLead: true,
            canRemoveLead: true,
            canViewLeads: true,
            canAddUser: false, // Managers might not add other users
            canRemoveUser: false,
        };
    } else { // 'user' role
        // Reset non-admin specific permissions (or set defaults)
        newPermissions = {
            ...newPermissions, // Keep existing non-admin perms like bookings
            canAddLead: false, // Users typically don't add leads by default
            canRemoveLead: false,
            canViewLeads: true, // Users can typically view leads
            canAddUser: false,
            canRemoveUser: false,
        };
    }

    setFormData({
      ...formData,
      role: newRole,
      permissions: newPermissions
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isEditMode) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        
        await userService.updateUser(id, updateData);
        toast.success('User updated successfully');
      } else {
        if (!formData.password) {
            toast.error('Password is required for new users.');
            setIsLoading(false);
            return;
        }
        await userService.createUser(formData);
        toast.success('User created successfully');
      }
      
      navigate('/users');
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} user.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#13804e]"></div>
      </div>
    );
  }

  const renderPermissionCheckbox = (id, label, description, disabled = false) => (
    <div className="relative flex items-start">
      <div className="flex h-5 items-center">
        <input
          id={id}
          name={id}
          type="checkbox"
          disabled={disabled}
          className={`h-4 w-4 rounded border-[#093923]/30 text-[#13804e] focus:ring-[#13804e]/50 transition ease duration-200 ${disabled ? 'bg-gray-200 cursor-not-allowed' : ''}`}
          checked={formData.permissions[id]}
          onChange={onPermissionChange}
          aria-describedby={`${id}-description`}
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={id} className={`font-medium ${disabled ? 'text-[#093923]/40' : 'text-[#093923]'}`}>
          {label}
        </label>
        <p id={`${id}-description`} className={`text-xs ${disabled ? 'text-[#093923]/30' : 'text-[#13804e]/80'}`}>
          {description}
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
    <div>
          <h1 className="text-2xl font-bold text-[#093923]">{isEditMode ? 'Edit User' : 'Add New User'}</h1>
          <p className="mt-1 text-sm text-[#13804e]">
              {isEditMode
              ? 'Update user information and permissions.'
              : 'Create a new user account with appropriate role and permissions.'}
            </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/users')}
          className="inline-flex items-center px-4 py-2 border border-[#093923]/20 rounded-lg shadow-sm text-sm font-medium text-[#093923] bg-white hover:bg-[#093923]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/20 transition-all ease duration-200"
        >
          <ArrowUturnLeftIcon className="-ml-1 mr-2 h-5 w-5 text-[#093923]/80" aria-hidden="true" />
          Back to Users
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* User Details Card */}
        <div className="p-6 bg-white shadow-lg rounded-xl border border-[#093923]/10">
          <h3 className="text-lg font-semibold leading-6 text-[#093923] mb-6 border-b border-[#093923]/10 pb-3">User Details</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="name" className="block text-sm font-medium text-[#093923] mb-1">
                Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      autoComplete="name"
                      required
                className="block w-full px-3 py-2 border border-[#093923]/20 focus:ring-2 focus:ring-[#13804e]/30 focus:border-[#13804e] sm:text-sm rounded-lg transition-all ease duration-150 shadow-sm"
                      value={formData.name}
                      onChange={onChange}
                    />
                  </div>

            <div className="sm:col-span-3">
              <label htmlFor="email" className="block text-sm font-medium text-[#093923] mb-1">
                Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      autoComplete="email"
                      required
                className="block w-full px-3 py-2 border border-[#093923]/20 focus:ring-2 focus:ring-[#13804e]/30 focus:border-[#13804e] sm:text-sm rounded-lg transition-all ease duration-150 shadow-sm"
                      value={formData.email}
                      onChange={onChange}
                    />
                  </div>

            <div className="sm:col-span-3">
              <label htmlFor="password" className="block text-sm font-medium text-[#093923] mb-1">
                Password {isEditMode ? '(Leave blank to keep current)' : <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      autoComplete="new-password"
                className="block w-full px-3 py-2 border border-[#093923]/20 focus:ring-2 focus:ring-[#13804e]/30 focus:border-[#13804e] sm:text-sm rounded-lg transition-all ease duration-150 shadow-sm"
                      value={formData.password}
                      onChange={onChange}
                      required={!isEditMode}
                    />
                  </div>

            <div className="sm:col-span-3">
              <label htmlFor="employeeId" className="block text-sm font-medium text-[#093923] mb-1">
                Employee ID (Optional)
              </label>
              <input
                type="text"
                name="employeeId"
                id="employeeId"
                autoComplete="off"
                className="block w-full px-3 py-2 border border-[#093923]/20 focus:ring-2 focus:ring-[#13804e]/30 focus:border-[#13804e] sm:text-sm rounded-lg transition-all ease duration-150 shadow-sm"
                value={formData.employeeId}
                onChange={onChange}
              />
            </div>
            
             <div className="sm:col-span-3">
              <label htmlFor="role" className="block text-sm font-medium text-[#093923] mb-1">
                Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="role"
                      name="role"
                required
                className="block w-full pl-3 pr-10 py-2 border border-[#093923]/20 focus:ring-2 focus:ring-[#13804e]/30 focus:border-[#13804e] sm:text-sm rounded-lg transition-all ease duration-150 shadow-sm bg-white capitalize"
                      value={formData.role}
                      onChange={onRoleChange}
                    >
                      <option value="user">User</option>
                <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                        </div>
                      </div>

        {/* Permissions Card */}
        <div className="p-6 bg-white shadow-lg rounded-xl border border-[#093923]/10">
          <h3 className="text-lg font-semibold leading-6 text-[#093923] mb-6 border-b border-[#093923]/10 pb-3">Permissions</h3>
          <div className="space-y-5">
            {renderPermissionCheckbox('canViewLeads', 'Can View Leads', 'Allow user to view leads in the system.', formData.role === 'admin')}
            {renderPermissionCheckbox('canAddLead', 'Can Add Lead', 'Allow user to add new leads to the system.', formData.role === 'admin')}
            {renderPermissionCheckbox('canRemoveLead', 'Can Remove Lead', 'Allow user to remove leads from the system.', formData.role === 'admin')}
            {renderPermissionCheckbox('bookings', 'Bookings Permission', 'Allow user to access and manage bookings (Flights, Hotels, etc.).', formData.role === 'admin')}
            {renderPermissionCheckbox('canAddUser', 'Can Add Users', 'Allow user to create new user accounts (Admin only).', true)} {/* Always disabled unless admin */}
            {renderPermissionCheckbox('canRemoveUser', 'Can Remove Users', 'Allow user to remove user accounts (Admin only).', true)} {/* Always disabled unless admin */}
                        </div>
                      </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-5">
                <button
                  type="button"
                  onClick={() => navigate('/users')}
            className="px-4 py-2 border border-[#093923]/20 rounded-lg shadow-sm text-sm font-medium text-[#093923] bg-white hover:bg-[#093923]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/20 transition-all ease duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
            className={`inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-[#093923]/50 cursor-not-allowed' : 'bg-[#093923] hover:bg-[#022316]'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/50 transition-all ease duration-200`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : isEditMode ? 'Update User' : 'Create User'}
                </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;