// src/components/users/UserList.js
import { PencilSquareIcon, PlusIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import userService from '../../services/userService';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await userService.getUsers();
        setUsers(response.data || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error(`Failed to fetch users: ${error.message || 'Server error'}`);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(id);
        setUsers(users.filter(user => user._id !== id));
        toast.success('User deleted successfully');
      } catch (error) {
        console.error("Failed to delete user:", error);
        toast.error(`Failed to delete user: ${error.message || 'Server error'}`);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#13804e]"></div>
      </div>
    );
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'bg-[#093923]/10 text-[#093923]';
      case 'manager': return 'bg-[#1a9d6c]/10 text-[#1a9d6c]'; 
      case 'user': return 'bg-[#13804e]/10 text-[#13804e]';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPermissionBadgeClass = (permission) => {
    switch(permission) {
      case 'canAddLead': return 'bg-blue-100 text-blue-800';
      case 'canRemoveLead': return 'bg-red-100 text-red-800';
      case 'canViewLeads': return 'bg-green-100 text-green-800';
      case 'canAddUser':
      case 'canRemoveUser': return 'bg-purple-100 text-purple-800';
      case 'bookings': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8 pb-5 border-b border-[#093923]/10">
    <div>
          <h1 className="text-2xl font-bold text-[#093923] flex items-center">
            <UserGroupIcon className="h-6 w-6 mr-2 text-[#13804e]" /> Users Management
          </h1>
          <p className="mt-2 text-sm text-[#13804e]">
            A list of all users including their name, email, role, and permissions.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/users/add"
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-[#093923] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#022316] focus:outline-none focus:ring-2 focus:ring-[#093923]/50 focus:ring-offset-2 sm:w-auto transition-all ease duration-200"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add User
          </Link>
        </div>
      </div>
      
      {users.length === 0 ? (
        <div className="text-center py-12 bg-white shadow-lg rounded-xl border border-[#093923]/10">
          <h3 className="text-lg font-medium text-[#093923]">No users found</h3>
          <p className="mt-2 text-sm text-[#13804e]">
            Get started by creating a new user.
          </p>
          <div className="mt-6">
            <Link
              to="/users/add"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#093923] hover:bg-[#022316] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/50 transition-all ease duration-200"
            >
               <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Add User
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow-lg overflow-hidden border-b border-[#093923]/10 sm:rounded-xl">
                <table className="min-w-full divide-y divide-[#093923]/10">
                  <thead className="bg-[#093923]/5">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                        Permissions
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#093923]/5">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-[#093923]/5 transition-colors ease duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#093923]">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#13804e]">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#093923]/80">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getRoleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#093923]/80">
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(user.permissions || {}).map(([perm, granted]) => 
                                granted ? (
                                  <span key={perm} className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getPermissionBadgeClass(perm)}`}>
                                    {perm.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </span>
                                ) : null
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center space-x-3">
                            <Link
                              to={`/users/edit/${user._id}`}
                              className="text-[#13804e] hover:text-[#0d5c3a] p-1 rounded hover:bg-[#13804e]/10 transition-colors ease duration-200"
                              title={`Edit ${user.name}`}
                            >
                              <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                            </Link>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-[#dc2626] hover:text-[#b91c1c] p-1 rounded hover:bg-[#dc2626]/10 transition-colors ease duration-200"
                              title={`Delete ${user.name}`}
                            >
                              <TrashIcon className="h-5 w-5" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;