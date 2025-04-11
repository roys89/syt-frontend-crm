import { TicketIcon } from '@heroicons/react/24/outline';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

// --- Import the filter component ---
import CrmActivityFilterMdal from '../../../components/itinerary/modals/change/CrmActivityFilterMdal';

// --- Import the CHANGE modal with the correct name ---
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

    // Extract state passed from CrmActivityCard, including country
    const { oldActivityCode, existingPrice, inquiryToken, travelersDetails, country } = location.state || {};

    // --- State --- 
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [itemsPerPage] = useState(12); // How many to load each time
    const [visibleCount, setVisibleCount] = useState(itemsPerPage); // Start with one page visible

    // State for the Add Activity Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedActivityForAddModal, setSelectedActivityForAddModal] = useState(null);

    const [searchId, setSearchId] = useState(null);

    // Filter & Sort State - Managed here, passed to child component
    const [filters, setFilters] = useState({ 
        search: '', 
        price: [0, 10000] // Initial default/placeholder range
    });
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 }); // Actual min/max from data
    const [currentSort, setCurrentSort] = useState('priceAsc');
    // --- End State ---

    // --- Data Fetching --- 
    const fetchActivities = useCallback(async () => {
        // Use city and country from location.state
        const cityName = city; // Keep using param for consistency in URL?
        const countryName = country;

        if (!inquiryToken || !cityName || !countryName || !date || !travelersDetails) {
            setError("Missing required information to fetch activities.");
            setLoading(false);
            console.error("Missing data for fetching activities:", { inquiryToken, cityName, countryName, date, travelersDetails });
            toast.error("Missing required activity change context. Returning.");
            // Navigate back or show error more prominently
            if (itineraryToken && inquiryToken) {
                 navigate('/bookings/itinerary', { state: { itineraryToken, inquiryToken } });
             } else {
                 navigate('/bookings'); // Fallback
             }
            return;
        }
        setLoading(true);
        setError(null);
        console.log(`Fetching activities for ${cityName}, ${countryName} on ${date} using inquiry ${inquiryToken}`);
        try {
            // Use the NEW endpoint: POST /api/itinerary/activities/:inquiryToken/search
            const apiUrl = `http://localhost:5000/api/itinerary/activities/${inquiryToken}/search`;
            const response = await fetch(apiUrl, {
                method: 'POST', // Method is POST
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('crmToken')}`, // Assuming CRM token
                    'X-Inquiry-Token': inquiryToken,
                },
                body: JSON.stringify({ // Send data in the body
                    cityName: cityName,
                    countryName: countryName,
                    date: date,
                    travelersDetails: travelersDetails
                    // oldActivityCode could be sent if needed for backend filtering
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `Failed to fetch activities (${response.status})`);
            }

            const result = await response.json(); // Result structure is { searchId: '...', data: [...] }
            console.log("API Response:", result);

            // Validate and process data (adapted for new structure)
            if (!result || !result.data || !Array.isArray(result.data)) {
                throw new Error('Invalid response structure from activities API');
            }

            // Extract searchId
            setSearchId(result.searchId || null);

            const fetchedActivities = result.data
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
                 const prices = availableActivities.map(a => a.amount).filter(p => typeof p === 'number');
                 const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                 const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                 setPriceRange({ min: minPrice, max: maxPrice });
                 setFilters({ search: '', price: [minPrice, maxPrice] });
                 setError(null); // Clear error if activities are found
            }

        } catch (err) {
            console.error("Error fetching activities:", err);
            setError(err.message);
            setActivities([]);
        } finally {
            setLoading(false);
            setVisibleCount(itemsPerPage);
        }
    }, [inquiryToken, city, country, date, oldActivityCode, travelersDetails, navigate, itineraryToken, itemsPerPage]);

    // Fetch activities on mount or when context changes
    useEffect(() => {
        // Validate all necessary state pieces, including country
        if (!location.state || !inquiryToken || !oldActivityCode || !city || !country || !date || !travelersDetails) {
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
    // Added country to dependency array
    }, [fetchActivities, location.state, inquiryToken, oldActivityCode, city, country, date, navigate, itineraryToken, travelersDetails]); 
    // --- End Data Fetching ---

    // Filter and sort activities
    const filteredAndSortedActivities = useMemo(() => {
        console.log(`[Filter/Sort] Recalculating. Filters:`, filters, `Sort: ${currentSort}`);
        return activities
            .filter(activity => {
                if (!activity || typeof activity.amount !== 'number') return false;
                const matchesSearch = !filters.search || 
                    (activity.title && activity.title.toLowerCase().includes(filters.search.toLowerCase()));
                const [minPriceFilter, maxPriceFilter] = filters.price;
                const matchesPrice = activity.amount >= (minPriceFilter ?? 0) && 
                                   activity.amount <= (maxPriceFilter ?? Infinity);
                return matchesSearch && matchesPrice;
            })
            .sort((a, b) => {
                switch (currentSort) {
                    case 'priceAsc': return a.amount - b.amount;
                    case 'priceDesc': return b.amount - a.amount;
                    case 'nameAsc': return a.title.localeCompare(b.title);
                    default: return 0;
                }
            });
    }, [activities, filters, currentSort]);

    // --- Visible Activities Slice ---
    const activitiesToShow = useMemo(() => {
        console.log(`[Display] Slicing ${visibleCount} activities from ${filteredAndSortedActivities.length}`);
        return filteredAndSortedActivities.slice(0, visibleCount);
    }, [filteredAndSortedActivities, visibleCount]);
    // --- End Visible Activities Slice ---

    // --- Event Handlers ---
    const handleFilterChange = useCallback((type, value) => {
        console.log(`[Parent Filter Change] Received type: ${type}, value:`, value);
        setVisibleCount(itemsPerPage); // Reset visibility on any filter change
        if (type === 'reset') {
            setFilters({
                search: '',
                price: [priceRange.min, priceRange.max] // Reset to actual data range
            });
            setCurrentSort('priceAsc'); // Also reset sort on full reset
        } else {
            setFilters(prev => ({ ...prev, [type]: value }));
        }
    }, [priceRange, itemsPerPage]);

    const handleSortChange = useCallback((value) => {
        console.log(`[Parent Sort Change] Setting sort to: ${value}`);
        setCurrentSort(value);
        setVisibleCount(itemsPerPage); // Reset visibility on sort change
    }, [itemsPerPage]);

    const handleLoadMore = () => {
        const newCount = Math.min(visibleCount + itemsPerPage, filteredAndSortedActivities.length);
        console.log(`[Load More] Increasing visible count from ${visibleCount} to ${newCount}`);
        setVisibleCount(newCount);
    };

    const handleSelectActivity = (activity) => {
        console.log("Selected activity to ADD:", activity);
        setSelectedActivityForAddModal(activity);
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        // Delay clearing to allow fade-out animation
        setTimeout(() => setSelectedActivityForAddModal(null), 300); 
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

    // Callback for when activity is successfully CHANGED via the modal
    const handleActivityChangedSuccessfully = () => {
        toast.success("Activity successfully changed in the itinerary!");
        handleCloseAddModal();
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
                {/* Filter Sidebar */}
                <aside className="w-full md:w-64 lg:w-72 flex-shrink-0">
                    <div className="sticky top-20">
                        <CrmActivityFilterMdal
                            initialFilters={filters}
                            priceRange={priceRange}
                            currentSort={currentSort}
                            onFilterChange={handleFilterChange}
                            onSortChange={handleSortChange}
                        />
                    </div>
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
                                {activitiesToShow.map((activity) => {
                                    // --- Start Inlined Card Logic ---
                                    const activityName = activity?.title || 'Activity Name N/A';
                                    const currentPrice = activity?.amount || 0;
                                    const imageUrl = activity?.imgURL || null;
                                    const priceDifference = currentPrice - (existingPrice || 0);
                                    const priceStatus = priceDifference === 0 ? 'same' : priceDifference > 0 ? 'increased' : 'decreased';
                                    
                                    return (
                                        <div
                                            key={`${activity.code}-${activity.groupCode}`} // Make key more robust if codes aren't globally unique 
                                            className="border rounded-lg overflow-hidden shadow-sm bg-white hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col h-full group"
                                            onClick={() => handleSelectActivity(activity)}
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
                            {/* Message when filters yield no results */} 
                            {filteredAndSortedActivities.length > 0 && activitiesToShow.length === 0 && (
                                <p className="text-center text-gray-500 py-10">No activities match the current filters.</p>
                            )}

                            {/* Load More Button */} 
                            {visibleCount < filteredAndSortedActivities.length && (
                                <div className="mt-6 pt-4 flex justify-center border-t border-gray-200">
                                    <button
                                        onClick={handleLoadMore}
                                        className="px-6 py-2 text-sm font-medium rounded-md transition-colors bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Load More ({filteredAndSortedActivities.length - visibleCount} remaining)
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Message when API returns no alternatives initially */}
                    {!loading && !error && activities.length === 0 && (
                        <p className="text-center text-gray-500 py-10 flex-grow flex items-center justify-center">No alternative activities found for this city and date.</p>
                    )}
                </main>
            </div>

            {/* Modal for Changing the selected activity */}
             <CrmChangeActivityDetailModal
                 isOpen={isAddModalOpen}
                 onClose={handleCloseAddModal}
                 selectedActivity={selectedActivityForAddModal}
                  oldActivityCode={oldActivityCode}
                  itineraryToken={itineraryToken}
                  inquiryToken={inquiryToken}
                  searchId={searchId}
                  travelersDetails={travelersDetails}
                  city={city}
                  date={date}
                  existingPrice={existingPrice}
                  onActivityChanged={handleActivityChangedSuccessfully}
             />
        </div>
    );
};

export default CrmChangeActivitiesPage; 