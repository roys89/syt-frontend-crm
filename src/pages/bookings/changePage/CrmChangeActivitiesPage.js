import { TicketIcon } from '@heroicons/react/24/outline';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

// --- Import the actual filter menu --- 
import CrmActivityFilterMenu from '../../../components/itinerary/modals/change/CrmActivityFilterMenu';

// --- Import the actual components --- 
import CrmChangeActivityDetailModal from '../../../components/itinerary/modals/change/CrmChangeActivityDetailModal';

// Helper function to format currency (moved from card)
const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return 'N/A';
    }
    // Assuming INR for consistency, adjust if needed
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

const CrmChangeActivitiesPage = () => {
    const { itineraryToken, city, date } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Extract state passed from CrmActivityCard
    const { oldActivityCode, existingPrice, inquiryToken, travelersDetails } = location.state || {};

    // --- State --- 
    const [activities, setActivities] = useState([]);
    const [visibleActivities, setVisibleActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1); // Typically 1-based for pagination display
    const [itemsPerPage] = useState(12); // Adjust as needed

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActivityForModal, setSelectedActivityForModal] = useState(null);

    // Filter & Sort State
    const [filters, setFilters] = useState({
        search: '',
        price: [0, 0]
    });
    const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
    const [currentSort, setCurrentSort] = useState('priceAsc'); // Default sort
    // --- End State --- 

    // --- Data Fetching --- 
    const fetchActivities = useCallback(async () => {
        if (!inquiryToken || !city || !date) {
            setError("Missing required information to fetch activities.");
            setLoading(false);
            console.error("Missing data for fetching activities:", { inquiryToken, city, date });
            return;
        }
        setLoading(true);
        setError(null);
        console.log(`Fetching activities for ${city} on ${date} using inquiry ${inquiryToken}`);
        try {
            // Use the endpoint from customer frontend: `GET /api/itinerary/activities/:inquiryToken/:city/:date`
            const apiUrl = `http://localhost:5000/api/itinerary/activities/${inquiryToken}/${encodeURIComponent(city)}/${date}`;
            const response = await fetch(apiUrl, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'X-Inquiry-Token': inquiryToken,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `Failed to fetch activities (${response.status})`);
            }

            const data = await response.json();
            console.log("API Response:", data);

            // Validate and process data (similar to customer frontend)
            if (!data || !Array.isArray(data.data)) {
                throw new Error('Invalid response structure from activities API');
            }

            const fetchedActivities = data.data
                .filter(item => item && typeof item === 'object' && item.code && item.title && typeof item.amount === 'number')
                .map(item => ({ ...item, amount: Number(item.amount) || 0 }));

            // Filter out the activity being replaced
            const availableActivities = fetchedActivities.filter(act => act.code !== oldActivityCode);
            
            if (availableActivities.length === 0) {
                setError("No alternative activities found for this city and date.");
                setActivities([]);
            } else {
                 setActivities(availableActivities);
                 // Calculate price range from valid alternatives
                 const prices = availableActivities.map(a => a.amount);
                 const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                 const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                 setPriceRange({ min: minPrice, max: maxPrice });
                 setFilters(prev => ({ ...prev, price: [minPrice, maxPrice] }));
                 setError(null); // Clear error if activities are found
            }

        } catch (err) {
            console.error("Error fetching activities:", err);
            setError(err.message);
            setActivities([]);
        } finally {
            setLoading(false);
        }
    }, [inquiryToken, city, date, oldActivityCode]);

    // Fetch activities on mount or when context changes
    useEffect(() => {
        if (!location.state || !inquiryToken || !oldActivityCode || !city || !date) {
            toast.error("Missing required activity change context. Returning.");
             // Navigate back to the itinerary display page (using state mechanism)
             if (itineraryToken && inquiryToken) {
                 navigate('/bookings/itinerary', { state: { itineraryToken, inquiryToken } });
             } else {
                 navigate('/bookings'); // Fallback
             }
            return;
        }
        fetchActivities();
    }, [fetchActivities, location.state, inquiryToken, oldActivityCode, city, date, navigate, itineraryToken]); // Added dependencies
    // --- End Data Fetching ---

    // --- Filtering & Sorting --- 
    const filteredAndSortedActivities = useMemo(() => {
        return activities.filter(activity => {
            const matchesSearch = !filters.search ||
                activity.title.toLowerCase().includes(filters.search.toLowerCase());
            const price = activity.amount;
            const matchesPrice = price >= filters.price[0] && price <= filters.price[1];
            return matchesSearch && matchesPrice;
        }).sort((a, b) => {
            switch (currentSort) {
                case 'priceAsc': return a.amount - b.amount;
                case 'priceDesc': return b.amount - a.amount;
                case 'nameAsc': return a.title.localeCompare(b.title);
                // Add other sort cases if needed (e.g., rating)
                default: return 0;
            }
        });
    }, [activities, filters, currentSort]);

    // --- Pagination Logic (Example) ---
    const paginatedActivities = useMemo(() => {
        const startIndex = (page - 1) * itemsPerPage;
        return filteredAndSortedActivities.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedActivities, page, itemsPerPage]);
    const totalPages = Math.ceil(filteredAndSortedActivities.length / itemsPerPage);
    // --- End Pagination --- 

    // --- Event Handlers --- 
    const handleFilterChange = useCallback((type, value) => {
        if (type === 'reset') {
            setFilters({ search: '', price: [priceRange.min, priceRange.max] });
        } else {
            setFilters(prev => ({ ...prev, [type]: value }));
        }
        setPage(1); // Reset to first page on filter change
    }, [priceRange]);

    const handleSortChange = (value) => {
        setCurrentSort(value);
        setPage(1); // Reset to first page on sort change
    };

    const handleSelectActivity = (activity) => {
        console.log("Selected activity for modal:", activity);
        setSelectedActivityForModal(activity);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedActivityForModal(null), 300);
    };

    const handleBackToItinerary = () => {
        if (itineraryToken && inquiryToken) {
             navigate('/bookings/itinerary', { state: { itineraryToken, inquiryToken } });
        } else {
             console.error("Cannot navigate back: itineraryToken or inquiryToken missing.");
             toast.error("Could not determine which itinerary to return to.");
             navigate('/bookings');
        }
    };

    const handleActivityChangedSuccessfully = () => {
        toast.success("Activity successfully changed in the itinerary!");
        handleCloseModal();
        handleBackToItinerary();
    };
    // --- End Event Handlers --- 

    return (
        <div className="px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 pt-1 md:pt-2 lg:pt-3 bg-gray-100 min-h-screen flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200 bg-white p-4 py-3 rounded-lg shadow-lg sticky top-0 z-10">
                <div className="flex items-center gap-3 flex-grow min-w-0">
                     <button
                        onClick={handleBackToItinerary}
                        className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                        title="Back to Itinerary"
                     >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div className="flex-grow min-w-0">
                        <h1 className="text-xl font-bold text-gray-800 truncate">
                            Change Activity in {city}
                        </h1>
                        <p className="text-xs text-gray-500 truncate">
                            Date: {date} | Current Activity: {oldActivityCode} 
                        </p>
                    </div>
                </div>
                 {/* Placeholder for mobile filter button if needed */}
            </div>

            {/* Main Content Area (Filters + Grid) */}
            <div className="flex-grow flex flex-col md:flex-row gap-6 mt-6">
                {/* Filter Sidebar (Desktop) */}
                <aside className="w-full md:w-64 lg:w-72 flex-shrink-0">
                     {/* --- Use the imported component --- */}
                     <CrmActivityFilterMenu
                         priceRange={priceRange}
                         filters={filters}
                         onFilterChange={handleFilterChange}
                         onSortChange={handleSortChange}
                         currentSort={currentSort}
                     />
                </aside>

                {/* Activity Grid Area */}
                <main className="flex-grow flex flex-col">
                    {/* Loading/Error State */}
                    {loading && (
                        <div className="text-center py-10 flex-grow flex items-center justify-center">
                            <p className="text-gray-600">Loading available activities...</p>
                            {/* Optional: Add spinner */}
                        </div>
                    )}
                    {error && !loading && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 flex-grow flex items-center justify-center" role="alert">
                            <div>
                                <strong className="font-bold">Error: </strong>
                                <span className="block sm:inline">{error}</span>
                                <button onClick={fetchActivities} className="ml-4 text-sm underline">Retry</button>
                            </div>
                        </div>
                    )}

                    {/* Grid */}
                    {!loading && !error && activities.length > 0 && (
                         <> 
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                                {paginatedActivities.map((activity) => {
                                    // --- Start Inlined Card Logic ---
                                    const activityName = activity?.title || 'Activity Name N/A';
                                    const currentPrice = activity?.amount || 0;
                                    const imageUrl = activity?.imgURL || null;
                                    const priceDifference = currentPrice - (existingPrice || 0);
                                    const priceStatus = priceDifference === 0 ? 'same' : priceDifference > 0 ? 'increased' : 'decreased';
                                    
                                    return (
                                        <div
                                            key={activity.code} // Use activity code as key
                                            className="border rounded-lg overflow-hidden shadow-sm bg-white hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col h-full group"
                                            onClick={() => handleSelectActivity(activity)} // Use page handler directly
                                            title={`Select ${activityName}`}
                                        >
                                            {/* Image */}
                                            <div className="relative h-36 w-full bg-gray-200 flex-shrink-0">
                                                {imageUrl ? (
                                                    <img 
                                                        src={imageUrl} 
                                                        alt={activityName} 
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} // Hide broken image, show placeholder
                                                    />
                                                ) : null} 
                                                 {/* Placeholder shown if no imageUrl or if image fails to load */}
                                                 <div 
                                                    className={`w-full h-full items-center justify-center bg-gray-100 ${imageUrl ? 'hidden' : 'flex'}`}
                                                    style={{ display: imageUrl ? 'none' : 'flex' }} // Ensure correct initial display
                                                 >
                                                    <TicketIcon className="w-10 h-10 text-gray-300" />
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-3 flex flex-col flex-grow">
                                                <h4 
                                                    className="font-semibold text-gray-800 truncate mb-1 text-sm group-hover:text-indigo-600 transition-colors"
                                                    title={activityName}
                                                >
                                                    {activityName}
                                                </h4>
                                                
                                                <div className="mt-auto pt-2">
                                                    {/* Price */}
                                                    <p className="text-base font-bold text-blue-600">
                                                        {formatCurrency(currentPrice)}
                                                    </p>
                                                    {/* Price Difference */}
                                                    {priceStatus !== 'same' && (
                                                        <p className={`text-xs font-medium mt-0.5 ${priceStatus === 'increased' ? 'text-red-600' : 'text-green-600'}`}>
                                                            {priceStatus === 'increased' ? '+' : '-'}{formatCurrency(Math.abs(priceDifference))} vs current
                                                        </p>
                                                    )}
                                                    {priceStatus === 'same' && (
                                                        <p className="text-xs text-gray-500 mt-0.5">Same price as current</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                    // --- End Inlined Card Logic ---
                                })}
                            </div>
                            {/* Message when filters yield no results but activities were loaded */}
                            {filteredAndSortedActivities.length === 0 && (
                                <p className="text-center text-gray-500 mt-10 flex-grow flex items-center justify-center">No activities match the current filters.</p>
                            )}
                            {/* Pagination - Replaced Placeholder */}
                            {totalPages > 1 && (
                                <div className="mt-6 pt-4 flex justify-center items-center gap-3 border-t border-gray-200">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${page === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm text-gray-700">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${page === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Message when API returns no alternatives initially or after fetch error cleared */}
                    {!loading && !error && activities.length === 0 && (
                        <p className="text-center text-gray-500 mt-10 flex-grow flex items-center justify-center">No alternative activities found for this city and date.</p>
                    )}
                </main>
            </div>

            {/* Modal */} 
             <CrmChangeActivityDetailModal
                 isOpen={isModalOpen}
                 onClose={handleCloseModal}
                 selectedActivity={selectedActivityForModal}
                 // Pass necessary context for the modal's API calls
                 itineraryToken={itineraryToken}
                 inquiryToken={inquiryToken}
                 travelersDetails={travelersDetails}
                 city={city}
                 date={date}
                 oldActivityCode={oldActivityCode}
                 existingPrice={existingPrice}
                 onActivityChanged={handleActivityChangedSuccessfully}
             />
        </div>
    );
};

export default CrmChangeActivitiesPage; 