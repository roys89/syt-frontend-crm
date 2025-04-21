// src/components/dashboard/RecentLeadsTable.js
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import leadService from '../../services/leadService';

const RecentLeadsTable = () => {
  const [recentLeads, setRecentLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecentLeads = async () => {
      try {
        setIsLoading(true);
        const response = await leadService.getLeads({ 
          limit: 5, 
          sort: '-createdAt' 
        });
        setRecentLeads(response.data.data || []);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching recent leads:', error);
        setRecentLeads([]);
        setIsLoading(false);
      }
    };

    fetchRecentLeads();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="mt-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900">Recent Leads</h2>
          <p className="mt-2 text-sm text-gray-700">A list of the most recent leads added to the system.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/leads"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            View all
          </Link>
        </div>
      </div>
      
      {recentLeads.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg mt-6">
          <h3 className="text-lg font-medium text-gray-900">No leads yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by creating your first lead.
          </p>
          <div className="mt-6">
            <Link
              to="/leads/add"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Lead
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Name
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Email
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date Added
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {recentLeads.map((lead) => (
                      <tr key={lead._id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {lead.firstName} {lead.lastName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{lead.email}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 
                            lead.status === 'contacted' ? 'bg-purple-100 text-purple-800' :
                            lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                            lead.status === 'proposal' ? 'bg-yellow-100 text-yellow-800' :
                            lead.status === 'negotiation' ? 'bg-orange-100 text-orange-800' :
                            lead.status === 'closed_won' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {lead.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(lead.createdAt)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link to={`/leads/view/${lead._id}`} className="text-indigo-600 hover:text-indigo-900">
                            View
                          </Link>
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

export default RecentLeadsTable;