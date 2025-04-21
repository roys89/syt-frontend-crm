// src/pages/auth/LoginPage.js
import LoginForm from '../../components/auth/LoginForm';

const LoginPage = () => {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Column - Login Form */}
        <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <LoginForm />
        </div>

        {/* Right Column - Image */}
        <div className="hidden lg:block relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#093923]/90 to-[#093923]/70"></div>
          <img
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
            alt="Travel Team"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-md px-8 text-center">
              <h2 className="text-4xl font-bold text-white mb-6">
                Welcome to SortYourTrip CRM
              </h2>
              <p className="text-lg text-white/90 mb-8">
                Your comprehensive travel management system for handling leads, creating itineraries, and managing customer relationships.
              </p>
              <div className="flex items-center justify-center space-x-4 text-white">
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Secure Access
                </div>
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  24/7 Support
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;