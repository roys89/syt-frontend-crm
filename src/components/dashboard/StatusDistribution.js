import { useEffect, useState } from 'react';
import leadService from '../../services/leadService';

const StatusDistribution = () => {
  const [statusData, setStatusData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeadStatus = async () => {
      try {
        setIsLoading(true);
        const response = await leadService.getLeads();
        const leads = response.data;
        
        // Count leads by status
        const statusCount = {
          new: 0,
          contacted: 0,
          qualified: 0,
          proposal: 0,
          negotiation: 0,
          closed_won: 0,
          closed_lost: 0
        };
        
        leads.forEach(lead => {
          if (statusCount.hasOwnProperty(lead.status)) {
            statusCount[lead.status]++;
          }
        });
        
        setStatusData(statusCount);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching lead status data:', error);
        setIsLoading(false);
      }
    };

    fetchLeadStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const formatStatusLabel = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const statusColors = {
    new: 'bg-blue-500',
    contacted: 'bg-purple-500',
    qualified: 'bg-green-500',
    proposal: 'bg-yellow-500',
    negotiation: 'bg-orange-500',
    closed_won: 'bg-emerald-500',
    closed_lost: 'bg-red-500'
  };

  // Calculate total for percentages
  const total = Object.values(statusData).reduce((sum, count) => sum + count, 0);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900">Lead Status Distribution</h2>
      <p className="mt-2 text-sm text-gray-700">Current distribution of leads by status</p>
      
      <div className="mt-6 bg-white shadow px-6 py-6 rounded-lg">
        {total === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No lead data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(statusData).map(([status, count]) => {
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={status}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {formatStatusLabel(status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {count} ({percentage}%)
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${statusColors[status]} h-2 rounded-full`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusDistribution;