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
    <div className="flex flex-col w-full h-full p-6 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Model Viewer</h1>
        <ViewerControls viewerState={viewerState} onToggleOption={handleToggleOption} />
      </div>

      <div className="relative h-screen max-h-[800px] w-full">
        <div className="absolute inset-0 rounded-xl border border-gray-300 shadow-lg overflow-hidden bg-white">
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