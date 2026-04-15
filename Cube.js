import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

class Cube {
  constructor(world, scene, position, size = 1, cubesArray) {
    this.world = world;
    this.wasHit = false;
    this.resetTimer = null;
    this.size = size;
    this.cubesArray = cubesArray;
    this.scene = scene;
    this.alive = true;
    this.evaded = false;

    // Three.js mesh
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshMatcapMaterial({ color: 'red' }),
    );
    this.scene.add(this.mesh);
    this.mesh.position.copy(position);

    // Rapier body
    this.body = world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic().setTranslation(
        position.x,
        position.y,
        position.z,
      ),
    );

    this.collider = world.createCollider(
      RAPIER.ColliderDesc.cuboid(size / 2, size / 2, size / 2),
      this.body,
    );
  }

  hit(impulse) {
    this.body.applyImpulse(impulse, true);
    this.body.applyTorqueImpulse(
      {
        x: impulse.z,
        y: impulse.x,
        z: impulse.y,
      },
      true,
    );
    this.wasHit = true;

    clearTimeout(this.resetTimer);

    this.resetTimer = setTimeout(() => {
      this.wasHit = false;
    }, 1000);
  }

  update(isGameRunning) {
    if (!this.alive) return;
    const pos = this.body.translation();
    const rot = this.body.rotation();
    this.mesh.position.set(pos.x, pos.y, pos.z);
    this.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);

    if (!this.wasHit && isGameRunning) {
      this.body.applyImpulse(
        {
          x: 0,
          y: 0,
          z: 0.1,
        },
        true,
      );
    }
  }

  destroyAndSplit() {
    if (!this.alive) return;
    const index = this.cubesArray.indexOf(this);
    if (index !== 1) this.cubesArray.splice(index, 1);
    this.alive = false;
    const pos = this.body.translation();

    // remove old cube properly
    this.world.removeRigidBody(this.body);
    this.mesh.removeFromParent();

    const offsets = [-1, 1];
    const newSize = this.size / 2;

    for (let x of offsets) {
      for (let y of offsets) {
        for (let z of offsets) {
          const cube = new Cube(
            this.world,
            this.scene,
            {
              x: pos.x + x * newSize * 0.5,
              y: pos.y + y * newSize * 0.5,
              z: pos.z + z * newSize * 0.5,
            },
            newSize,
            this.cubesArray,
          );

          // explosion force

          cube.body.applyImpulse({ x: x * 2, y: y * 2, z: z * 2 }, true);

          this.cubesArray.push(cube);
        }
      }
    }
  }

  checkEvaded() {
    if (this.evaded && this.alive) {
      const index = this.cubesArray.indexOf(this);
      this.cubesArray.splice(index, 1);
      this.world.removeRigidBody(this.body);
      this.mesh.removeFromParent();
      return;
    }

    if (this.mesh.position.z >= 16) {
      this.evaded = true;
      return this.evaded;
    }
  }
}

export default Cube;
