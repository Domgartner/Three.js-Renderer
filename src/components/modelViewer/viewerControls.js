import React from 'react';

export default function ViewerControls({ viewerState, onToggleOption }) {
  const controls = [
    {
      id: 'wireframe',
      label: 'Wireframe',
      active: viewerState.wireframe
    },
    {
      id: 'autoRotate',
      label: 'Auto-Rotate',
      active: viewerState.autoRotate
    },
    {
      id: 'showHotspots',
      label: 'Hotspots',
      active: viewerState.showHotspots
    }
  ];

  return (
    <div className="flex items-center space-x-2">
      {controls.map(control => (
        <button
          key={control.id}
          className={`px-2 py-1 rounded-md text-sm flex items-center ${ control.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300' }`}
          onClick={() => onToggleOption(control.id)}
          title={control.label}
        >
          {control.label}
        </button>
      ))}
    </div>
  );
}