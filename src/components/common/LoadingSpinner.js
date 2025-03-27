import React from 'react';

const LoadingSpinner = ({ size = 'md', fullScreen = false, text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-indigo-500 ${sizeClasses[size]}`} />
      {text && <p className="mt-2 text-sm text-gray-500">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      {spinnerContent}
    </div>
  );
};

export default LoadingSpinner; 