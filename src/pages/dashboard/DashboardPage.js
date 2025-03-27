// src/pages/dashboard/DashboardPage.js
import DashboardStats from '../../components/dashboard/DashboardStats';
import RecentLeadsTable from '../../components/dashboard/RecentLeadsTable';
import StatusDistribution from '../../components/dashboard/StatusDistribution';

const DashboardPage = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-700">
        An overview of your itinerary planning business
      </p>
      
      <DashboardStats />
      
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <StatusDistribution />
        <RecentLeadsTable />
      </div>
    </div>
  );
};

export default DashboardPage;