import React from 'react';

export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-700 font-medium">Loading Model...</p>
      </div>
    </div>
  );
}