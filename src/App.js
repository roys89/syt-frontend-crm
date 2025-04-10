// src/App.js
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import HomePage from './pages/HomePage';
import AddLeadPage from './pages/leads/AddLeadPage';
import EditLeadPage from './pages/leads/EditLeadPage';
import LeadsPage from './pages/leads/LeadsPage';
import UploadLeadsPage from './pages/leads/UploadLeadsPage';
import ViewLeadPage from './pages/leads/ViewLeadPage';
import NotFoundPage from './pages/NotFoundPage';
import ProfilePage from './pages/profile/ProfilePage';
import AddUserPage from './pages/users/AddUserPage';
import EditUserPage from './pages/users/EditUserPage';
import UsersPage from './pages/users/UsersPage';

// Booking Pages
import ActivityBookingPage from './pages/bookings/ActivityBookingPage';
import BookingsPage from './pages/bookings/BookingsPage';
import CrmChangeActivitiesPage from './pages/bookings/changePage/CrmChangeActivitiePage';
import CrmChangeFlightPage from './pages/bookings/changePage/CrmChangeFlightPage';
import CrmChangeHotelsPage from './pages/bookings/changePage/CrmChangeHotelPage';
import CreateBookingPage from './pages/bookings/CreateBookingPage';
import FlightBookingPage from './pages/bookings/FlightBookingPage';
import HotelBookingPage from './pages/bookings/HotelBookingPage';
import ItineraryBookingPage from './pages/bookings/ItineraryBookingPage';
import TransferBookingPage from './pages/bookings/TransferBookingPage';

// Route Guards
import AdminRoute from './utils/AdminRoute';
import BookingRoute from './utils/BookingRoute';
import PrivateRoute from './utils/PrivateRoute';

// --- Placeholder for the new page component ---
// const CrmAddHotelResultsPage = () => <div>Add Hotel Results Page (Placeholder)</div>; // TODO: Replace with actual component import

// Import the actual component
import CrmAddActivityResultsPage from './pages/bookings/addPage/CrmAddActivityResultsPage';
import CrmAddFlightResultsPage from './pages/bookings/addPage/CrmAddFlightResultsPage';
import CrmAddHotelResultsPage from './pages/bookings/addPage/CrmAddHotelResultsPage';
import CrmAddTransferResultsPage from './pages/bookings/addPage/CrmAddTransferResultsPage';




function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              
              {/* Leads Routes */}
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/leads/add" element={<AddLeadPage />} />
              <Route path="/leads/edit/:id" element={<EditLeadPage />} />
              <Route path="/leads/view/:id" element={<ViewLeadPage />} />
              <Route path="/leads/upload" element={<UploadLeadsPage />} />
              
              {/* Booking Routes (Requires 'bookings' permission or admin) */}
              <Route element={<BookingRoute />}>
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/bookings/create" element={<CreateBookingPage />} />
                <Route path="/bookings/itinerary" element={<ItineraryBookingPage />} />
                <Route path="/bookings/itinerary/:itineraryToken" element={<ItineraryBookingPage />} />
                <Route path="/crm/itinerary/:itineraryToken/change-hotel/:city/:checkIn/:checkOut" element={<CrmChangeHotelsPage />} />
                <Route path="/crm/change-activity/:itineraryToken/:city/:date" element={<CrmChangeActivitiesPage />} />
                <Route path="/crm/itinerary/:itineraryToken/add-hotel-results/:city/:checkIn/:checkOut" element={<CrmAddHotelResultsPage />} />
                <Route path="/crm/itinerary/:itineraryToken/add-activity/:city/:date" element={<CrmAddActivityResultsPage />} />
                <Route path="/crm/itinerary/:itineraryToken/add-transfer-results/:city/:date" element={<CrmAddTransferResultsPage />} />
                <Route path="/crm/itinerary/:itineraryToken/add-flight-results/:date/:origin/:destination" element={<CrmAddFlightResultsPage />} />
                <Route path="/crm/itinerary/:itineraryToken/change-flight-results" element={<CrmChangeFlightPage />} />
                <Route path="/bookings/flight" element={<FlightBookingPage />} />
                <Route path="/bookings/hotel" element={<HotelBookingPage />} />
                <Route path="/bookings/activity" element={<ActivityBookingPage />} />
                <Route path="/bookings/transfer" element={<TransferBookingPage />} />
              </Route>
              
              {/* Users Routes (Admin Only) */}
              <Route element={<AdminRoute />}>
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/add" element={<AddUserPage />} />
                <Route path="/users/edit/:id" element={<EditUserPage />} />
              </Route>
              
              {/* Profile Route */}
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
          
          {/* Catch All Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;