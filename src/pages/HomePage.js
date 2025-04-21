// src/pages/HomePage.js
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                src="/assets/logo/SYT-Logo.png" 
                alt="SortYourTrip" 
                className="h-10"
              />
            </div>
            <div className="hidden md:flex items-center">
              <div className="flex items-center text-[#093923] bg-[#093923]/5 px-4 py-2 rounded-full">
                <svg 
                  className="w-5 h-5 mr-2" 
              fill="none"
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                  />
            </svg>
                <span className="text-sm font-medium">Secured Environment</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                <span className="block">Welcome to</span>
                <span className="block text-[#093923]">SortYourTrip CRM</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg">
                Your comprehensive travel management system for handling leads, creating itineraries, and managing customer relationships all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/login"
                  className="px-8 py-3 bg-[#093923] text-white rounded-lg hover:bg-[#093923]/90 transition-colors duration-200 text-center font-medium"
                >
                  Access CRM
                </Link>
                <Link
                  to="/help"
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-center font-medium"
                >
                  View Help Guide
                  </Link>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-[#093923] mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Secure Access
                </div>
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-[#093923] mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  24/7 Support
                </div>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  className="w-full h-auto"
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
                  alt="CRM Dashboard"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[#093923]/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#093923]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Team Members</p>
                    <p className="text-2xl font-bold text-[#093923]">Online</p>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Key Features</h2>
            <p className="mt-4 text-lg text-gray-600">Everything you need to manage your travel business efficiently</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Lead Management */}
            <div className="group relative bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-[#093923]/5 rounded-full transform rotate-45"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-[#093923]/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-[#093923]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Lead Management</h3>
                <p className="text-gray-600 mb-4">Track and manage customer inquiries efficiently with our advanced lead tracking system.</p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-[#093923] mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Lead Tracking
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-[#093923] mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Customer History
                  </li>
                </ul>
              </div>
            </div>

            {/* Itinerary Planning */}
            <div className="group relative bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-[#093923]/5 rounded-full transform rotate-45"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-[#093923]/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-[#093923]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Itinerary Planning</h3>
                <p className="text-gray-600 mb-4">Create and manage detailed travel itineraries with our intuitive planning tools.</p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-[#093923] mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Visual Timeline
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-[#093923] mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Real-time Updates
                  </li>
                </ul>
              </div>
            </div>

            {/* Analytics */}
            <div className="group relative bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-[#093923]/5 rounded-full transform rotate-45"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-[#093923]/10 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-[#093923]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Analytics</h3>
                <p className="text-gray-600 mb-4">Monitor and analyze your business performance with detailed insights.</p>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-[#093923] mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Performance Metrics
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-[#093923] mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Custom Reports
                  </li>
                </ul>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;