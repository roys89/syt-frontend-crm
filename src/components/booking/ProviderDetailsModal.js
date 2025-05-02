import { XMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';

const ProviderDetailsModal = ({ isOpen, onClose, details }) => {
    if (!isOpen) return null;

    const getStatusColor = (status) => {
        if (!status) return 'text-gray-500';
        switch (status.toLowerCase()) {
            case 'confirmed': return 'text-green-600';
            case 'pending': return 'text-yellow-600';
            case 'failed': return 'text-red-600';
            default: return 'text-gray-500';
        }
    };

    const getBooleanStatus = (value) => {
        return value ? 
            <span className="text-green-600 font-medium">Success</span> : 
            <span className="text-red-600 font-medium">Fail</span>;
    };

    return (
        <div className="fixed inset-0 overflow-y-auto z-[10000]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="bg-white w-full max-w-lg rounded-lg shadow-xl p-5 relative flex flex-col">
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-center justify-between mb-4 border-b pb-3">
                        <h2 className="text-lg font-semibold text-gray-800">Provider Booking Details</h2>
                        <button 
                            onClick={onClose} 
                            className="p-1.5 hover:bg-gray-100 rounded-full" 
                            title="Close"
                        >
                            <XMarkIcon className="h-5 w-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-grow overflow-y-auto max-h-[60vh] pr-2 -mr-2 space-y-4">
                        {!details || details.length === 0 ? (
                            <p className="text-center text-gray-500 italic">No provider details found.</p>
                        ) : (
                            details.map((detail, index) => (
                                <div key={detail.itemCode || index} className="p-3 border rounded-md bg-gray-50 space-y-1.5">
                                    <h3 className="font-medium text-sm text-gray-700">Segment {index + 1} (Item: {detail.itemCode || 'N/A'})</h3>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                        <p><span className="text-gray-500">BMS Booking:</span> {getBooleanStatus(detail.isBookingSucessfullOnBMS)}</p>
                                        <p><span className="text-gray-500">Provider Booking:</span> {getBooleanStatus(detail.isBookingSuccessfullByProvider)}</p>
                                        <p><span className="text-gray-500">Provider Status:</span> <span className={`font-medium ${getStatusColor(detail.bookingStatus)}`}>{detail.bookingStatus || 'UNKNOWN'}</span></p>
                                        <p><span className="text-gray-500">Overall Success:</span> {getBooleanStatus(detail.isSuccessful)}</p>
                                    </div>
                                    {detail.error && (
                                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                            <p className="text-xs text-red-700 font-semibold">Error ({detail.error.errorCode || 'N/A'}):</p>
                                            <p className="text-xs text-red-600">{detail.error.errorMessage || 'No error message provided.'}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex-shrink-0 mt-6 text-right border-t pt-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProviderDetailsModal; 