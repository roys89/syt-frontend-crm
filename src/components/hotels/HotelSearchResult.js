import { StarIcon } from '@heroicons/react/24/solid';
import PropTypes from 'prop-types';

const HotelSearchResult = ({ hotel, onSelect, isLoading }) => {
  const {
    id,
    name,
    contact,
    starRating,
    reviews,
    images,
    facilities,
    availability,
    description,
    amenities,
    policies
  } = hotel;

  const mainImage = images?.[0]?.links?.find(link => link.size === 'Standard')?.url;
  const rating = reviews?.[0]?.rating || 0;
  const reviewCount = reviews?.[0]?.count || 0;
  const price = availability?.rate?.finalRate || 0;
  const cancellationPolicy = policies?.cancellation?.description;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow h-[160px]">
      <div className="flex flex-col md:flex-row h-full">
        {/* Hotel Image */}
        <div className="md:w-1/3 h-[100px] md:h-full">
          <img
            src={mainImage}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
            }}
          />
        </div>

        {/* Hotel Details */}
        <div className="md:w-2/3 p-1.5 flex flex-col h-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{name}</h3>
              <p className="text-sm text-gray-600 line-clamp-1">
                {contact?.address?.line1}, {contact?.address?.city?.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-indigo-600">
                ₹{price.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">per night</p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-1 mt-0.5">{description}</p>

          {/* Rating and Reviews */}
          <div className="mt-0.5 flex items-center">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="ml-0.5 text-sm text-gray-600">
              {rating} ({reviewCount} reviews)
            </span>
          </div>

          {/* Cancellation Policy */}
          {cancellationPolicy && (
            <div className="mt-0.5 flex items-center text-sm text-gray-600">
              <span className="text-green-600">{cancellationPolicy}</span>
            </div>
          )}

          {/* Facilities and Amenities */}
          <div className="mt-0.5 flex-grow">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Facilities & Amenities</h4>
              <span className="text-sm text-gray-500">
                {((facilities?.length || 0) + (amenities?.length || 0))} available
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap gap-0.5">
              {facilities?.slice(0, 2).map((facility) => (
                <span
                  key={facility.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                >
                  {facility.name}
                </span>
              ))}
              {amenities?.slice(0, 2).map((amenity) => (
                <span
                  key={amenity}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  {amenity}
                </span>
              ))}
              {((facilities?.length || 0) + (amenities?.length || 0)) > 4 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  +{((facilities?.length || 0) + (amenities?.length || 0)) - 4} more
                </span>
              )}
            </div>
          </div>

          {/* Select Button */}
          <div className="mt-auto pt-0.5 flex justify-end">
            <button
              onClick={onSelect}
              disabled={isLoading}
              className={`inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                isLoading 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                'Select Hotel'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

HotelSearchResult.propTypes = {
  hotel: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    contact: PropTypes.shape({
      address: PropTypes.shape({
        line1: PropTypes.string,
        city: PropTypes.shape({
          name: PropTypes.string
        })
      })
    }).isRequired,
    starRating: PropTypes.string,
    reviews: PropTypes.arrayOf(
      PropTypes.shape({
        rating: PropTypes.string,
        count: PropTypes.string
      })
    ),
    images: PropTypes.arrayOf(
      PropTypes.shape({
        links: PropTypes.arrayOf(
          PropTypes.shape({
            size: PropTypes.string,
            url: PropTypes.string
          })
        )
      })
    ),
    facilities: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string
      })
    ),
    availability: PropTypes.shape({
      rate: PropTypes.shape({
        finalRate: PropTypes.number
      })
    }),
    description: PropTypes.string,
    amenities: PropTypes.arrayOf(PropTypes.string),
    policies: PropTypes.shape({
      cancellation: PropTypes.shape({
        description: PropTypes.string
      })
    })
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

export default HotelSearchResult; 