import * as THREE from 'three';

/**
 * Create and manage hotspots on the 3D model
 * @param {Object} options - Configuration options
 */
export function createHotspots({ scene, hotspotConfig = [], hotspots = [] }) {
  
  // Clear any existing hotspots
  scene.traverse((object) => {
    if (object.userData && object.userData.isHotspot) {
      scene.remove(object);
    }
  });
  
  hotspots.length = 0;
  
  // Create hotspots
  hotspotConfig.forEach((hotspot) => {
    // Create position vector from config
    const position = new THREE.Vector3(
      hotspot.position.x || 0,
      hotspot.position.y || 0,
      hotspot.position.z || 0
    );
    
    // Create a group to hold all hotspot elements
    const hotspotGroup = new THREE.Group();
    hotspotGroup.position.copy(position);
    hotspotGroup.name = hotspot.id || `hotspot-${Math.random().toString(36).substr(2, 9)}`;
    hotspotGroup.userData.isHotspot = true;
    hotspotGroup.userData.hotspotData = hotspot.data || {};
    
    // Create main hotspot sphere
    const geometry = new THREE.SphereGeometry(0.05, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: hotspot.color || 0xff5555, transparent: true, opacity: 0.8 });
    
    const mesh = new THREE.Mesh(geometry, material);
    hotspotGroup.add(mesh);
    
    // inner glow effect
    const glowMaterial = new THREE.MeshBasicMaterial({ color: hotspot.color || 0xff5555, transparent: true, opacity: 0.4 });
    
    const glowSphere = new THREE.Mesh( new THREE.SphereGeometry(0.07, 16, 16), glowMaterial );
    hotspotGroup.add(glowSphere);
    
    // outer ring
    const ringGeometry = new THREE.RingGeometry(0.09, 0.1, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: hotspot.color || 0xff5555, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
    
    // Create a ring and position it to face the camera
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    hotspotGroup.add(ring);
    
    // Add to scene and hotspots array
    scene.add(hotspotGroup);
    hotspots.push(hotspotGroup);
    
    // Create animations for the hotspot
    hotspotGroup.userData.animate = (time) => {
      // Pulse the glow sphere
      const scale = 1 + 0.2 * Math.sin(time * 3);
      glowSphere.scale.set(scale, scale, scale);
      
      // Rotate the ring
      ring.rotation.z = time * 0.5;
      
      // Make the ring pulse
      const ringScale = 1 + 0.1 * Math.sin(time * 5);
      ring.scale.set(ringScale, ringScale, 1);
    };
  });
  
  return hotspots;
}