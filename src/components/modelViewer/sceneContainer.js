import { useEffect, useRef, useState } from 'react';
import { initScene } from '../../utils/sceneSetup';
import { loadModel } from '../../utils/modelLoader';
import { createHotspots } from '../../utils/hotspotManager';
import { createAxisGizmo } from '../UI/axisGizmo';

/**
 * Component that handles the Three.js scene initialization and lifecycle
 */
export default function SceneContainer({ modelConfig, viewerState, onLoad, onError, setSelectedHotspot}) 
{
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const gizmoRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!containerRef.current || !sceneRef.current) return;
    
    const { renderer, camera } = sceneRef.current;
    
    if (!document.fullscreenElement) {
      // Enter fullscreen
      let requestSuccess = false;
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
        requestSuccess = true;
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
        requestSuccess = true;
      } else if (containerRef.current.mozRequestFullScreen) {
        containerRef.current.mozRequestFullScreen();
        requestSuccess = true;
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
        requestSuccess = true;
      }
      if(requestSuccess){
        setIsFullscreen(true);
        // Resize renderer to window size after a slight delay to ensure fullscreen is complete
        setTimeout(() => {
            if (renderer && camera) {
                renderer.setSize(window.innerWidth, window.innerHeight);
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
            }
        }, 100);
    }
    } else {
      // Exit fullscreen
      let exitSuccess = false;
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
          // Return to container size after exiting fullscreen
          setTimeout(() => {
            if (renderer && camera && containerRef.current) {
              const width = containerRef.current.clientWidth;
              const height = containerRef.current.clientHeight;
              renderer.setSize(width, height);
              camera.aspect = width / height;
              camera.updateProjectionMatrix();
            }
          }, 100);
        }).catch();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        exitSuccess = true;
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
        exitSuccess = true;
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
        exitSuccess = true;
      }
      if(exitSuccess) {
        setIsFullscreen(false);
        setTimeout(() => updateRendererSize(), 100);
      }
    }
  };

  const updateRendererSize = () => {
    if (!containerRef.current || !sceneRef.current) return;
    
    const { renderer, camera } = sceneRef.current;
    if (renderer && camera) {
      const width = isFullscreen ? window.innerWidth : containerRef.current.clientWidth;
      const height = isFullscreen ? window.innerHeight : containerRef.current.clientHeight;
      
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  };

  // Add event listener for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenActive = !!document.fullscreenElement || 
                !!document.webkitFullscreenElement || 
                !!document.mozFullScreenElement || 
                !!document.msFullscreenElement;
                                
      setIsFullscreen(fullscreenActive);
      // Update renderer size on fullscreen change
      setTimeout(() => updateRendererSize(), 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing scene if any
    const cleanupExistingScene = () => {
      const existingCanvas = containerRef.current.querySelector('canvas');
      if (existingCanvas) {
        containerRef.current.removeChild(existingCanvas);
      }
      if (sceneRef.current?.cleanup) {
        sceneRef.current.cleanup();
      }
      if (gizmoRef.current?.cleanup) {
        gizmoRef.current.cleanup();
      }
    };

    cleanupExistingScene();

    // Initialize the scene with container dimensions
    const { scene, camera, renderer, controls, raycaster, mouse, hotspots, cleanup } = initScene(containerRef.current);

    // Store scene reference for updates and cleanup
    sceneRef.current = { scene, camera, renderer, controls, raycaster, mouse, hotspots, cleanup };

    // Create and initialize the axis gizmo
    gizmoRef.current = createAxisGizmo({ mainCamera: camera, container: containerRef.current });

    // Apply viewer state to scene
    controls.autoRotate = viewerState.autoRotate;
    controls.showHotspots = viewerState.showHotspots;
    
    // Load the model
    loadModel({
      objUrl: modelConfig.objUrl,
      mtlUrl: modelConfig.mtlUrl,
      scene,
      onLoaded: (object) => {
        // Update material properties based on viewer state
        object.traverse((child) => {
          if (child.isMesh && child.material && !child.userData.isHotspot) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                mat.wireframe = viewerState.wireframe;
              });
            } else {
              child.material.wireframe = viewerState.wireframe;
            }
          }
        });

        // Create hotspots based on model config
        createHotspots({ scene, hotspotConfig: modelConfig.hotspots, hotspots });
        onLoad();
      },
      onError: () => { onError('Failed to load the 3D model. Please try again.'); }
    });

    // Set up click handler for hotspots
    const handleClick = (event) => {
        if(!controls.showHotspots) return;

        // Calculate mouse position in normalized device coordinates (-1 to +1)
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);
        
        // Calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        
        // Check if the clicked object or any of its parents is a hotspot
        let current = clickedObject;
        while (current) {
            if (current.userData && current.userData.isHotspot) {
                setSelectedHotspot({
                    id: current.name,
                    position: current.position.clone(),
                    data: current.userData.hotspotData || {},
                    sceneInfo: { renderer, camera }
                });
                return; // Exit after handling the hotspot
            }
            
            // Move up to the parent
            current = current.parent;     
            // Break if we've reached the scene or null
            if (!current || current.type === 'Scene') break;
        }
        }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // Animation loop
    let animationFrameId;
    let time = 0;
    
    const animate = () => {
      time += 0.01;
      animationFrameId = requestAnimationFrame(animate);
      
      // Update hotspot animations if they exist
      scene.traverse((object) => {
        if (object.userData && object.userData.animate) {
          object.userData.animate(time);
        }
      });
      
      controls.update();
      renderer.render(scene, camera);
      
      // Update the axis gizmo orientation to match the camera
      if (gizmoRef.current && gizmoRef.current.update) {
        gizmoRef.current.update();
      }
    };
    
    animate();

    const handleResize = () => {
      updateRendererSize();
    };

    window.addEventListener('resize', handleResize);

    // Clean up function
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
      if (gizmoRef.current && gizmoRef.current.cleanup) {
        gizmoRef.current.cleanup();
      }
      cleanup();
    };
  }, [modelConfig.objUrl, modelConfig.mtlUrl]);

  // Update scene when viewer state changes
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const { scene, controls } = sceneRef.current;
    
    // Update wireframe mode
    scene.traverse((object) => {
        if (object.isMesh && object.material) {
          // Check if this object or any parent is a hotspot
          let isPartOfHotspot = false;
          let current = object;
          
          while (current) {
            if (current.userData && current.userData.isHotspot) {
              isPartOfHotspot = true;
              break;
            }
            current = current.parent;
            if (!current || current.type === 'Scene') break;
          }
          
          // Only apply wireframe to non-hotspot objects
          if (!isPartOfHotspot) {
            if (Array.isArray(object.material)) {
              object.material.forEach(mat => {
                mat.wireframe = viewerState.wireframe;
              });
            } else {
              object.material.wireframe = viewerState.wireframe;
            }
          }
        }
      });
    
    // Update controls
    controls.autoRotate = viewerState.autoRotate;
    controls.showHotspots = viewerState.showHotspots;
    
    // Update hotspot visibility
    scene.traverse((object) => {
      if (object.userData && object.userData.isHotspot) {
        object.visible = viewerState.showHotspots;
      }
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
        className="absolute top-4 right-4 z-10 bg-white bg-opacity-70 hover:bg-opacity-100 p-2 rounded-full shadow-md transition-all duration-200"
        style={{ width: '36px', height: '36px' }}
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
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