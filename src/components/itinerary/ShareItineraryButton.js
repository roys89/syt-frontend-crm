import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { toast } from 'react-toastify';

const ShareItineraryButton = ({ itineraryToken, inquiryToken }) => {
  const [isCopying, setIsCopying] = useState(false);

  const generateShareableLink = () => {
    const customerBaseUrl = process.env.REACT_APP_CUSTOMER_FRONTEND_URL || 'http://localhost:3001';
    return `${customerBaseUrl}/itinerary?itineraryToken=${itineraryToken}&inquiryToken=${inquiryToken}`;
  };

  const handleShare = async () => {
    try {
      setIsCopying(true);
      const shareableLink = generateShareableLink();
      await navigator.clipboard.writeText(shareableLink);
      toast.success('Shareable link copied to clipboard!');
    } catch (error) {
      console.error('Error sharing link:', error);
      toast.error('Failed to copy link to clipboard');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isCopying || !itineraryToken || !inquiryToken}
      className="inline-flex items-center text-gray-700 hover:text-indigo-600 p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Copy Shareable Link"
    >
      <span className="sr-only">Copy Shareable Link</span>
      <ClipboardDocumentIcon className="h-5 w-5" />
    </button>
  );
};

export default ShareItineraryButton; 