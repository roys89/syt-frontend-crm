import React from 'react';

const ProviderSelector = ({ providers, selectedProvider, onChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Select Provider</h3>
      <div className="grid grid-cols-2 gap-4">
        {providers.map((provider) => (
          <button
            key={provider.value}
            type="button"
            onClick={() => onChange(provider.value)}
            className={`p-4 rounded-lg border-2 transition-colors duration-200 ${
              selectedProvider === provider.value
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{provider.label}</span>
              {selectedProvider === provider.value && (
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProviderSelector; 