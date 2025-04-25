import { useEffect, useRef, useState } from 'react';
import { initScene } from '../../utils/sceneSetup';
import { loadModel } from '../../utils/modelLoader';
import { createHotspots } from '../../utils/hotspotManager';
import { createAxisGizmo } from '../UI/axisGizmo';

export default function SceneContainer({ modelConfig, viewerState, onLoad, onError, setSelectedHotspot }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const gizmoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Performance detection (basic)
  const isLowEndDevice = () => {
    const nav = navigator;
    return (
      (nav.deviceMemory && nav.deviceMemory <= 4) || // e.g. 2GB or 4GB devices
      (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) // <= quad-core
    );
  };

  const toggleFullscreen = () => {
    if (!containerRef.current || !sceneRef.current) return;
    const { renderer, camera } = sceneRef.current;
    const elem = containerRef.current;

    const fullscreen = () =>
      elem.requestFullscreen?.() ||
      elem.webkitRequestFullscreen?.() ||
      elem.mozRequestFullScreen?.() ||
      elem.msRequestFullscreen?.();

    const exitFullscreen = () =>
      document.exitFullscreen?.() ||
      document.webkitExitFullscreen?.() ||
      document.mozCancelFullScreen?.() ||
      document.msExitFullscreen?.();

    if (!document.fullscreenElement) {
      fullscreen()?.then(() => {
        setIsFullscreen(true);
        setTimeout(() => updateRendererSize(), 100);
      });
    } else {
      exitFullscreen()?.then(() => {
        setIsFullscreen(false);
        setTimeout(() => updateRendererSize(), 100);
      });
    }
  };

  const updateRendererSize = () => {
    const { renderer, camera } = sceneRef.current || {};
    if (containerRef.current && renderer && camera) {
      const width = isFullscreen ? window.innerWidth : containerRef.current.clientWidth;
      const height = isFullscreen ? window.innerHeight : containerRef.current.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement || !!document.webkitFullscreenElement;
      setIsFullscreen(active);
      setTimeout(() => updateRendererSize(), 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const cleanupExistingScene = () => {
      const existingCanvas = containerRef.current.querySelector('canvas');
      if (existingCanvas) containerRef.current.removeChild(existingCanvas);
      sceneRef.current?.cleanup?.();
      gizmoRef.current?.cleanup?.();
    };

    cleanupExistingScene();

    // === Performance Tuning ===
    const lowEnd = isLowEndDevice();
    const renderOptions = {
      antialias: !lowEnd,
      pixelRatio: lowEnd ? 1 : Math.min(window.devicePixelRatio, 2),
    };

    const { scene, camera, renderer, controls, raycaster, mouse, hotspots, cleanup } = initScene(containerRef.current, renderOptions);
    sceneRef.current = { scene, camera, renderer, controls, raycaster, mouse, hotspots, cleanup };

    gizmoRef.current = createAxisGizmo({ mainCamera: camera, container: containerRef.current });

    controls.autoRotate = viewerState.autoRotate;
    controls.showHotspots = viewerState.showHotspots;

    loadModel({
      objUrl: modelConfig.objUrl,
      mtlUrl: modelConfig.mtlUrl,
      scene,
      onLoaded: (object) => {
        object.traverse((child) => {
          if (child.isMesh && child.material && !child.userData.isHotspot) {
            const apply = (mat) => (mat.wireframe = viewerState.wireframe);
            Array.isArray(child.material) ? child.material.forEach(apply) : apply(child.material);
          }
        });
        createHotspots({ scene, hotspotConfig: modelConfig.hotspots, hotspots });
        onLoad();
      },
      onError: () => onError('Failed to load the 3D model. Please try again.')
    });

    const handleClick = (event) => {
      if (!controls.showHotspots) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj) {
          if (obj.userData?.isHotspot) {
            setSelectedHotspot({
              id: obj.name,
              position: obj.position.clone(),
              data: obj.userData.hotspotData || {},
              sceneInfo: { renderer, camera },
            });
            break;
          }
          obj = obj.parent;
          if (!obj || obj.type === 'Scene') break;
        }
      }
    };
    renderer.domElement.addEventListener('click', handleClick);

    // === Animation Loop (with throttling) ===
    let animationFrameId;
    let time = 0;
    let lastRender = 0;
    const frameDelay = lowEnd ? 1000 / 30 : 0; // ~30 FPS cap on low-end

    const animate = (now) => {
      const delta = now - lastRender;
      if (delta >= frameDelay) {
        time += 0.01;
        lastRender = now;
        scene.traverse((obj) => obj.userData?.animate?.(time));
        controls.update();
        renderer.render(scene, camera);
        gizmoRef.current?.update?.();
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => updateRendererSize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      gizmoRef.current?.cleanup?.();
      cleanup();
    };
  }, [modelConfig.objUrl, modelConfig.mtlUrl]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene, controls } = sceneRef.current;

    scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        let current = obj;
        let isHotspot = false;
        while (current) {
          if (current.userData?.isHotspot) {
            isHotspot = true;
            break;
          }
          current = current.parent;
          if (!current || current.type === 'Scene') break;
        }

        if (!isHotspot) {
          const apply = (mat) => (mat.wireframe = viewerState.wireframe);
          Array.isArray(obj.material) ? obj.material.forEach(apply) : apply(obj.material);
        }
      }
    });

    controls.autoRotate = viewerState.autoRotate;
    controls.showHotspots = viewerState.showHotspots;

    scene.traverse((obj) => {
      if (obj.userData?.isHotspot) obj.visible = viewerState.showHotspots;
    });
  }, [viewerState]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-100 relative"
      style={{ touchAction: 'none', ...(isFullscreen ? { width: '100vw', height: '100vh' } : {}) }}
    >
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-10 bg-white bg-opacity-70 hover:bg-opacity-100 transition-all rounded-md px-3 py-1 text-sm"
      >
         {isFullscreen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        )}
      </button>
    </div>
  );
}