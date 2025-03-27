import React from 'react';

const CABIN_CLASSES = [
  { label: 'ALL', value: 1 },
  { label: 'Economy', value: 2 },
  { label: 'Premium Economy', value: 3 },
  { label: 'Business', value: 4 },
  { label: 'First Class', value: 6 }
];

const CabinClassSelector = ({ selectedClass, onChange }) => {
  return (
    <div className="border border-gray-300 rounded-md">
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">CHOOSE TRAVEL CLASS</h3>
        <div className="grid grid-cols-2 gap-2">
          {CABIN_CLASSES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                selectedClass === option.value
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-gray-300 text-gray-700 hover:border-blue-500'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CabinClassSelector; 