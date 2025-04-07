import { format } from 'date-fns';
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const CrmActivitySearchFormModal = ({ isOpen, onClose, onSearch, initialData }) => {
    // Initialize state with potentially pre-filled data
    const [searchDate, setSearchDate] = useState('');
    // Add more state for other potential activity search fields (e.g., keywords, categories)
    // const [keywords, setKeywords] = useState('');

    // Pre-fill form when modal opens or initialData changes
    useEffect(() => {
        if (isOpen && initialData) {
            setSearchDate(initialData.date || '');
            // setKeywords(''); // Reset other fields if needed
        }
    }, [isOpen, initialData]);

    const handleSearchClick = (e) => {
        e.preventDefault(); // Prevent default form submission
        // Pass the current form state back
        onSearch({
            date: searchDate,
            // keywords: keywords,
            // Add other search criteria here
        });
    };

    // Format date for display
    const formattedDate = searchDate ? format(new Date(searchDate), 'eee, dd MMM yyyy') : 'N/A';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-lg shadow-xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-t-lg">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Search Activities in {initialData?.city || 'N/A'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSearchClick} className="flex-grow overflow-y-auto p-5 space-y-4">
                    {/* Date Field (potentially read-only or changeable) */}
                    <div>
                        <label htmlFor="activity-date" className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                        </label>
                        <input
                            id="activity-date"
                            type="date"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                         <p className="text-xs text-gray-500 mt-1">Searching for activities on: {formattedDate}</p>
                    </div>

                    {/* Example: Keyword Search (Uncomment and add state if needed) */}
                    {/*
                    <div>
                        <label htmlFor="activity-keywords" className="block text-sm font-medium text-gray-700 mb-1">
                            Keywords (optional)
                        </label>
                        <input
                            id="activity-keywords"
                            type="text"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            placeholder="e.g., museum, tour, show"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    */}

                    {/* Add more fields as needed (e.g., categories dropdown) */}

                </form>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
                    <button
                        type="button" // Ensure it doesn't submit the form by default
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit" // Trigger form's onSubmit
                        onClick={handleSearchClick} // Can also call handler directly
                        className="px-5 py-2 rounded-md text-white text-sm font-medium bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                        Search Activities
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CrmActivitySearchFormModal;
