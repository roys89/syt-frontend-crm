import { X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

const CrmAddActivityDetailModal = ({
    isOpen,
    onClose,
    selectedActivity,
    itineraryToken,
    inquiryToken,
    searchId,
    travelersDetails,
    city,
    date,
    onActivityAdded
}) => {
    const [isAdding, setIsAdding] = useState(false);

    if (!isOpen || !selectedActivity) return null;

    const handleAddActivity = async () => {
        if (!itineraryToken || !inquiryToken || !selectedActivity?.code || !city || !date || !travelersDetails) {
            toast.error("Cannot add activity: Missing required information.");
            console.error("Missing data for adding activity:", { 
                itineraryToken, 
                inquiryToken, 
                activityCode: selectedActivity?.code, 
                city, 
                date, 
                travelersDetails 
            });
            return;
        }

        setIsAdding(true);
        try {
            const response = await fetch(
                `http://localhost:5000/api/itinerary/${itineraryToken}/activity`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Inquiry-Token': inquiryToken,
                        'Authorization': `Bearer ${localStorage.getItem('crmToken')}`
                    },
                    body: JSON.stringify({
                        cityName: city,
                        date: date,
                        activityCode: selectedActivity.code,
                        travelersDetails: travelersDetails,
                        searchId: searchId // Pass the searchId if available
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to add activity');
            }

            toast.success("Activity added successfully!");
            onActivityAdded();
        } catch (error) {
            console.error('Error adding activity:', error);
            toast.error(`Error adding activity: ${error.message}`);
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-t-lg">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Add Activity: {selectedActivity.title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-grow overflow-y-auto p-5">
                    <div className="space-y-4">
                        {/* Activity Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                                <p className="mt-1 text-gray-900">{date}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                                <p className="mt-1 text-gray-900">{city}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Price</h3>
                                <p className="mt-1 text-gray-900">₹{selectedActivity.amount?.toLocaleString('en-IN') || 'N/A'}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Travelers</h3>
                                <p className="mt-1 text-gray-900">
                                    {travelersDetails?.adults || 0} Adults, {travelersDetails?.children || 0} Children
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        {selectedActivity.description && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                                <p className="mt-1 text-gray-900">{selectedActivity.description}</p>
                            </div>
                        )}

                        {/* Additional Information */}
                        {selectedActivity.additionalInfo && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500">Additional Information</h3>
                                <p className="mt-1 text-gray-900">{selectedActivity.additionalInfo}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm font-medium"
                        disabled={isAdding}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddActivity}
                        className="px-5 py-2 rounded-md text-white text-sm font-medium bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isAdding}
                    >
                        {isAdding ? 'Adding...' : 'Add Activity'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CrmAddActivityDetailModal; 