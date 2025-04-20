import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';

/**
 * Load OBJ and MTL files and add the model to the scene
 */
export function loadModel({ objUrl, mtlUrl, scene, onLoaded, onError}) 
{
  const loadingManager = new THREE.LoadingManager();
  
  // Check if we have MTL file
  if (mtlUrl) {
    const mtlLoader = new MTLLoader(loadingManager);
    
    mtlLoader.load(
      mtlUrl,
      (materials) => {
        materials.preload();
        loadObjWithMaterials(materials);
      },
      null, // progress callback (not used currently)
      (error) => {
        console.warn('MTL loading failed, continuing with OBJ only', error);
        loadObjOnly(); // Continue loading OBJ without materials
      }
    );
  } else {
    loadObjOnly();
  }

  function loadObjWithMaterials(materials) {
    const objLoader = new OBJLoader(loadingManager);
    objLoader.setMaterials(materials);
    loadObj(objLoader);
  }

  function loadObjOnly() {
    const objLoader = new OBJLoader(loadingManager);
    loadObj(objLoader);
  }

  function loadObj(objLoader) {
    objLoader.load(
      objUrl,
      (object) => {
        // Center the model
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        object.position.sub(center);
        
        // Apply default material if needed
        object.traverse((child) => {
          if (child.isMesh && !child.material) {
            child.material = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.7, metalness: 0.2 });
          }
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(object);
        onLoaded(object);
      },
      null, // progress callback (not used currently)
      onError
    );
  }
}