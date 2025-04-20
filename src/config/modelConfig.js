export const MODEL_CONFIG = {
    Orca2025: {
      objUrl: 'Full Assembly.obj',
      mtlUrl: 'Full Assembly.mtl',
      hotspots: [
        {
          id: 'nose',
          position: { x: 0, y: -0.85, z: 0 },
          color: 0xff5555,
          data: {
            title: 'Nose Section',
            description:
              'The front-most structural section of the assembly. Typically designed for aerodynamic performance and often contains avionics or sensor modules.'
          }
        },
        {
          id: 'wing',
          position: { x: 1.3, y: -0.2, z: 0.05 },
          color: 0xff5555,
          data: {
            title: 'Wing Structure',
            description:
              'Lateral aerodynamic surfaces that provide lift. Designed to support flight dynamics and may integrate control surfaces or payload mounting points.'
          }
        },
        {
          id: 'tail',
          position: { x: -0.22, y: 0.75, z: 0.05 },
          color: 0xff5555,
          data: {
            title: 'Tail Assembly',
            description:
              'Rear section of the model providing stability and control. Often includes vertical and horizontal stabilizers for pitch and yaw regulation.'
          }
        },
        {
          id: 'fuselage',
          position: { x: 0, y: -0.2, z: 0.05 },
          color: 0xff5555,
          data: {
            title: 'Fuselage',
            description:
              'The central body of the assembly that connects all major components. Houses internal systems and may serve as a mounting point for payloads or electronics.'
          }
        },
        {
          id: 'landinggear',
          position: { x: 0, y: -0.2, z: -0.36 },
          color: 0xff5555,
          data: {
            title: 'Landing Gear',
            description:
              'Support system used during ground operations. Provides stability during takeoff and landing, and is designed to absorb impact forces.'
          }
        }
      ]
    }
  };
  