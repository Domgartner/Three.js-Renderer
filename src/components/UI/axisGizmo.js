import * as THREE from 'three';

/**
 * Creates an orientation axis gizmo for the scene
 * @param {Object} params - Parameters
 * @param {THREE.Camera} params.mainCamera - Main camera
 * @param {HTMLElement} params.container - Container element
 * @returns {Object} Gizmo objects and update function
 */
export function createAxisGizmo({ mainCamera, container }) {
  // Create a separate scene for the gizmo
  const gizmoScene = new THREE.Scene();
  
  // Create a separate camera for the gizmo
  const gizmoCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  gizmoCamera.position.set(0, 0, 3);
  gizmoCamera.lookAt(0, 0, 0);
  
  // Create a renderer for the gizmo
  const gizmoRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  gizmoRenderer.setSize(80, 80);
  gizmoRenderer.setClearColor(0x000000, 0);
  
  // Position the gizmo renderer in the bottom right corner
  gizmoRenderer.domElement.style.position = 'absolute';
  gizmoRenderer.domElement.style.bottom = '20px';
  gizmoRenderer.domElement.style.right = '30px';
  gizmoRenderer.domElement.style.zIndex = '10';
  gizmoRenderer.domElement.style.pointerEvents = 'none'; // Ignore mouse events
  
  // Add the gizmo's canvas to the container
  container.appendChild(gizmoRenderer.domElement);
  
  // Create axes for the gizmo
  const axisLength = 1;

  // X-axis (red)
  const xAxisGeometry = new THREE.CylinderGeometry(0.04, 0.04, axisLength, 8);
  const xAxisMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const xAxis = new THREE.Mesh(xAxisGeometry, xAxisMaterial);
  xAxis.position.set(axisLength / 2, 0, 0);
  xAxis.rotation.z = -Math.PI / 2;
  gizmoScene.add(xAxis);

  const xConeGeometry = new THREE.ConeGeometry(0.08, 0.2, 8);
  const xCone = new THREE.Mesh(xConeGeometry, xAxisMaterial);
  xCone.position.set(axisLength, 0, 0);
  xCone.rotation.z = -Math.PI / 2;
  gizmoScene.add(xCone);

  // Y-axis (green)
  const yAxisGeometry = new THREE.CylinderGeometry(0.04, 0.04, axisLength, 8);
  const yAxisMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const yAxis = new THREE.Mesh(yAxisGeometry, yAxisMaterial);
  yAxis.position.set(0, axisLength / 2, 0);
  gizmoScene.add(yAxis);

  const yConeGeometry = new THREE.ConeGeometry(0.08, 0.2, 8);
  const yCone = new THREE.Mesh(yConeGeometry, yAxisMaterial);
  yCone.position.set(0, axisLength, 0);
  gizmoScene.add(yCone);

  // Z-axis (blue)
  const zAxisGeometry = new THREE.CylinderGeometry(0.04, 0.04, axisLength, 8);
  const zAxisMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const zAxis = new THREE.Mesh(zAxisGeometry, zAxisMaterial);
  zAxis.position.set(0, 0, axisLength / 2);
  zAxis.rotation.x = Math.PI / 2;
  gizmoScene.add(zAxis);

  const zConeGeometry = new THREE.ConeGeometry(0.08, 0.2, 8);
  const zCone = new THREE.Mesh(zConeGeometry, zAxisMaterial);
  zCone.position.set(0, 0, axisLength);
  zCone.rotation.x = Math.PI / 2;
  gizmoScene.add(zCone);

  // Axis label helper
  function createAxisLabel(text, color = '#ffffff') {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.font = 'bold 36px Arial';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    return new THREE.Sprite(material);
  }

  // Axis Labels
  const xLabel = createAxisLabel('X', '#ff0000');
  xLabel.position.set(axisLength + 0.3, 0, 0);
  xLabel.scale.set(0.3, 0.3, 0.3);
  gizmoScene.add(xLabel);

  const yLabel = createAxisLabel('Y', '#00ff00');
  yLabel.position.set(0, axisLength + 0.3, 0);
  yLabel.scale.set(0.3, 0.3, 0.3);
  gizmoScene.add(yLabel);

  const zLabel = createAxisLabel('Z', '#0000ff');
  zLabel.position.set(0, 0, axisLength + 0.3);
  zLabel.scale.set(0.3, 0.3, 0.3);
  gizmoScene.add(zLabel);

  // Group all gizmo elements
  const gizmoGroup = new THREE.Group();
  gizmoScene.children.forEach(child => {
    gizmoGroup.add(child.clone());
  });
  gizmoScene.clear();
  gizmoScene.add(gizmoGroup);

  // Function to update gizmo orientation based on main camera
  const updateGizmo = () => {
    const rotation = new THREE.Euler().copy(mainCamera.rotation);
    gizmoGroup.rotation.copy(rotation);
    gizmoRenderer.render(gizmoScene, gizmoCamera);
  };

  // Return objects and cleanup function
  return {
    update: updateGizmo,
    cleanup: () => {
      try {
        if (container && gizmoRenderer.domElement && container.contains(gizmoRenderer.domElement)) {
          container.removeChild(gizmoRenderer.domElement);
        }
      } catch (e) {
        console.warn("Failed to remove gizmo canvas:", e);
      }

      gizmoRenderer.dispose();

      [
        xAxisGeometry, xConeGeometry, yAxisGeometry,
        yConeGeometry, zAxisGeometry, zConeGeometry
      ].forEach(geo => geo?.dispose?.());

      [xAxisMaterial, yAxisMaterial, zAxisMaterial].forEach(mat => mat?.dispose?.());

      gizmoScene.children
        .filter(child => child.type === 'Sprite')
        .forEach(sprite => {
          sprite.material?.map?.dispose?.();
          sprite.material?.dispose?.();
        });
    }
  };
}
