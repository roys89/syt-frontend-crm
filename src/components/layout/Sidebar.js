// src/components/layout/Sidebar.js
import {
    CalendarIcon,
    HomeIcon,
    PhoneIcon,
    UserIcon,
    UsersIcon
} from '@heroicons/react/24/outline';
import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Sidebar = () => {
const { user } = useContext(AuthContext);
const location = useLocation();

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Leads', href: '/leads', icon: PhoneIcon },
  {
    name: 'Bookings',
    href: '/bookings',
    icon: CalendarIcon,
    subItems: [
      { name: 'Booking Details', href: '/bookings' },
      { name: 'Create Booking', href: '/bookings/create' },
      (user?.permissions?.canBookItineraries || user?.role === 'admin') && 
        { name: 'Itinerary Booking', href: '/bookings/itinerary' },
    ].filter(Boolean)
  },
  user?.role === 'admin' && { name: 'Users', href: '/users', icon: UsersIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon },
].filter(Boolean);

// Function to check if current path includes the href
const isActive = (href) => {
  return location.pathname === href || location.pathname.startsWith(`${href}/`);
};

return (
  <div className="hidden md:flex md:w-64 md:flex-col">
    <div className="flex flex-col flex-grow pt-5 bg-gray-800 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4 text-white text-xl font-bold">
        SYT CRM
      </div>
      <div className="mt-5 flex-1 flex flex-col">
        <nav className="flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <div key={item.name}>
              <Link
                to={item.href}
                className={`${
                  isActive(item.href)
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon
                  className={`${
                    isActive(item.href) ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-300'
                  } mr-3 flex-shrink-0 h-6 w-6`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
              
              {item.subItems && isActive(item.href) && (
                <div className="pl-10 mt-1 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.name}
                      to={subItem.href}
                      className={`${ 
                        location.pathname === subItem.href
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white'
                      } group flex items-center px-2 py-1 text-sm rounded-md`}
                    >
                      {subItem.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs font-medium text-gray-300">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default Sidebar;