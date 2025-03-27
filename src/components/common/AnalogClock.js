import React, { useEffect, useRef, useState } from 'react';

const AnalogClock = ({ value, onChange, onClose }) => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  // Always use 12-hour format with AM/PM - but return 24-hour to parent
  const [is24Hour, setIs24Hour] = useState(false);
  const [isAM, setIsAM] = useState(true);
  const [isSelectingHours, setIsSelectingHours] = useState(true);
  const [hoursInput, setHoursInput] = useState("");
  const [minutesInput, setMinutesInput] = useState("");
  const clockRef = useRef(null);

  useEffect(() => {
    if (value) {
      const [hrs, mins] = value.split(':').map(Number);
      setHours(hrs);
      setMinutes(mins || 0);
      
      // Update input fields when value changes, only if not typing
      if (!document.activeElement || 
          (document.activeElement.tagName.toLowerCase() !== 'input')) {
        setHoursInput(getFormattedHours(hrs));
        setMinutesInput(String(mins || 0).padStart(2, '0'));
      }
      
      setIsAM(hrs < 12);
      if (mins !== undefined) {
        setIsSelectingHours(false);
      }
    }
  }, [value]);
  
  // Effect to update input fields only when hours/minutes change via clock selection
  // Not when typing directly in the input fields
  useEffect(() => {
    if (!document.activeElement || 
        (document.activeElement.tagName.toLowerCase() !== 'input')) {
      setHoursInput(getFormattedHours(hours));
      setMinutesInput(String(minutes).padStart(2, '0'));
    }
  }, [hours, minutes, isAM]);
  
  // Remove the effect to update displayed time when toggling between 12/24 hour formats
  // since we're always using 12-hour format now

  const handleClick = (e) => {
    // Prevent modal from closing when interacting with inputs
    const isInput = e.target.tagName.toLowerCase() === 'input';
    // Only handle mouse events, not keyboard events, and exclude inputs
    if (e.type === 'mousedown' && !isInput && clockRef.current && !clockRef.current.contains(e.target)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Helper function to format hours based on AM/PM setting (always in 12-hour format)
  const getFormattedHours = (hrs) => {
    let displayHrs = hrs % 12;
    if (displayHrs === 0) displayHrs = 12;
    return String(displayHrs).padStart(2, '0');
  };

  const updateTime = (newHours, newMinutes) => {
    let finalHours = newHours;
    // Always convert from 12-hour display format to 24-hour format for API
    if (isAM && newHours === 12) finalHours = 0;
    if (!isAM && newHours !== 12) finalHours += 12;
    
    // Always return time in 24-hour format for API consistency
    const timeString = `${String(finalHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
    
    // Close the clock and update the parent component
    onChange(timeString);
  };

  const toggleAMPM = () => {
    setIsAM(!isAM);
    // Don't call updateTime here, as it will close the window
    // The time will be updated when the Set Time button is clicked
  };

  const handleHourClick = (hour) => {
    // Convert to 24-hour format for internal state
    let newHour = hour;
    if (!isAM && hour !== 12) newHour = hour + 12;
    if (isAM && hour === 12) newHour = 0;
    
    setHours(newHour);
    setIsSelectingHours(false);
  };

  const handleMinuteClick = (minute) => {
    setMinutes(minute);
    // Don't call updateTime here, it will close the modal
    // Let the user select AM/PM and click "Set Time" button
  };

  const handleTimeUnitToggle = () => {
    setIsSelectingHours(!isSelectingHours);
  };

  // Safely handle blurring input to restore formatting
  const handleInputBlur = (type) => {
    if (type === 'hours') {
      if (hoursInput === '') {
        // Empty input, restore to current value
        setHoursInput(getFormattedHours(hours));
      } else {
        // Non-empty input, format with leading zeros
        const numericValue = parseInt(hoursInput, 10);
        if (!isNaN(numericValue)) {
          setHoursInput(getFormattedHours(hours));
        }
      }
    } else if (type === 'minutes') {
      if (minutesInput === '') {
        // Empty input, restore to current value
        setMinutesInput(String(minutes).padStart(2, '0'));
      } else {
        // Non-empty input, format with leading zeros
        const numericValue = parseInt(minutesInput, 10);
        if (!isNaN(numericValue)) {
          setMinutesInput(String(minutes).padStart(2, '0'));
        }
      }
    }
  };

  const handleHoursInput = (e) => {
    // Prevent event propagation
    e.stopPropagation();
    
    const inputValue = e.target.value;
    
    // Allow only numeric input, empty input, or single digit
    if (!/^\d*$/.test(inputValue)) return;
    
    // Don't apply any padding - use raw input value
    setHoursInput(inputValue);
    
    // Allow empty input for deletion
    if (inputValue === "") return;
    
    const newHours = parseInt(inputValue, 10);
    
    // Handle number limitations for 12-hour format
    if (newHours > 12) return;
      
    // Convert to 24-hour format for internal state
    let adjustedHours = newHours;
    if (!isAM && newHours !== 12) adjustedHours = newHours + 12;
    if (isAM && newHours === 12) adjustedHours = 0;
    
    setHours(adjustedHours);
  };
  
  const handleMinutesInput = (e) => {
    // Prevent event propagation
    e.stopPropagation();
    e.preventDefault();
    
    const inputValue = e.target.value;
    
    // Allow only numeric input, empty input, or single digit
    if (!/^\d*$/.test(inputValue)) return;
    
    // Don't apply any padding - use raw input value
    setMinutesInput(inputValue);
    
    // Allow empty input for deletion
    if (inputValue === "") return;
    
    const newMinutes = parseInt(inputValue, 10);
    
    // Handle minutes range validation
    if (newMinutes > 59) return;
    
    setMinutes(newMinutes);
    // Don't call updateTime here to avoid side effects
    // updateTime will be called on blur or when Set Time is clicked
  };

  const renderClockFace = () => {
    const hourNumbers = Array.from({ length: 12 }, (_, i) => i + 1);
    const minuteNumbers = Array.from({ length: 12 }, (_, i) => i * 5);

    return (
      <div className="relative w-72 h-72 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg border border-gray-100">
        {/* Clock tick marks */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = i * 6 - 90;
          const isMajorTick = i % 5 === 0;
          const tickLength = isMajorTick ? 10 : 5;
          const outerRadius = 130;
          const innerRadius = outerRadius - tickLength;
          
          const outerX = outerRadius * Math.cos((angle * Math.PI) / 180);
          const outerY = outerRadius * Math.sin((angle * Math.PI) / 180);
          const innerX = innerRadius * Math.cos((angle * Math.PI) / 180);
          const innerY = innerRadius * Math.sin((angle * Math.PI) / 180);

          return (
            <div
              key={`tick-${i}`}
              className={`absolute ${isMajorTick ? 'bg-gray-400' : 'bg-gray-300'}`}
              style={{
                width: '1px',
                height: `${tickLength}px`,
                transformOrigin: 'bottom center',
                transform: `translate(${(outerX + innerX) / 2}px, ${(outerY + innerY) / 2}px) rotate(${angle + 90}deg)`,
                left: '50%',
                top: '50%',
                marginLeft: '-0.5px',
                marginTop: `-${tickLength / 2}px`,
              }}
            />
          );
        })}

        {/* Hour markers */}
        {isSelectingHours && hourNumbers.map((num) => {
          const angle = (num - 1) * 30 - 90;
          const radius = 100;
          const x = radius * Math.cos((angle * Math.PI) / 180);
          const y = radius * Math.sin((angle * Math.PI) / 180);

          // In 12-hour mode, consider 12AM as 0 hours and 12PM as 12 hours
          const isSelected = (isAM ? hours === num : hours === num + 12) || 
                             (num === 12 && ((isAM && hours === 0) || (!isAM && hours === 12)));

          return (
            <div
              key={`hour-${num}`}
              className={`absolute transition-all duration-200 ease-in-out 
                ${isSelected ? 'w-10 h-10 -ml-5 -mt-5 z-10' : 'w-8 h-8 -ml-4 -mt-4'} 
                rounded-full flex items-center justify-center shadow-sm
                ${isSelected ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium' : 
                'bg-white text-gray-800 hover:bg-gray-50 hover:shadow-md'}`}
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
              }}
              onClick={() => handleHourClick(num)}
            >
              {num}
            </div>
          );
        })}

        {/* Minute markers */}
        {!isSelectingHours && minuteNumbers.map((num) => {
          const angle = (num / 5 - 1) * 30 - 90;
          const radius = 100;
          const x = radius * Math.cos((angle * Math.PI) / 180);
          const y = radius * Math.sin((angle * Math.PI) / 180);

          const isSelected = minutes === num;

          return (
            <div
              key={`minute-${num}`}
              className={`absolute transition-all duration-200 ease-in-out 
                ${isSelected ? 'w-10 h-10 -ml-5 -mt-5 z-10' : 'w-8 h-8 -ml-4 -mt-4'} 
                rounded-full flex items-center justify-center shadow-sm
                ${isSelected ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-medium' : 
                'bg-white text-gray-800 hover:bg-gray-50 hover:shadow-md'}`}
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
              }}
              onClick={() => handleMinuteClick(num)}
            >
              {num}
            </div>
          );
        })}

        {/* Clock hands */}
        {/* Hour hand */}
        <div 
          className="absolute w-1 bg-indigo-700 rounded-full origin-bottom transform -translate-x-1/2"
          style={{
            height: '60px',
            left: '50%',
            bottom: '50%',
            transform: `rotate(${hours * 30 + minutes * 0.5 - 90}deg)`,
            transformOrigin: 'bottom center',
            boxShadow: '0 0 5px rgba(0,0,0,0.2)',
          }}
        />
        
        {/* Minute hand */}
        <div 
          className="absolute w-1 bg-indigo-500 rounded-full origin-bottom transform -translate-x-1/2"
          style={{
            height: '80px',
            left: '50%',
            bottom: '50%',
            transform: `rotate(${minutes * 6 - 90}deg)`,
            transformOrigin: 'bottom center',
            boxShadow: '0 0 5px rgba(0,0,0,0.1)',
          }}
        />

        {/* Center dot */}
        <div className="absolute w-5 h-5 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full shadow-sm" 
          style={{ left: 'calc(50% - 10px)', top: 'calc(50% - 10px)' }} />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 ease-in-out">
      <div 
        ref={clockRef} 
        className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300"
        style={{
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-medium text-gray-800">Select Time</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors duration-150 ease-in-out"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col items-center">
          {/* Digital time display */}
          <div 
            className="mb-6 px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-inner flex items-center justify-center space-x-2"
          >
            <input
              type="text"
              value={hoursInput}
              onChange={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleHoursInput(e);
              }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsSelectingHours(true);
              }}
              onFocus={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // When focusing, remove any leading zeros for easier editing
                if (hoursInput.startsWith('0') && hoursInput.length > 1) {
                  setHoursInput(hoursInput.replace(/^0+/, ''));
                }
                setIsSelectingHours(true);
              }}
              onBlur={(e) => {
                e.stopPropagation();
                handleInputBlur('hours');
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                // Move to minutes on Enter or Tab
                if (e.key === 'Enter') {
                  document.querySelector('input[value="' + minutesInput + '"]').focus();
                }
              }}
              className={`w-12 text-3xl font-bold transition-all duration-200 px-2 py-1 rounded text-center
                ${isSelectingHours ? 'text-indigo-600 bg-white shadow-sm border-transparent focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50' : 'text-gray-700 bg-transparent border-transparent focus:bg-white focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'}`}
              maxLength="2"
              inputMode="numeric"
              pattern="[0-9]*"
            />
            <span className="text-3xl font-bold text-gray-400">:</span>
            <input
              type="text"
              value={minutesInput}
              onChange={handleMinutesInput}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsSelectingHours(false);
              }}
              onFocus={(e) => {
                e.stopPropagation();
                e.preventDefault();
                // When focusing, remove any leading zeros for easier editing
                if (minutesInput.startsWith('0') && minutesInput.length > 1) {
                  setMinutesInput(minutesInput.replace(/^0+/, ''));
                }
                setIsSelectingHours(false);
              }}
              onBlur={(e) => {
                e.stopPropagation();
                handleInputBlur('minutes');
                // Don't call updateTime here, let the user click Set Time
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                // Update on Enter key
                if (e.key === 'Enter') {
                  updateTime(hours, minutes);
                }
              }}
              className={`w-12 text-3xl font-bold transition-all duration-200 px-2 py-1 rounded text-center
                ${!isSelectingHours ? 'text-indigo-600 bg-white shadow-sm border-transparent focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50' : 'text-gray-700 bg-transparent border-transparent focus:bg-white focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50'}`}
              maxLength="2"
              inputMode="numeric"
              pattern="[0-9]*"
            />
            <div className="ml-2 flex bg-gray-200 rounded-lg p-1">
              <button
                onClick={(e) => { e.stopPropagation(); setIsAM(true); }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-150 
                  ${isAM ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'}`}
              >
                AM
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsAM(false); }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-150 
                  ${!isAM ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'}`}
              >
                PM
              </button>
            </div>
          </div>

          {renderClockFace()}
          
          <div className="mt-6 text-sm text-gray-500 font-medium">
            {isSelectingHours ? 'Select hour' : 'Select minute'}
          </div>

          <div className="mt-6 flex justify-between w-full">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-150 font-medium"
            >
              Cancel
            </button>
            <button 
              onClick={() => updateTime(hours, minutes)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-150 font-medium shadow-md"
            >
              Set Time
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalogClock;