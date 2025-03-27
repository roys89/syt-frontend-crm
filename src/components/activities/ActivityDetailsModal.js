import { CheckCircleIcon, ClockIcon, InformationCircleIcon, UserGroupIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import bookingService from '../../services/bookingService';

const ActivityDetailsModal = ({ activity, details, onClose, onConfirm, isInline = false }) => {
  const [numberOfTravelers, setNumberOfTravelers] = useState(1);
  const [travelerAges, setTravelerAges] = useState([{ age: '' }]);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTourGrade, setSelectedTourGrade] = useState(null);
  const [referenceLoading, setReferenceLoading] = useState(false);

  if (!activity || !details) return null;

  const handleTravelerCountChange = (newCount) => {
    if (newCount >= 1) {
      setNumberOfTravelers(newCount);
      const newAges = Array(newCount).fill().map((_, index) => 
        travelerAges[index] || { age: '' }
      );
      setTravelerAges(newAges);
    }
  };

  const handleAgeChange = (index, value) => {
    const newAges = [...travelerAges];
    newAges[index] = { age: value };
    setTravelerAges(newAges);
  };

  const categorizeTravelers = (ages) => {
    let adultCount = 0;
    let childCount = 0;
    let infantCount = 0;
    let seniorCount = 0;
    let youthCount = 0;

    ages.forEach(age => {
      if (age >= 0 && age <= 3) {
        infantCount++;
      } else if (age >= 4 && age <= 12) {
        childCount++;
      } else if (age >= 13 && age <= 75) {
        adultCount++;
      } else if (age > 75) {
        seniorCount++;
      }
    });

    const groupCode = `${adultCount}|${childCount}|${infantCount}|${seniorCount}|${youthCount}`;

    return {
      adultCount,
      childCount,
      infantCount,
      seniorCount,
      youthCount,
      groupCode
    };
  };

  const handleConfirm = async () => {
    // Validate all ages are filled
    if (travelerAges.some(t => !t.age)) {
      alert('Please fill in all traveler ages');
      return;
    }

    // Validate tour grade is selected
    if (!selectedTourGrade) {
      alert('Please select a tour grade');
      return;
    }

    // Convert ages to numbers
    const ages = travelerAges.map(t => parseInt(t.age));
    const { adultCount, childCount, infantCount, seniorCount, youthCount } = categorizeTravelers(ages);

    // Get the base group code from the activity
    const baseGroupCode = activity.groupCode.split('-')[0];
    // Create the age distribution part
    const ageDistribution = `${adultCount}|${childCount}|${infantCount}|${seniorCount}|${youthCount}`;
    // Combine them with a hyphen
    const fullGroupCode = `${baseGroupCode}-${ageDistribution}`;

    setLoading(true);
    setError(null);

    try {
      console.log('Checking availability with:', {
        searchId: activity.searchId,
        code: activity.code,
        groupCode: fullGroupCode,
        tourGrade: selectedTourGrade.gradeCode
      });

      const response = await bookingService.checkAvailability({
        searchId: activity.searchId,
        code: activity.code,
        groupCode: fullGroupCode,
        tourGrade: selectedTourGrade.gradeCode
      });

      console.log('Availability response:', response);

      if (response.success && response.data?.options) {
        setPackages(response.data.options);
        if (response.data.options.length > 0) {
          setSelectedPackage(response.data.options[0]);
        } else {
          setError('No packages available for the selected configuration');
        }
      } else {
        setError(response.message || 'No packages available for the selected configuration');
      }
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError(err.response?.data?.message || 'Failed to fetch available packages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handleBookPackage = async () => {
    if (selectedPackage && selectedTourGrade) {
      setReferenceLoading(true);
      
      try {
        // Create the reference data
        const referenceData = await bookingService.createActivityReference({
          code: activity.code,
          searchId: activity.searchId,
          tourGrade: selectedTourGrade.gradeCode,
          departureTime: selectedPackage.departureTime
        });
        
        console.log('Reference data:', referenceData);
        
        if (!referenceData.success) {
          throw new Error(referenceData.message || 'Failed to create booking reference');
        }
        
        const ages = travelerAges.map(t => parseInt(t.age));
        const { adultCount, childCount, infantCount, seniorCount, youthCount } = categorizeTravelers(ages);

        // Get the base group code from the activity
        const baseGroupCode = activity.groupCode.split('-')[0];
        // Create the age distribution part
        const ageDistribution = `${adultCount}|${childCount}|${infantCount}|${seniorCount}|${youthCount}`;
        // Combine them with a hyphen
        const fullGroupCode = `${baseGroupCode}-${ageDistribution}`;

        // Extract languages from langServices if available
        const languageServices = selectedTourGrade.langServices ? 
          selectedTourGrade.langServices.map(service => service.language) : [];

        // Call onConfirm with all necessary data
        onConfirm({
          ...selectedPackage,
          adults: adultCount,
          children: childCount,
          infants: infantCount,
          seniors: seniorCount,
          youth: youthCount,
          groupCode: fullGroupCode,
          searchId: activity.searchId,
          code: activity.code,
          tourGrade: selectedTourGrade,
          referenceData: referenceData.data,
          numberOfTravelers: numberOfTravelers,
          bookingQuestions: details.bookingQuestions,
          languageGuides: languageServices
        });
      } catch (err) {
        console.error('Error creating reference:', err);
        setError(err.message || 'Failed to create booking reference. Please try again.');
      } finally {
        setReferenceLoading(false);
      }
    }
  };

  const renderContent = () => (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Images, Age Requirements, and Package Selection */}
        <div className="space-y-4">
          <div className="relative aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-lg">
            <img
              src={details.images?.[0]?.variants?.[0]?.url || activity.imgURL}
              alt={details.title}
              className="w-full h-full object-cover"
            />
          </div>
          {details.images && details.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {details.images.slice(1, 5).map((img, index) => (
                <div key={index} className="relative aspect-w-1 aspect-h-1 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                  <img
                    src={img.variants[0].url}
                    alt={`${details.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Age Bands - Moved to left column */}
          {details.ageBands && details.ageBands.length > 0 && (
            <div className="bg-purple-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <UserGroupIcon className="h-6 w-6 text-purple-500 mr-2" />
                Age Requirements
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {details.ageBands.map((band, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="font-medium text-gray-900">{band.ageBand}</div>
                    <div className="text-gray-600">{band.startAge} - {band.endAge} years</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tour Grade Selection */}
          {details.tourGrades && details.tourGrades.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Select Tour Grade</h3>
              <div className="space-y-3">
                {details.tourGrades.map((grade) => (
                  <div
                    key={grade.gradeCode}
                    onClick={() => setSelectedTourGrade(grade)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedTourGrade?.gradeCode === grade.gradeCode
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{grade.description}</h4>
                        <p className="text-sm text-gray-500">Grade Code: {grade.gradeCode}</p>
                      </div>
                      {selectedTourGrade?.gradeCode === grade.gradeCode && (
                        <CheckCircleIcon className="h-5 w-5 text-indigo-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Get Package Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Get Package</h3>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Number of Travelers
                </label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleTravelerCountChange(numberOfTravelers - 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold text-gray-900 w-8 text-center">{numberOfTravelers}</span>
                    <button
                      onClick={() => handleTravelerCountChange(numberOfTravelers + 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-sm text-gray-500">
                    {numberOfTravelers} Traveler{numberOfTravelers > 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Traveler Ages
                </label>
                <div className="space-y-3">
                  {travelerAges.map((traveler, index) => (
                    <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          min="0"
                          max="120"
                          value={traveler.age}
                          onChange={(e) => handleAgeChange(index, e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="Enter age"
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-500 whitespace-nowrap">years old</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="w-full px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-lg hover:shadow-xl text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Get Package'}
                </button>
              </div>

              {/* Available Packages */}
              {packages.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Available Packages</h4>
                  <div className="space-y-3">
                    {packages.map((pkg, index) => (
                      <div
                        key={index}
                        onClick={() => handlePackageSelect(pkg)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedPackage?.ratekey === pkg.ratekey
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-gray-900">{pkg.title}</h5>
                            <p className="text-sm text-gray-500">{pkg.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-indigo-600">
                              {pkg.currency} {pkg.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">Departure: {pkg.departureTime}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {selectedPackage && (
                <div className="pt-4">
                  <button
                    onClick={handleBookPackage}
                    disabled={referenceLoading}
                    className="w-full px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-lg hover:shadow-xl text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {referenceLoading ? 'Processing...' : 'Book Selected Package'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="space-y-8">
          {/* Description */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">About this activity</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{details.description}</p>
          </div>

          {/* Inclusions */}
          {details.inclusions && details.inclusions.length > 0 && (
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
                Inclusions
              </h3>
              <ul className="space-y-3">
                {details.inclusions.map((inclusion, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{inclusion.otherDescription || inclusion.typeDescription}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Exclusions */}
          {details.exclusions && details.exclusions.length > 0 && (
            <div className="bg-red-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <XCircleIcon className="h-6 w-6 text-red-500 mr-2" />
                Exclusions
              </h3>
              <ul className="space-y-3">
                {details.exclusions.map((exclusion, index) => (
                  <li key={index} className="flex items-start">
                    <XCircleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{exclusion.otherDescription}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional Info */}
          {details.additionalInfo && details.additionalInfo.length > 0 && (
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <InformationCircleIcon className="h-6 w-6 text-blue-500 mr-2" />
                Additional Information
              </h3>
              <ul className="space-y-3">
                {details.additionalInfo.map((info, index) => (
                  <li key={index} className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-900">{info.type.replace(/_/g, ' ')}</span>
                      <p className="text-gray-600">{info.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // For inline rendering
  if (isInline) {
    return (
      <div className="bg-white rounded-lg shadow-lg">
        <div className="bg-white border-b border-gray-100 p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{details.title}</h2>
              <div className="flex items-center text-gray-500">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span>{details.duration}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        {renderContent()}
      </div>
    );
  }

  // For modal/popup rendering
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{details.title}</h2>
              <div className="flex items-center text-gray-500">
                <ClockIcon className="h-5 w-5 mr-2" />
                <span>{details.duration}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default ActivityDetailsModal;