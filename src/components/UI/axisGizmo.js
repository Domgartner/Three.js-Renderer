import * as THREE from 'three';

/**
 * Creates an orientation axis gizmo for the scene
 * @param {Object} params
 * @param {THREE.Camera} params.mainCamera
 * @param {HTMLElement} params.container
 */
export function createAxisGizmo({ mainCamera, container }) {
  // Create a new scene for the gizmo
  const gizmoScene = new THREE.Scene();

  // Set up the camera for the gizmo
  const size = 1.4;
  const gizmoCamera = new THREE.OrthographicCamera(-size, size, size, -size, 0.1, 100);
  gizmoCamera.position.set(0, 0, 3);
  gizmoCamera.lookAt(0, 0, 0);

  // Set up the renderer for the gizmo
  const gizmoRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  gizmoRenderer.setSize(80, 80);
  gizmoRenderer.setClearColor(0x000000, 0);
  Object.assign(gizmoRenderer.domElement.style, {
    position: 'absolute',
    bottom: '20px',
    right: '30px',
    zIndex: '10',
    pointerEvents: 'none'
  });
  container.appendChild(gizmoRenderer.domElement);

  const createAxis = (dir, color, rotation, labelOffset) => {
    const mat = new THREE.MeshBasicMaterial({ color });
    const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 8), mat);
    axis.position.copy(dir.clone().multiplyScalar(0.5));
    axis.rotation.setFromVector3(rotation);
    gizmoScene.add(axis);

    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 8), mat);
    cone.position.copy(dir.clone());
    cone.rotation.setFromVector3(rotation);
    gizmoScene.add(cone);

    const label = createLabel(dir, color, labelOffset);
    gizmoScene.add(label);

    return { geometry: [axis.geometry, cone.geometry], material: mat };
  };

  const createLabel = (dir, color, offset = 0.3) => {
    const axisLetter = ['X', 'Y', 'Z'][['x', 'y', 'z'].indexOf(Object.keys(dir).find(k => dir[k] !== 0))];
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 60px Arial';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(axisLetter, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
    sprite.position.copy(dir.clone().multiplyScalar(1 + offset));
    sprite.scale.set(0.3, 0.3, 0.3);
    return sprite;
  };

  const x = new THREE.Vector3(1, 0, 0);
  const y = new THREE.Vector3(0, 1, 0);
  const z = new THREE.Vector3(0, 0, 1);

  const created = [
    createAxis(x, '#ff0000', new THREE.Vector3(0, 0, -Math.PI / 2), 0.3), // X axis (red)
    createAxis(y, '#00ff00', new THREE.Vector3(0, 0, 0), 0.3),            // Y axis (green)
    createAxis(z, '#0000ff', new THREE.Vector3(Math.PI / 2, 0, 0), 0.3)   // Z axis (blue)
  ];

  const gizmoGroup = new THREE.Group();     // Group to hold all gizmo elements
  gizmoScene.children.forEach(child => gizmoGroup.add(child.clone()));
  gizmoScene.clear();
  gizmoScene.add(gizmoGroup);

  const updateGizmo = () => {
    gizmoGroup.rotation.copy(mainCamera.rotation);
    gizmoRenderer.render(gizmoScene, gizmoCamera);
  };

  return {
    update: updateGizmo,
    cleanup: () => {
      container?.contains(gizmoRenderer.domElement) && container.removeChild(gizmoRenderer.domElement);
      gizmoRenderer.dispose();
      created.forEach(({ geometry, material }) => {
        geometry.forEach(g => g.dispose());
        material.dispose();
      });
      gizmoScene.children.forEach(child => {
        if (child.type === 'Sprite') {
          child.material?.map?.dispose?.();
          child.material?.dispose?.();
        }
      });
    }
  };
}
