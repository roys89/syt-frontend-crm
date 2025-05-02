import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from 'antd';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toast } from 'react-hot-toast';

// --- Helper Functions (Copied from Hotel Voucher, adjust if needed) ---
const formatDateSimple = (dateString, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
    if (!dateString) return 'N/A';
    try {
        // Handles both Date objects and YYYY-MM-DD strings
        const date = dateString instanceof Date ? dateString : new Date(`${dateString}T00:00:00`); // Assume UTC or local based on input
        if (isNaN(date.getTime())) return String(dateString); // Return original if invalid
        return date.toLocaleDateString('en-US', options);
    } catch (e) { return String(dateString); } // Fallback
};

const formatCurrencySimple = (amount, currency = 'INR') => {
    const num = Number(amount);
    if (amount === null || amount === undefined || isNaN(num)) return 'N/A';
    // Simple INR formatting, adjust if other currencies needed
    try {
         return new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: currency, 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 2 // Allow decimals for currency
        }).format(num);
    } catch (e) {
        // Fallback for unknown currency codes
        return `${currency} ${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
};

const formatTimeSimple = (timeString) => { // Expects HH:MM (24hr)
    if (!timeString || !/^([0-1]\d|2[0-3]):([0-5]\d)$/.test(timeString)) return 'N/A';
    try {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0);
        // Format to 12-hour clock with AM/PM
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
        return timeString; // Fallback
    }
};
// --- END Helper Functions ---

// --- PDF Content Component ---
// This component defines the structure and content of the PDF voucher.
// It receives the `voucherData` (which is the CRM booking data).
const PdfTransferVoucherContent = ({ voucherData }) => {
    if (!voucherData) {
        return <div className="p-4 text-red-500 text-xs">Error: Missing data for PDF rendering.</div>;
    }

    const { 
        bookingRefId = 'N/A',
        status = 'N/A',
        transferDetails = {},
        guestDetails = {},
        paymentDetails = {},
        createdAt // Timestamp from Mongoose
    } = voucherData;

    const { origin = {}, destination = {}, vehicle = {} } = transferDetails;

    return (
        <div className="p-6 font-sans text-gray-800 bg-white w-[210mm] min-h-[297mm] text-[10px]">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-[#093923] pb-4 mb-4">
                <div className="flex items-center">
                    <img 
                        src="/assets/logo/SYT-Logo.png" 
                        alt="Sort Your Trip Logo" 
                        className="h-12 w-auto mr-3" 
                        crossOrigin="anonymous" 
                    />
                    <div>
                        <h1 className="text-lg font-serif font-bold text-[#093923]">Transfer Booking Voucher</h1>
                        <p className="text-[9px] text-gray-500 mt-1">
                            Generated: {formatDateSimple(new Date(), { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
                <div className="text-[9px] text-right">
                    <p>Booking Ref: <span className="font-semibold">{bookingRefId}</span></p>
                    <p>Status: <span className={`font-semibold ${status === 'Confirmed' ? 'text-[#13804e]' : 'text-orange-600'}`}>{status}</span></p>
                    <p>Booked On: <span className="font-semibold">{formatDateSimple(createdAt)}</span></p>
                </div>
            </div>

            {/* Transfer Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-1 pr-4 border-r border-[#e6f0ea]">
                    <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Pickup Details</h2>
                    <div className="shadow-sm p-3 rounded-lg bg-[#e6f0ea] text-[9px]">
                        <p className="font-medium mb-1">{origin.display_address || 'N/A'}</p>
                        <p><strong>Date:</strong> {formatDateSimple(transferDetails.pickupDate)}</p>
                        <p><strong>Time:</strong> {formatTimeSimple(transferDetails.pickupTime)}</p>
                        {guestDetails.flightNumber && <p className="mt-1 text-blue-600"><strong>Flight No:</strong> {guestDetails.flightNumber}</p>}
                    </div>
                </div>
                <div className="col-span-1">
                     <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Dropoff Details</h2>
                     <div className="shadow-sm p-3 rounded-lg bg-[#e6f0ea] text-[9px]">
                         <p className="font-medium mb-1">{destination.display_address || 'N/A'}</p>
                         {/* Add estimated duration or other dropoff info if available */}
                         <p className="text-gray-500 mt-1">Please verify dropoff details with the driver.</p>
                    </div>
                </div>
            </div>

            {/* Vehicle Details */}
            <div className="mb-4">
                 <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Vehicle Details</h2>
                 <div className="shadow-sm p-3 rounded-lg bg-[#e6f0ea] text-[9px]">
                    <p><strong>Type:</strong> {vehicle.class || 'N/A'}</p>
                    <p><strong>Capacity:</strong> {vehicle.capacity ? `${vehicle.capacity} passengers` : 'N/A'}</p>
                    {/* Add specific vehicle notes if available */}
                </div>
            </div>

            {/* Guest Information */}
            <div className="mb-4">
                <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Guest Information</h2>
                <div className="shadow-sm rounded-lg bg-[#e6f0ea] p-3">
                    <table className="w-full border-collapse text-[9px]">
                        <thead>
                            <tr className="bg-[#2a9d6b] text-white">
                                <th className="border border-[#e6f0ea] p-2 text-left font-medium">Name</th>
                                <th className="border border-[#e6f0ea] p-2 text-left font-medium">Email</th>
                                <th className="border border-[#e6f0ea] p-2 text-left font-medium">Phone</th>
                                <th className="border border-[#e6f0ea] p-2 text-center font-medium">Passengers</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className='bg-white border-b border-[#e6f0ea] last:border-b-0 hover:bg-[#2a9d6b]/10'>
                                <td className="border-r border-[#e6f0ea] p-2">{guestDetails.firstName} {guestDetails.lastName} <span className="text-[#13804e] font-medium">(Lead)</span></td>
                                <td className="border-r border-[#e6f0ea] p-2">{guestDetails.email || '-'}</td>
                                <td className="border-r border-[#e6f0ea] p-2">{guestDetails.phone || '-'}</td>
                                <td className="p-2 text-center">{guestDetails.totalPassengers || 'N/A'}</td>
                            </tr>
                            {/* Add rows for other passengers if stored differently */}
                        </tbody>
                    </table>
                     {guestDetails.notes && (
                         <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-[9px]">
                             <strong>Guest Notes:</strong> {guestDetails.notes}
                         </div>
                     )}
                </div>
            </div>

            {/* Pricing Summary */}
            <div className="mb-4 p-3 border rounded-lg bg-[#e6f0ea] shadow-sm">
                <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Pricing Summary</h2>
                <div className="flex justify-between items-center text-[10px]">
                    <span className="font-medium text-gray-700">Total Booking Amount:</span>
                    <span className="font-bold text-base text-[#13804e]">
                        {formatCurrencySimple(paymentDetails.fare, paymentDetails.currency)}
                    </span>
                </div>
                 <p className="text-[9px] text-gray-600 mt-1">Payment Status: <span className="font-medium">{paymentDetails.paymentStatus || 'N/A'}</span></p>
                {/* Add base/tax breakdown if available */} 
            </div>

            {/* Cancellation Policy / Terms */}
            <div className="mb-4">
                <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Important Information</h2>
                <div className="text-[9px] text-gray-600 space-y-1 p-3 border rounded-lg bg-[#e6f0ea] shadow-sm">
                    {/* Extract policy from providerBookingResponse if needed, or add static text */}
                    <p>• Please verify your pickup time and location. Contact support for any changes.</p>
                    <p>• Cancellation policy may apply. Refer to terms provided during booking or contact Sort Your Trip.</p>
                    <p>• Waiting time charges may apply for delays.</p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-3 border-t border-[#093923] text-[8px] text-[#07261a] text-center">
                <p className="font-semibold">Sort Your Trip Pvt. Ltd.</p>
                <p>Contact: support@sortyourtrip.com | Phone: +91-123-456-7890</p>
                <p>Emergency Contact: [Add Emergency Number Here]</p>
                <p>This voucher is computer generated. Please present this voucher (digital or print) if requested.</p>
            </div>
        </div>
    );
};
// --- END PDF Content Component ---


// --- Main Modal Component ---
// Receives `transferVoucherDetails` which should be the *CRM booking data*
const TransferBookingVoucherModal = ({ isOpen, onClose, transferVoucherDetails }) => {
    const [isLoading, setIsLoading] = useState(false);
    // No need for pdfContentRef here as we render directly in the hidden div

    const handleDownloadPDF = async () => {
        if (!transferVoucherDetails || !transferVoucherDetails._id) {
            toast.error('Voucher data (from CRM) is not available for PDF generation.');
            return;
        }
        setIsLoading(true);
        console.log('[PDF Gen] Starting Transfer Voucher PDF Generation...');
        console.log('[PDF Gen] CRM Data Received:', transferVoucherDetails);

        // Data Transformation: CRM data is already structured, so minimal transformation needed.
        // We pass the CRM data directly to PdfTransferVoucherContent.
        const transformedData = { ...transferVoucherDetails }; 
        console.log('[PDF Gen] Data for PDF Component:', transformedData);

        // Create hidden container for rendering
        const containerId = `pdf-render-container-${Date.now()}`;
        let container = document.createElement('div');
        container.id = containerId;
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0px';
        container.style.width = '210mm'; // A4 width
        container.style.zIndex = '-10';
        document.body.appendChild(container);

        let root;
        try {
            // Render the PDF content component in the hidden container
            root = createRoot(container);
            await root.render(<PdfTransferVoucherContent voucherData={transformedData} />); 
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for render

            // Capture with html2canvas
            const canvas = await html2canvas(container, {
                scale: 2.5, 
                useCORS: true, 
                logging: false, // Reduce console noise
                width: container.offsetWidth, 
                height: container.offsetHeight, 
                windowWidth: container.scrollWidth, 
                windowHeight: container.scrollHeight, 
                backgroundColor: '#ffffff', 
                imageTimeout: 15000,
                 onclone: (clonedDoc) => {
                    const containerClone = clonedDoc.querySelector('#' + containerId);
                    if (containerClone) {
                        containerClone.style.position = 'static';
                        containerClone.style.width = '210mm';
                    }
                }
            });

            // Generate PDF with jsPDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
            // Add image slightly inset for better margins
            const imgX = (pdfWidth - (imgProps.width * ratio)) / 2;
            const imgY = imgX > 5 ? 5 : imgX; // Add small top margin if possible
            pdf.addImage(imgData, 'PNG', imgX, imgY, imgProps.width * ratio, imgProps.height * ratio);

            // Save PDF
            const fileName = `Transfer_Voucher_${transformedData.bookingRefId || 'Booking'}.pdf`;
            pdf.save(fileName);
            toast.success(`Voucher PDF "${fileName}" downloaded!`);

        } catch (error) {
            console.error('[PDF Gen] Error during PDF generation process:', error);
            toast.error(`PDF Generation Failed: ${error.message || 'Check console for details.'}`);
        } finally {
            // Cleanup
            if (root) {
                try { root.unmount(); } catch (e) { /* ignore */ }
            }
            if (container && document.body.contains(container)) {
                document.body.removeChild(container);
            }
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    // Loading/Error state for missing data
    if (!transferVoucherDetails) {
         return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-[9999]">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                    <p className="text-center text-red-600">Error: Voucher details not loaded.</p>
                    <Button onClick={onClose} block className="mt-4">Close</Button>
                </div>
            </div>
        );
    }

    // --- Main Modal Structure --- 
    return (
        <div className="fixed inset-0 overflow-y-auto z-[9999]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl p-5 relative overflow-hidden max-h-[95vh] flex flex-col">
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-start justify-between mb-4 border-b pb-3">
                         <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-1">Transfer Voucher</h2>
                            <p className="text-xs text-gray-600">
                                Booking Ref: <span className="font-medium text-gray-800">{transferVoucherDetails.bookingRefId || 'N/A'}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button 
                                type="primary" 
                                style={{ backgroundColor: '#13804e', borderColor: '#13804e' }}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>}
                                onClick={handleDownloadPDF} 
                                disabled={isLoading}
                                loading={isLoading}
                                size="middle"
                            >
                                {isLoading ? 'Generating...' : 'Download PDF'}
                            </Button>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700" 
                                disabled={isLoading}
                                title="Close"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content Area - Displays a preview/summary based on CRM data */}
                    <div className="flex-grow overflow-y-auto pr-2 -mr-2 text-sm">
                         {/* Re-use parts of PdfTransferVoucherContent structure for preview if desired */}
                         {/* Or simply show key details */}
                         <div className="p-4 mb-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="font-semibold text-base mb-2 text-gray-800">Journey Summary</h3>
                            <p><strong>From:</strong> {transferVoucherDetails.transferDetails?.origin?.display_address}</p>
                            <p><strong>To:</strong> {transferVoucherDetails.transferDetails?.destination?.display_address}</p>
                            <p><strong>Date:</strong> {formatDateSimple(transferVoucherDetails.transferDetails?.pickupDate)}</p>
                            <p><strong>Time:</strong> {formatTimeSimple(transferVoucherDetails.transferDetails?.pickupTime)}</p>
                            <p><strong>Vehicle:</strong> {transferVoucherDetails.transferDetails?.vehicle?.class} ({transferVoucherDetails.transferDetails?.vehicle?.capacity} passengers)</p>
                         </div>
                         
                          <div className="p-4 mb-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="font-semibold text-base mb-2 text-gray-800">Lead Guest</h3>
                            <p><strong>Name:</strong> {transferVoucherDetails.guestDetails?.firstName} {transferVoucherDetails.guestDetails?.lastName}</p>
                            <p><strong>Contact:</strong> {transferVoucherDetails.guestDetails?.email} / {transferVoucherDetails.guestDetails?.phone}</p>
                            <p><strong>Passengers:</strong> {transferVoucherDetails.guestDetails?.totalPassengers}</p>
                            {transferVoucherDetails.guestDetails?.flightNumber && <p><strong>Flight Number:</strong> {transferVoucherDetails.guestDetails.flightNumber}</p>}
                         </div>
                         
                         <div className="p-4 mb-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="font-semibold text-base mb-2 text-gray-800">Payment</h3>
                            <p><strong>Total Fare:</strong> {formatCurrencySimple(transferVoucherDetails.paymentDetails?.fare, transferVoucherDetails.paymentDetails?.currency)}</p>
                            <p><strong>Status:</strong> <span className={`font-medium ${transferVoucherDetails.paymentDetails?.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-500'}`}>{transferVoucherDetails.paymentDetails?.paymentStatus}</span></p>
                         </div>

                          <div className="p-4 mb-4 bg-yellow-50 rounded-lg border border-yellow-200 text-xs">
                             <h3 className="font-semibold text-sm mb-1 text-yellow-800">Note</h3>
                             <p className="text-yellow-700">This is a preview based on saved booking data. The downloaded PDF will contain the official voucher format.</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransferBookingVoucherModal; 