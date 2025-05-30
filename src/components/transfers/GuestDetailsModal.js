import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

const GuestDetailsModal = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    total_passenger: 1,
    flight_number: '',
    comments: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (formData.total_passenger < 1) {
      newErrors.total_passenger = 'Total passengers must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Guest Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className={`mt-1 block w-full rounded-md border ${errors.first_name ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#13804e] focus:ring-[#13804e] sm:text-sm h-10 px-3`}
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className={`mt-1 block w-full rounded-md border ${errors.last_name ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#13804e] focus:ring-[#13804e] sm:text-sm h-10 px-3`}
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`mt-1 block w-full rounded-md border ${errors.email ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#13804e] focus:ring-[#13804e] sm:text-sm h-10 px-3`}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className={`mt-1 block w-full rounded-md border ${errors.phone ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#13804e] focus:ring-[#13804e] sm:text-sm h-10 px-3`}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          <div>
            <label htmlFor="total_passenger" className="block text-sm font-medium text-gray-700">
              Total Passengers <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="total_passenger"
              name="total_passenger"
              min="1"
              value={formData.total_passenger}
              onChange={handleChange}
              required
              className={`mt-1 block w-full rounded-md border ${errors.total_passenger ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-[#13804e] focus:ring-[#13804e] sm:text-sm h-10 px-3`}
            />
            {errors.total_passenger && (
              <p className="mt-1 text-sm text-red-600">{errors.total_passenger}</p>
            )}
          </div>

          <div>
            <label htmlFor="flight_number" className="block text-sm font-medium text-gray-700">
              Flight Number (Optional)
            </label>
            <input
              type="text"
              id="flight_number"
              name="flight_number"
              value={formData.flight_number}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#13804e] focus:ring-[#13804e] sm:text-sm h-10 px-3"
            />
          </div>

          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
              Comments (Optional)
            </label>
            <textarea
              id="comments"
              name="comments"
              rows="3"
              value={formData.comments}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-[#13804e] focus:ring-[#13804e] sm:text-sm px-3 py-2"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#093923] hover:bg-[#13804e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923] disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestDetailsModal; 