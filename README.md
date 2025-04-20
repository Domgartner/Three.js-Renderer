# Three.js 3D Model Renderer

A React-based 3D model viewer built with Three.js, allowing users to load, render, and interact with 3D models in a web environment. This project supports features like hotspots, auto-rotation, and wireframe rendering, making it ideal for showcasing 3D designs or assemblies.

## Features

- **3D Model Rendering**: Load and render `.obj` and `.mtl` files using Three.js.
- **Interactive Hotspots**: Add clickable hotspots to models for displaying additional information.
- **Auto-Rotation**: Enable or disable automatic rotation of the 3D model.
- **Wireframe Mode**: Toggle wireframe rendering for better visualization of model geometry.
- **Responsive Design**: Adapts to different screen sizes for a seamless user experience.


## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```
2. Install dependencies
    ```bash
    npm ci
    ```
3. Start development server
    ```bash
    npm start
    ```

## Customization
Place your .obj and .mtl files in the public/ directory.
Update the model configuration in `src/config/modelConfig.js` to point to your model files and define any hotspots.
Start the app and interact with your 3D model.