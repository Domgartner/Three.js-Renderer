import { useEffect, useRef, useState } from 'react';

/**
 * Component that displays information about a clicked hotspot
 * Appears near the clicked hotspot in the 3D scene
 */
export default function HotspotInfoPopup({ hotspot, setSelectedHotspot, renderer, camera }) {
  const popupRef = useRef(null);
  const animationRef = useRef(null);
  const previousPosition = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!hotspot || !popupRef.current || !renderer || !camera) return;

    const calculatePosition = () => {
      const position = hotspot.position.clone();
      const vector = position.project(camera);

      const widthHalf = renderer.domElement.clientWidth / 2;
      const heightHalf = renderer.domElement.clientHeight / 2;

      const x = (vector.x * widthHalf) + widthHalf;
      const y = -(vector.y * heightHalf) + heightHalf;

      return { x, y };
    };

    const updatePopupPosition = () => {
      if (!popupRef.current) return;

      const idealPosition = calculatePosition();

      const popup = popupRef.current.getBoundingClientRect();
      const container = renderer.domElement.getBoundingClientRect();
      const padding = 10;

      let posX = idealPosition.x + 20;
      let posY = idealPosition.y - 20;

      const rightOverflow = posX + popup.width > container.right - padding;
      if (rightOverflow) {
        posX = idealPosition.x - popup.width - 20;
      }

      const bottomOverflow = posY + popup.height > container.bottom - padding;
      if (bottomOverflow) {
        posY = idealPosition.y - popup.height - 20;
      }

      posX = Math.max(container.left + padding, Math.min(posX, container.right - popup.width - padding));
      posY = Math.max(container.top + padding, Math.min(posY, container.bottom - popup.height - padding));

      const smoothingFactor = 0.3;
      const smoothX = previousPosition.current.x + (posX - previousPosition.current.x) * smoothingFactor;
      const smoothY = previousPosition.current.y + (posY - previousPosition.current.y) * smoothingFactor;

      previousPosition.current = { x: smoothX, y: smoothY };
      setPosition({ x: smoothX, y: smoothY });
    };

    // Initial position and visibility setup
    const initialPos = calculatePosition();
    previousPosition.current = initialPos;
    setPosition(initialPos);

    // Show popup on next frame to avoid flicker
    requestAnimationFrame(() => setIsReady(true));

    const animatePosition = () => {
      updatePopupPosition();
      animationRef.current = requestAnimationFrame(animatePosition);
    };

    animationRef.current = requestAnimationFrame(animatePosition);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setIsReady(false); // Reset ready state when unmounting
    };
  }, [hotspot, renderer, camera]);

  if (!hotspot) return null;

  return (
    <div
      ref={popupRef}
      className="absolute z-10 w-64 bg-white rounded-lg shadow-lg border border-blue-100 overflow-hidden transition-opacity duration-200 ease-in-out"
      style={{
        pointerEvents: 'auto',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate3d(0,0,0)',
        opacity: isReady ? 1 : 0,
        visibility: isReady ? 'visible' : 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-blue-50 px-4 py-2 border-b border-blue-100">
        <h3 className="font-medium text-blue-900">{hotspot.data.title}</h3>
        <button onClick={() => setSelectedHotspot(null)} className="text-gray-500 hover:text-red-400 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      {/* Content */}
      <div className="p-4">
        <p className="text-gray-700">{hotspot.data.description}</p>
      </div>
    </div>
  );
}