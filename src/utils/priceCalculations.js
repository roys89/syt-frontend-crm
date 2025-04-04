// syt-frontend-crm/src/utils/priceCalculations.js

// NOTE: Copied and adapted from syt-frontend/src/utils/priceCalculations.js
// Ensure any future changes in the B2C version are mirrored here if necessary.

const calculateFlightAddons = (flightData) => {
  let totalAddons = 0;

  if (flightData.isSeatSelected && flightData.selectedSeats) {
    totalAddons += flightData.selectedSeats.reduce((seatTotal, segment) => {
      const segmentTotal = segment.rows.reduce((rowTotal, row) => {
        return rowTotal + row.seats.reduce((total, seat) => total + (seat.price || 0), 0);
      }, 0);
      return seatTotal + segmentTotal;
    }, 0);
  }

  if (flightData.isBaggageSelected && flightData.selectedBaggage) {
    totalAddons += flightData.selectedBaggage.reduce((baggageTotal, segment) => {
      return baggageTotal + segment.options.reduce((total, option) => {
        return total + (option.price || 0);
      }, 0);
    }, 0);
  }

  if (flightData.isMealSelected && flightData.selectedMeal) {
    totalAddons += flightData.selectedMeal.reduce((mealTotal, segment) => {
      return mealTotal + segment.options.reduce((total, option) => {
        return total + (option.price || 0);
      }, 0);
    }, 0);
  }

  return Number(totalAddons.toFixed(2));
};

const getBasePrice = (item) => {
  let price = 0;
  if (item.price) {
    price = item.price;
  } else if (item.packageDetails?.amount) {
    price = item.packageDetails.amount;
  } else if (item.data?.totalAmount) {
    price = item.data.totalAmount;
  } else if (item.flightData) {
    price = item.flightData.price || 0;
    price += calculateFlightAddons(item.flightData);
  } else if (item.details?.selectedQuote?.quote?.fare) {
    price = parseFloat(item.details.selectedQuote.quote?.fare);
  }
  // Add more specific price extraction logic for CRM if needed
  // e.g., if activity/transfer structure differs

  return Number(price.toFixed(2));
};

export const calculateSegmentTotal = (items, markup) => {
  return Number(items.reduce((total, item) => {
    const itemPrice = getBasePrice(item);
    const markupAmount = Number((itemPrice * markup / 100).toFixed(2));
    return Number((total + itemPrice + markupAmount).toFixed(2));
  }, 0));
};

export const calculateBaseTotal = (items) => {
  return Number(items.reduce((total, item) => {
    return Number((total + getBasePrice(item)).toFixed(2));
  }, 0));
};

const calculateTieredTCS = (baseTotal, tcsRates) => {
  if (!tcsRates || typeof tcsRates.default === 'undefined' || typeof tcsRates.highValue === 'undefined' || typeof tcsRates.threshold === 'undefined') {
    console.warn("TCS rates not fully defined, defaulting TCS to 0");
    return {
      tcsAmount: 0,
      effectiveRate: 0
    };
  }

  const { default: defaultRate, highValue: highValueRate, threshold } = tcsRates;

  if (baseTotal <= threshold) {
    const tcsAmount = Number((baseTotal * defaultRate / 100).toFixed(2));
    return {
      tcsAmount,
      effectiveRate: Number(defaultRate.toFixed(2))
    };
  } else {
    const defaultTCS = Number((threshold * defaultRate / 100).toFixed(2));
    const highValueAmount = Number((baseTotal - threshold).toFixed(2));
    const highValueTCS = Number((highValueAmount * highValueRate / 100).toFixed(2));

    const totalTCS = Number((defaultTCS + highValueTCS).toFixed(2));
    const effectiveRate = baseTotal > 0 ? Number(((totalTCS / baseTotal) * 100).toFixed(2)) : 0;

    return {
      tcsAmount: totalTCS,
      effectiveRate
    };
  }
};

export const calculateItineraryTotal = (itinerary, markups, tcsRates) => {
  if (!itinerary || !itinerary.cities || !markups || !tcsRates) {
    console.error("Cannot calculate totals: Missing itinerary, cities, markups, or tcsRates", { itinerary, markups, tcsRates });
    return {
      segmentTotals: { activities: 0, hotels: 0, flights: 0, transfers: 0 },
      baseTotal: 0,
      subtotal: 0,
      tcsRate: 0,
      tcsAmount: 0,
      grandTotal: 0,
      segmentBaseTotals: { activities: 0, hotels: 0, flights: 0, transfers: 0 }
    };
  }

  let segmentBaseTotals = {
    activities: 0,
    hotels: 0,
    flights: 0,
    transfers: 0
  };

  // Iterate through all cities and days
  itinerary.cities.forEach(city => {
    city.days.forEach(day => {
      // Calculate base total for each segment
      Object.keys(segmentBaseTotals).forEach(segment => {
        // Adjust keys based on potential CRM data structures
        const daySegmentData = day[segment] || day[`${segment}Details`] || []; // Check for 'flights' or 'flightDetails' etc.
        if (daySegmentData.length > 0) {
          segmentBaseTotals[segment] = Number(
            (segmentBaseTotals[segment] + calculateBaseTotal(daySegmentData)).toFixed(2)
          );
        }
      });
    });
  });

  // Calculate base total across all segments
  const baseTotal = Number(
    Object.values(segmentBaseTotals).reduce(
      (a, b) => Number((a + b).toFixed(2)),
      0
    )
  );

  // Calculate segment totals with markups
  const segmentTotals = {};
  Object.keys(segmentBaseTotals).forEach(segment => {
    const baseAmount = segmentBaseTotals[segment];
    const markupRate = markups[segment] !== undefined ? markups[segment] : 0; // Default markup to 0 if not defined
    const markupAmount = Number((baseAmount * markupRate / 100).toFixed(2));
    segmentTotals[segment] = Number((baseAmount + markupAmount).toFixed(2));
  });

  // Calculate subtotal (total after markup)
  const subtotal = Number(
    Object.values(segmentTotals).reduce(
      (a, b) => Number((a + b).toFixed(2)),
      0
    )
  );

  // Calculate TCS on subtotal (after markup)
  const { tcsAmount, effectiveRate } = calculateTieredTCS(subtotal, tcsRates);

  return {
    segmentTotals,     // Totals for each segment with markup
    baseTotal,         // Total before markup
    subtotal,          // Total after markup
    tcsRate: Number(effectiveRate.toFixed(2)),
    tcsAmount: Number(tcsAmount.toFixed(2)),
    grandTotal: Number((subtotal + tcsAmount).toFixed(2)),
    // Include segment base totals for debugging/display if needed
    segmentBaseTotals
  };
};

// --- Other functions like updateItineraryPrices, getPriceCheckSummary are removed --- 
// --- as they are not immediately needed for CRM display, but can be added later if required --- 