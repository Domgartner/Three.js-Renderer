import { ToggleLeft, ToggleRight, Eye, RotateCw, Grid } from 'lucide-react';

export default function ViewerControls({ viewerState, onToggleOption }) {
  const controls = [
    {
      id: 'wireframe',
      label: 'Wireframe',
      icon: <Grid size={16} />,
      active: viewerState.wireframe
    },
    {
      id: 'autoRotate',
      label: 'Auto-Rotate',
      icon: <RotateCw size={16} />,
      active: viewerState.autoRotate
    },
    {
      id: 'showHotspots',
      label: 'Hotspots',
      icon: <Eye size={16} />,
      active: viewerState.showHotspots
    }
  ];

  return (
    <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl shadow-md border border-gray-200">
      {controls.map(control => (
        <button
          key={control.id}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
            ${control.active 
              ? 'bg-blue-600 text-white shadow-sm hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => onToggleOption(control.id)}
          title={control.label}
        >
          {control.icon}
          {control.label}
        </button>
      ))}
    </div>
  );
}
