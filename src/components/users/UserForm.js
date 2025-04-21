// src/components/users/UserForm.js
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
    }
  }, [id]);

  const fetchUser = async (userId) => {
    try {
      setIsLoading(true);
      const response = await userService.getUserById(userId);
      const user = response.data;
      
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // Don't populate password field for security
        role: user.role,
        permissions: user.permissions,
        employeeId: user.employeeId || ''
      });
      
      setIsLoading(false);
    } catch (error) {
      toast.error('Failed to fetch user details');
      navigate('/users');
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

  const onRoleChange = (e) => {
    const newRole = e.target.value;
    setFormData({
      ...formData,
      role: newRole,
      permissions: {
        ...formData.permissions,
        canAddUser: newRole === 'admin',
        canRemoveUser: newRole === 'admin',
        canAddLead: newRole === 'admin' ? true : formData.permissions.canAddLead,
        canRemoveLead: newRole === 'admin' ? true : formData.permissions.canRemoveLead
      }
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isEditMode) {
        // If editing, don't send empty password
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        
        await userService.updateUser(id, updateData);
        toast.success('User updated successfully');
      } else {
        await userService.createUser(formData);
        toast.success('User created successfully');
      }
      
      navigate('/users');
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{isEditMode ? 'Edit User' : 'Add New User'}</h3>
            <p className="mt-1 text-sm text-gray-600">
              {isEditMode
                ? 'Update user information and permissions'
                : 'Create a new user account with appropriate permissions'}
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={onSubmit}>
            <div className="shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 bg-white sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      autoComplete="name"
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.name}
                      onChange={onChange}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      autoComplete="email"
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.email}
                      onChange={onChange}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password {isEditMode && '(Leave blank to keep current)'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      autoComplete="new-password"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.password}
                      onChange={onChange}
                      required={!isEditMode}
                    />
                  </div>

                  {/* Employee ID Field (Conditional) */}
                  {formData.role === 'user' && (
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                        Employee ID (Optional)
                      </label>
                      <input
                        type="text"
                        name="employeeId"
                        id="employeeId"
                        autoComplete="off"
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.employeeId}
                        onChange={onChange}
                      />
                    </div>
                  )}

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <select
                      id="role"
                      name="role"
                      autoComplete="role"
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.role}
                      onChange={onRoleChange}
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="col-span-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Permissions</h3>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="canAddLead"
                            name="canAddLead"
                            type="checkbox"
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            checked={formData.permissions.canAddLead}
                            onChange={onPermissionChange}
                            disabled={formData.role === 'admin'} // Admin always has this permission
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="canAddLead" className="font-medium text-gray-700">
                            Can Add Lead
                          </label>
                          <p className="text-gray-500">Allow user to add new leads to the system</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="canRemoveLead"
                            name="canRemoveLead"
                            type="checkbox"
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            checked={formData.permissions.canRemoveLead}
                            onChange={onPermissionChange}
                            disabled={formData.role === 'admin'} // Admin always has this permission
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="canRemoveLead" className="font-medium text-gray-700">
                            Can Remove Lead
                          </label>
                          <p className="text-gray-500">Allow user to remove leads from the system</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="canViewLeads"
                            name="canViewLeads"
                            type="checkbox"
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            checked={formData.permissions.canViewLeads}
                            onChange={onPermissionChange}
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="canViewLeads" className="font-medium text-gray-700">
                            Can View Leads
                          </label>
                          <p className="text-gray-500">Allow user to view leads in the system</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="bookings"
                            name="bookings"
                            type="checkbox"
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            checked={formData.permissions.bookings}
                            onChange={onPermissionChange}
                            disabled={formData.role === 'admin'} // Admin always has this permission
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="bookings" className="font-medium text-gray-700">
                            Bookings Permission
                          </label>
                          <p className="text-gray-500">Allow user to access and manage bookings (Flights, Hotels, etc.)</p>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                  onClick={() => navigate('/users')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;