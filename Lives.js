import * as THREE from 'three';
import { FontLoader } from '/node_modules/three/examples/jsm/loaders/FontLoader.js';

import { TextGeometry } from '/node_modules/three/examples/jsm/geometries/TextGeometry.js';

class Lives {
  constructor(scene) {
    this.loader = new FontLoader();

    this.loader.load('/fonts/helvetiker_regular.typeface.json', (font) => {
      this.font = font;
      this.createText();
    });
    this.score = 5;
    this.scene = scene;
  }

  createText() {
    const geometry = new TextGeometry(`Lives: ${this.score}`, {
      font: this.font,
      size: 0.5,
      height: 0.1,
      curveSegments: 12,
    });
    const material = new THREE.MeshMatcapMaterial({ color: 'red' });

    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.geometry = geometry;
    } else {
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(-6, 6, 10);
      this.scene.add(this.mesh);
    }
  }

  updateScore(newScore) {
    this.score = newScore;

    if (!this.font) return;
    this.createText();
  }
}

export default Lives;
