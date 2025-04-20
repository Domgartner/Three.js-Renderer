import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Initialize a Three.js scene with standard components
 * @param {HTMLElement} container - DOM element to attach the renderer
 * @returns {Object} Scene components and cleanup function
 */
export function initScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf5f5f5);
  
  // Set up camera
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, -2, 1.8);
  camera.lookAt(0, 0, 0);
  
  // Configure renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.classList.add('cursor-move');

  container.appendChild(renderer.domElement);
  
  const setupLighting = () => {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Main directional light with shadows
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 10, 7.5);
    mainLight.castShadow = true;
    
    // Shadow properties
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 50;
    mainLight.shadow.bias = -0.0001;

    scene.add(mainLight);
    
    // Fill light from opposite side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 2, -7.5);
    scene.add(fillLight);
    
    // Rim light for highlighting edges
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rimLight.position.set(0, -5, -2);
    scene.add(rimLight);
    
    return { ambientLight, mainLight, fillLight, rimLight };
  };
  
  const lights = setupLighting();
  
  // Enhanced controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.enableZoom = true;
  controls.enablePan = true;
  controls.minDistance = 0.6;
  controls.maxDistance = 4;
  controls.target.set(0, 0, 0);
  
  // Rotation configuration
  controls.rotateSpeed = 0.5;
  controls.zoomSpeed = 1.0;
  
  controls.addEventListener('start', () => {
    renderer.domElement.style.cursor = 'grabbing';
  });
  controls.addEventListener('end', () => {
    renderer.domElement.style.cursor = 'grab';
  });
  
  // Cleanup to prevent memory leaks
  const cleanup = () => {
    controls.dispose();
    renderer.dispose();
    
    // Dispose of geometries and materials
    scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  };

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const hotspots = [];
  
  return { scene, camera, renderer, controls, lights, raycaster, mouse, hotspots, cleanup};
}