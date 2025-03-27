// src/components/dashboard/DashboardStats.js
import {
    CheckCircleIcon,
    CurrencyDollarIcon,
    PhoneIcon,
    UsersIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import leadService from '../../services/leadService';
import userService from '../../services/userService';

const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    closedWon: 0,
    userCount: 0,
    conversionRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch leads
        const leadsResponse = await leadService.getLeads();
        const leads = leadsResponse.data;
        
        // Fetch users
        const usersResponse = await userService.getUsers();
        const users = usersResponse.data;

        // Calculate stats
        const totalLeads = leads.length;
        const newLeads = leads.filter(lead => lead.status === 'new').length;
        const closedWon = leads.filter(lead => lead.status === 'closed_won').length;
        const userCount = users.length;
        
        // Calculate conversion rate
        const conversionRate = totalLeads > 0 
          ? ((closedWon / totalLeads) * 100).toFixed(1) 
          : 0;

        setStats({
          totalLeads,
          newLeads,
          closedWon,
          userCount,
          conversionRate
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const statItems = [
    {
      name: 'Total Leads',
      value: stats.totalLeads,
      icon: PhoneIcon,
      iconColor: 'bg-indigo-500',
      link: '/leads'
    },
    {
      name: 'New Leads',
      value: stats.newLeads,
      icon: PhoneIcon,
      iconColor: 'bg-blue-500',
      link: '/leads'
    },
    {
      name: 'Closed (Won)',
      value: stats.closedWon,
      icon: CheckCircleIcon,
      iconColor: 'bg-green-500',
      link: '/leads'
    },
    {
      name: 'Users',
      value: stats.userCount,
      icon: UsersIcon,
      iconColor: 'bg-purple-500',
      link: '/users'
    },
    {
      name: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      icon: CurrencyDollarIcon,
      iconColor: 'bg-yellow-500',
      link: '/leads'
    }
  ];

  return (
    <div>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statItems.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-md p-3 ${item.iconColor}`}>
                  <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                    <dd>
                      <div className="text-lg font-bold text-gray-900">{item.value}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link to={item.link} className="font-medium text-indigo-600 hover:text-indigo-500">
                  View details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardStats;