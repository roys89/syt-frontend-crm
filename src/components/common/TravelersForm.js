import { MinusCircleIcon, PlusCircleIcon, UserCircleIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

const TravelersForm = ({ travelers, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Get values from travelers prop or use defaults
  const adults = travelers?.rooms?.[0]?.adults || 1;
  const children = travelers?.rooms?.[0]?.children || [];
  
  // Handle adults count change
  const handleAdultsChange = (newCount) => {
    // Ensure we have at least 1 adult and no more than 9
    const validCount = Math.max(1, Math.min(9, newCount));
    
    const updatedTravelers = {
      ...travelers,
      rooms: [
        {
          ...travelers.rooms[0],
          adults: validCount,
        },
      ],
    };
    
    onChange(updatedTravelers);
  };
  
  // Handle adding a child
  const handleAddChild = () => {
    if (children.length >= 9) return; // Maximum 9 children
    
    const updatedTravelers = {
      ...travelers,
      rooms: [
        {
          ...travelers.rooms[0],
          children: [...children, ''],
        },
      ],
    };
    
    onChange(updatedTravelers);
  };
  
  // Handle removing a child
  const handleRemoveChild = (index) => {
    const updatedChildren = [...children];
    updatedChildren.splice(index, 1);
    
    const updatedTravelers = {
      ...travelers,
      rooms: [
        {
          ...travelers.rooms[0],
          children: updatedChildren,
        },
      ],
    };
    
    onChange(updatedTravelers);
  };
  
  // Handle child age change
  const handleChildAgeChange = (index, age) => {
    const updatedChildren = [...children];
    updatedChildren[index] = age;
    
    const updatedTravelers = {
      ...travelers,
      rooms: [
        {
          ...travelers.rooms[0],
          children: updatedChildren,
        },
      ],
    };
    
    onChange(updatedTravelers);
  };
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  return (
    <div className="bg-gradient-to-r from-[#093923]/5 to-[#22c35e]/5 border border-[#093923]/20 rounded-xl shadow-sm transition-all hover:shadow-md h-full">
      {/* Summary bar (always visible) */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer border-b border-[#093923]/20"
        onClick={toggleExpanded}
      >
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-[#093923]/10 p-2">
            <UserGroupIcon className="h-5 w-5 text-[#093923]" />
          </div>
          <div>
            <span className="font-medium text-gray-800">
              {adults} {adults === 1 ? 'Adult' : 'Adults'}
              {children.length > 0 && `, ${children.length} ${children.length === 1 ? 'Child' : 'Children'}`}
            </span>
            <p className="text-xs text-gray-500 mt-0.5">Click to {expanded ? 'collapse' : 'edit'}</p>
          </div>
        </div>
        <div className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          <svg className="h-5 w-5 text-[#093923]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {/* Expanded content */}
      {expanded && (
        <div className="p-4 space-y-6">
          {/* Adults selector */}
          <div className="flex items-center justify-between px-2">
            <div>
              <p className="font-medium text-gray-800">Adults</p>
              <p className="text-xs text-gray-500">Age 12+</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleAdultsChange(adults - 1)}
                disabled={adults <= 1}
                className={`rounded-full p-1 transition-colors ${
                  adults <= 1 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-[#093923] hover:bg-[#093923]/10 active:bg-[#093923]/20'
                }`}
              >
                <MinusCircleIcon className="h-6 w-6" />
              </button>
              <span className="w-6 text-center font-semibold text-gray-800">{adults}</span>
              <button
                type="button"
                onClick={() => handleAdultsChange(adults + 1)}
                disabled={adults >= 9}
                className={`rounded-full p-1 transition-colors ${
                  adults >= 9 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-[#093923] hover:bg-[#093923]/10 active:bg-[#093923]/20'
                }`}
              >
                <PlusCircleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          {/* Children selector */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div>
                <p className="font-medium text-gray-800">Children</p>
                <p className="text-xs text-gray-500">Age 0-11</p>
              </div>
              <button
                type="button"
                onClick={handleAddChild}
                disabled={children.length >= 9}
                className={`flex items-center space-x-1 rounded-full px-3 py-1.5 transition-colors ${
                  children.length >= 9
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#093923]/10 text-[#093923] hover:bg-[#093923]/20 active:bg-[#093923]/30'
                }`}
              >
                <PlusCircleIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Add child</span>
              </button>
            </div>
            
            {/* Child age inputs */}
            {children.length > 0 && (
              <div className="space-y-3 mt-3">
                {children.map((childAge, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-white p-3 rounded-lg">
                    <UserCircleIcon className="h-5 w-5 text-[#093923]" />
                    <select
                      value={childAge}
                      onChange={(e) => handleChildAgeChange(index, e.target.value)}
                      className="block flex-1 rounded-lg border-gray-300 shadow-sm focus:border-[#093923] focus:ring-2 focus:ring-[#093923]/20 text-sm py-2"
                    >
                      <option value="">Select age</option>
                      {[...Array(12)].map((_, age) => (
                        <option key={age} value={age.toString()}>
                          {age} {age === 1 ? 'year' : 'years'}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveChild(index)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-[#093923] hover:bg-[#093923]/10 transition-colors"
                      aria-label="Remove child"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelersForm; 