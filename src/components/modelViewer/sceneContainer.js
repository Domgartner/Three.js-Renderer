import { useEffect, useRef } from 'react';
import { initScene } from '../../utils/sceneSetup';
import { loadModel } from '../../utils/modelLoader';
import { createHotspots } from '../../utils/hotspotManager';

/**
 * Component that handles the Three.js scene initialization and lifecycle
 */
export default function SceneContainer({ modelConfig, viewerState, onLoad, onError, setSelectedHotspot}) 
{
  const containerRef = useRef(null);
  const sceneRef = useRef(null);

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
    };

    cleanupExistingScene();

    // Initialize the scene with container dimensions
    const { scene, camera, renderer, controls, raycaster, mouse, hotspots, cleanup } = initScene(containerRef.current);

    // Store scene reference for updates and cleanup
    sceneRef.current = { scene, camera, renderer, controls, raycaster, mouse, hotspots, cleanup };

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
    };
    
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Clean up function
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
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
      className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-100"
      style={{ touchAction: 'none' }}
    />
  );
}