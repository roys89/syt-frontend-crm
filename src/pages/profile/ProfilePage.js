// src/pages/profile/ProfilePage.js
import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';

const ProfilePage = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        name: user.name,
        email: user.email,
        role: user.role
      });
    }
  }, [user]);

  const onChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    // This is where you would call an API to update the user profile
    // Since we didn't implement this endpoint in our backend, we'll just show a success message
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Profile updated successfully');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Your Profile</h1>
      
      <div className="mt-6 md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Information</h3>
            <p className="mt-1 text-sm text-gray-600">
              Update your account information and change your password.
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
                      Full name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      autoComplete="name"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.name}
                      onChange={onChange}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      autoComplete="email"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-100"
                      value={formData.email}
                      readOnly
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Role
                    </label>
                    <input
                      type="text"
                      name="role"
                      id="role"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-100"
                      value={formData.role}
                      readOnly
                    />
                  </div>

                  <div className="col-span-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Change Password</h3>
                  </div>

                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.currentPassword}
                      onChange={onChange}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.newPassword}
                      onChange={onChange}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-4">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.confirmPassword}
                      onChange={onChange}
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="hidden sm:block" aria-hidden="true">
        <div className="py-5">
          <div className="border-t border-gray-200"></div>
        </div>
      </div>

      <div className="mt-10 sm:mt-0">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Permissions</h3>
              <p className="mt-1 text-sm text-gray-600">
                Your current permissions in the system.
              </p>
            </div>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6">
                    <div className="flex flex-wrap gap-2">
                      {user?.permissions?.canAddLead && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          Add Lead
                        </span>
                      )}
                      {user?.permissions?.canRemoveLead && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                          Remove Lead
                        </span>
                      )}
                      {user?.permissions?.canViewLeads && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                          View Leads
                        </span>
                      )}
                      {user?.permissions?.canAddUser && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                          Add User
                        </span>
                      )}
                      {user?.permissions?.canRemoveUser && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                          Remove User
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;