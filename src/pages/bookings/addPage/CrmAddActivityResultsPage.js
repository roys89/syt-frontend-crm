import { TicketIcon } from '@heroicons/react/24/outline';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { Hourglass } from 'ldrs/react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

// Import the filter component
import CrmActivityFilterMdal from '../../../components/itinerary/modals/change/CrmActivityFilterMdal';

// Import the detail modal for adding activities
import CrmAddActivityDetailModal from '../../../components/itinerary/modals/add/CrmAddActivityDetailModal';

// --- NEW: Import Hourglass CSS ---
import 'ldrs/react/Hourglass.css'; // Ensure CSS is imported

// Helper function to format currency
const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return 'N/A';
    }
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

const CrmAddActivityResultsPage = () => {
    const { itineraryToken, city, date } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // Extract state passed from CrmItineraryDay
    const { inquiryToken, travelersDetails, searchCriteria, countryName } = location.state || {};

    // --- State --- 
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [itemsPerPage] = useState(12);
    const [visibleCount, setVisibleCount] = useState(itemsPerPage);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActivityForModal, setSelectedActivityForModal] = useState(null);
    const [searchId, setSearchId] = useState(null);

    // Filter & Sort State
    const [filters, setFilters] = useState({ 
        search: '', 
        price: [0, 10000]
    });
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
    const [currentSort, setCurrentSort] = useState('priceAsc');

    // --- Data Fetching --- 
    const fetchActivities = useCallback(async () => {
        if (!inquiryToken || !city || !countryName || !date || !travelersDetails) {
            setError("Missing required information to fetch activities.");
            setLoading(false);
            console.error("Missing data for fetching activities:", { inquiryToken, city, countryName, date, travelersDetails });
            toast.error("Missing required activity search context. Returning.");
            navigate('/bookings');
            return;
        }

        setLoading(true);
        setError(null);
        console.log(`Fetching activities for ${city}, ${countryName} on ${date} using inquiry ${inquiryToken}`);

        try {
            const apiUrl = `http://localhost:5000/api/itinerary/activities/${inquiryToken}/search`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                    'X-Inquiry-Token': inquiryToken,
                },
                body: JSON.stringify({
                    cityName: city,
                    countryName: countryName,
                    date: date,
                    travelersDetails: travelersDetails,
                    ...searchCriteria // Include any additional search criteria
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `Failed to fetch activities (${response.status})`);
            }

            const result = await response.json();
            console.log("API Response:", result);

            if (!result || !result.data || !Array.isArray(result.data)) {
                throw new Error('Invalid response structure from activities API');
            }

            setSearchId(result.searchId || null);

            const fetchedActivities = result.data
                .filter(item => item && typeof item === 'object' && item.code && item.title && typeof item.amount === 'number')
                .map(item => ({ ...item, amount: Number(item.amount) || 0 }));

            if (fetchedActivities.length === 0) {
                setError("No activities found for this city and date.");
                setActivities([]);
            } else {
                setActivities(fetchedActivities);
                const prices = fetchedActivities.map(a => a.amount).filter(p => typeof p === 'number');
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                setPriceRange({ min: minPrice, max: maxPrice });
                setFilters({ search: '', price: [minPrice, maxPrice] });
                setError(null);
            }

        } catch (err) {
            console.error("Error fetching activities:", err);
            setError(err.message);
            setActivities([]);
        } finally {
            setLoading(false);
            setVisibleCount(itemsPerPage);
        }
    }, [inquiryToken, city, countryName, date, travelersDetails, searchCriteria, navigate, itemsPerPage]);

    // Fetch activities on mount
    useEffect(() => {
        if (!location.state || !inquiryToken || !city || !countryName || !date || !travelersDetails) {
            toast.error("Missing required activity search context. Returning.");
            navigate('/bookings');
            return;
        }
        fetchActivities();
    }, [fetchActivities, location.state, inquiryToken, city, countryName, date, navigate, travelersDetails]);

    // Filter and sort activities
    const filteredAndSortedActivities = useMemo(() => {
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

    // Visible activities slice
    const activitiesToShow = useMemo(() => {
        return filteredAndSortedActivities.slice(0, visibleCount);
    }, [filteredAndSortedActivities, visibleCount]);

    // --- Event Handlers ---
    const handleFilterChange = useCallback((type, value) => {
        setVisibleCount(itemsPerPage);
        if (type === 'reset') {
            setFilters({
                search: '',
                price: [priceRange.min, priceRange.max]
            });
            setCurrentSort('priceAsc');
        } else {
            setFilters(prev => ({ ...prev, [type]: value }));
        }
    }, [priceRange, itemsPerPage]);

    const handleSortChange = useCallback((value) => {
        setCurrentSort(value);
        setVisibleCount(itemsPerPage);
    }, [itemsPerPage]);

    const handleLoadMore = () => {
        const newCount = Math.min(visibleCount + itemsPerPage, filteredAndSortedActivities.length);
        setVisibleCount(newCount);
    };

    const handleSelectActivity = (activity) => {
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

    const handleActivityAddedSuccessfully = () => {
        toast.success("Activity successfully added to the itinerary!");
        handleCloseModal();
        handleBackToItinerary();
    };

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
                            Add Activity in {city}
                        </h1>
                        <p className="text-xs text-gray-500 truncate">
                            Date: {date}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
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
                        <div className="text-center flex flex-row items-center justify-center flex-grow">
                            <Hourglass size="40" color="#6366F1" />
                            <p className="text-gray-600 ml-3">Loading available activities...</p>
                        </div>
                    )}
                    {error && !loading && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-2xl text-center flex-grow flex items-center justify-center" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}

                    {/* Grid */}
                    {!loading && !error && activities.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                                {activitiesToShow.map((activity) => {
                                    const activityName = activity?.title || 'Activity Name N/A';
                                    const currentPrice = activity?.amount || 0;
                                    const imageUrl = activity?.imgURL || null;

                                    return (
                                        <div
                                            key={`${activity.code}-${activity.groupCode}`}
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
                                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                    />
                                                ) : null}
                                                <div 
                                                    className={`w-full h-full items-center justify-center bg-gray-100 ${imageUrl ? 'hidden' : 'flex'}`}
                                                    style={{ display: imageUrl ? 'none' : 'flex' }}
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
                                                    <p className="text-base font-bold text-blue-600">
                                                        {formatCurrency(currentPrice)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

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

                    {/* No Results Message */}
                    {!loading && !error && activities.length === 0 && (
                        <p className="text-center text-gray-500 py-10 flex-grow flex items-center justify-center">
                            No activities found for this city and date.
                        </p>
                    )}
                </main>
            </div>

            {/* Modal */}
            <CrmAddActivityDetailModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                selectedActivity={selectedActivityForModal}
                itineraryToken={itineraryToken}
                inquiryToken={inquiryToken}
                searchId={searchId}
                travelersDetails={travelersDetails}
                city={city}
                date={date}
                onActivityAdded={handleActivityAddedSuccessfully}
            />
        </div>
    );
};

export default CrmAddActivityResultsPage; 