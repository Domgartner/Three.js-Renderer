import { useState } from 'react';
import SceneContainer from './components/modelViewer/sceneContainer';
import ViewerControls from './components/modelViewer/viewerControls';
import LoadingOverlay from './components/UI/loadingOverlay';
import ErrorMessage from './components/UI/errorMessage';
import HotspotInfoPopup from './components/UI/hotspotInfoPopup';
import { MODEL_CONFIG } from './config/modelConfig';

function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewerState, setViewerState] = useState({ wireframe: false, autoRotate: false, showHotspots: true });
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  const handleToggleOption = (option) => {
    setViewerState(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  return (
    <div className="flex flex-col w-full h-full p-4">
      <div className="flex items-center mb-4">
        <ViewerControls viewerState={viewerState}  onToggleOption={handleToggleOption} />
      </div>
      <div className="relative h-screen max-h-[800px] w-full">
        <div className="absolute inset-0 rounded-lg border border-gray-200 shadow-sm overflow-hidden bg-blue-50">
          {loading && <LoadingOverlay />}
          {error && <ErrorMessage message={error} />}
          
          <SceneContainer
            modelConfig={MODEL_CONFIG.Orca2025}
            viewerState={viewerState}
            onLoad={() => setLoading(false)}
            onError={setError}
            setSelectedHotspot={setSelectedHotspot}
          />
          
          {selectedHotspot && (
            <HotspotInfoPopup
              hotspot={selectedHotspot}
              setSelectedHotspot={setSelectedHotspot}
              renderer={selectedHotspot.sceneInfo?.renderer}
              camera={selectedHotspot.sceneInfo?.camera}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;