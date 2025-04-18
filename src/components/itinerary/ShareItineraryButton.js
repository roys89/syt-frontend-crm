import { LinkIcon } from '@heroicons/react/24/outline';
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
      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
    >
      <LinkIcon className="-ml-0.5 mr-2 h-4 w-4" />
      {isCopying ? 'Copying...' : 'Share Link'}
    </button>
  );
};

export default ShareItineraryButton; 