// src/pages/profile/ProfilePage.js
import { KeyIcon, ShieldCheckIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';

// Helper component for Permissions list
const PermissionItem = ({ label, granted }) => {
  if (!granted) return null;
  return (
    <li className="flex items-center justify-between py-2.5 border-b border-[#093923]/10 last:border-b-0">
      <span className="text-sm text-[#13804e]">{label}</span>
      <span className="text-xs font-medium text-white bg-[#13804e] px-2 py-0.5 rounded-full">Granted</span>
    </li>
  );
};

// Helper function to define SVG icons
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#093923]/60">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeSlashIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[#093923]/60">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        role: user.role || ''
      }));
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
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    // TODO: Implement API call to update user profile & password
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); 
      toast.success('Profile updated successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      // Reset password visibility on successful save
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#093923] mb-8">Your Profile</h1>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* Personal Information Card */}
        <div className="p-6 bg-white shadow-lg rounded-xl border border-[#093923]/10">
          <h3 className="text-lg font-semibold leading-6 text-[#093923] mb-6 border-b border-[#093923]/10 pb-3 flex items-center">
            <UserCircleIcon className="h-5 w-5 mr-2 text-[#13804e]" /> Personal Information
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#093923] mb-1">
                  Full name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  autoComplete="name"
                  className="block w-full px-3 py-2 border border-[#093923]/20 focus:ring-2 focus:ring-[#13804e]/30 focus:border-[#13804e] sm:text-sm rounded-lg transition-all ease duration-150 shadow-sm"
                  value={formData.name}
                  onChange={onChange}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#093923] mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  className="block w-full px-3 py-2 border border-[#093923]/20 sm:text-sm rounded-lg bg-gray-100 cursor-not-allowed shadow-sm"
                  value={formData.email}
                  readOnly
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-[#093923] mb-1">
                  Role
                </label>
                <input
                  type="text"
                  name="role"
                  id="role"
                  className="block w-full px-3 py-2 border border-[#093923]/20 sm:text-sm rounded-lg bg-gray-100 cursor-not-allowed shadow-sm capitalize"
                  value={formData.role}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="p-6 bg-white shadow-lg rounded-xl border border-[#093923]/10">
          <h3 className="text-lg font-semibold leading-6 text-[#093923] mb-1 flex items-center">
             <KeyIcon className="h-5 w-5 mr-2 text-[#13804e]" /> Change Password
          </h3>
           <p className="text-xs text-[#13804e]/80 mb-6 border-b border-[#093923]/10 pb-3">Leave fields blank if you do not want to change your password.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Password */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-[#093923] mb-1">
                  Current Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="currentPassword"
                    id="currentPassword"
                    autoComplete="current-password"
                    className="block w-full px-3 py-2 border border-[#093923]/20 focus:ring-2 focus:ring-[#13804e]/30 focus:border-[#13804e] sm:text-sm rounded-lg transition-all ease duration-150 shadow-sm pr-10"
                    value={formData.currentPassword}
                    onChange={onChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  >
                    {showCurrentPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-[#093923] mb-1">
                  New Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    id="newPassword"
                    autoComplete="new-password"
                    className="block w-full px-3 py-2 border border-[#093923]/20 focus:ring-2 focus:ring-[#13804e]/30 focus:border-[#13804e] sm:text-sm rounded-lg transition-all ease duration-150 shadow-sm pr-10"
                    value={formData.newPassword}
                    onChange={onChange}
                  />
                   <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  >
                    {showNewPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
               {/* Confirm New Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#093923] mb-1">
                  Confirm New Password
                </label>
                <div className="relative mt-1">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    id="confirmPassword"
                    autoComplete="new-password"
                    className="block w-full px-3 py-2 border border-[#093923]/20 focus:ring-2 focus:ring-[#13804e]/30 focus:border-[#13804e] sm:text-sm rounded-lg transition-all ease duration-150 shadow-sm pr-10"
                    value={formData.confirmPassword}
                    onChange={onChange}
                  />
                   <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  >
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Card (Unchanged) */}
        <div className="p-6 bg-white shadow-lg rounded-xl border border-[#093923]/10">
          <h3 className="text-lg font-semibold leading-6 text-[#093923] mb-1 flex items-center">
             <ShieldCheckIcon className="h-5 w-5 mr-2 text-[#13804e]" /> Permissions
          </h3>
          <p className="text-xs text-[#13804e]/80 mb-6 border-b border-[#093923]/10 pb-3">Your capabilities within the system.</p>
          <div className="p-0">
            {user?.role === 'admin' ? (
               <p className="text-sm text-[#13804e] font-medium">Administrators have all permissions.</p>
            ) : (
              <ul className="divide-y divide-[#093923]/10">
                <PermissionItem label="Add Lead" granted={user?.permissions?.canAddLead} />
                <PermissionItem label="Remove Lead" granted={user?.permissions?.canRemoveLead} />
                <PermissionItem label="View Leads" granted={user?.permissions?.canViewLeads} />
                <PermissionItem label="Add User" granted={user?.permissions?.canAddUser} />
                <PermissionItem label="Remove User" granted={user?.permissions?.canRemoveUser} />
                <PermissionItem label="Manage Bookings" granted={user?.permissions?.bookings} />
              </ul>
            )}
            {!user?.role === 'admin' &&
             !Object.values(user?.permissions || {}).some(p => p) &&
             (<p className='text-sm text-[#093923]/60 mt-2'>You currently have no specific permissions assigned.</p>)
            }
          </div>
        </div>

        {/* Save Button (Unchanged) */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className={`inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-[#093923]/50 cursor-not-allowed' : 'bg-[#093923] hover:bg-[#022316]'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/50 transition-all ease duration-200`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;