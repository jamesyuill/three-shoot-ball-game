import * as THREE from 'three';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import RAPIER from '@dimforge/rapier3d-compat';

await RAPIER.init();

const physicsObjects = [];

//MOUSE CONTROLS
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  // normalize mouse (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  shootSphere(mouse);
});

//PHYSICS WORLD
const gravity = { x: 0.0, y: -9.81, z: 0.0 };
const world = new RAPIER.World(gravity);

//SCENE & CAMERA
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 3, 20);

//RENDERER
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x333333, 1);
document.body.appendChild(renderer.domElement);

//LIGHTS
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

//GEOMETRY
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const boxMat = new THREE.MeshMatcapMaterial({ color: 'red' });
const boxMesh = new THREE.Mesh(boxGeo, boxMat);

scene.add(boxMesh);

const cubeBody = world.createRigidBody(
  RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 2, -10),
);

const cubeCollider = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5).setDensity(1);
world.createCollider(cubeCollider, cubeBody);

let cubeWasHit = false;
// setTimeout(() => {
//   cubeWasHit = false;
// }, 1000);

//FLOOR
const boxPlaneGeo = new THREE.BoxGeometry(10, 40, 1);
const boxPlaneMat = new THREE.MeshMatcapMaterial();
const boxPlaneMesh = new THREE.Mesh(boxPlaneGeo, boxPlaneMat);
boxPlaneMesh.rotation.set(-Math.PI / 2, 0, 0);
boxPlaneMesh.position.set(0, -0.5, 0);
scene.add(boxPlaneMesh);

const ground = world.createRigidBody(
  RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0),
);

world.createCollider(RAPIER.ColliderDesc.cuboid(5, 0.5, 20), ground);

//ANIMATE
function animate() {
  requestAnimationFrame(animate);

  world.step();

  physicsObjects.forEach((obj) => {
    // assuming this is your bullet
    world.contactPair(obj.collider, cubeCollider, () => {
      const vel = obj.body.linvel();

      cubeBody.applyImpulse(
        {
          x: -vel.x,
          y: -vel.y,
          z: -vel.z,
        },
        true,
      );
    });
    cubeWasHit = true;
  });

  if (!cubeWasHit) {
    const vel = cubeBody.linvel();

    cubeBody.setLinvel(
      {
        x: vel.x,
        y: vel.y,
        z: 5,
      },
      true,
    );
  }

  // Update bullets
  for (let i = physicsObjects.length - 1; i >= 0; i--) {
    const obj = physicsObjects[i];

    const pos = obj.body.translation();

    if (pos.y < -10) {
      scene.remove(obj.mesh);
      world.removeRigidBody(obj.body);
      physicsObjects.splice(i, 1);
      continue;
    }

    const rot = obj.body.rotation();

    obj.mesh.position.set(pos.x, pos.y, pos.z);
    obj.mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w);
  }

  // Sync cube mesh
  const position = cubeBody.translation();
  const rotation = cubeBody.rotation();

  boxMesh.position.set(position.x, position.y, position.z);
  boxMesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);

  renderer.render(scene, camera);
}
animate();

//EVENT HANDLER
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function shootSphere(mouse) {
  // Create ray from camera
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const direction = raycaster.ray.direction.clone();

  // --- CREATE SPHERE (visual) ---
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 16, 16),
    new THREE.MeshStandardMaterial({ color: 'green' }),
  );
  scene.add(sphere);

  // --- CREATE PHYSICS BODY ---
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic().setTranslation(
      camera.position.x,
      camera.position.y,
      camera.position.z,
    ),
  );

  // body.setLinvel(direction.multiplyScalar(60), true);

  body.setGravityScale(0);
  body.applyImpulse(
    {
      x: direction.x * 10,
      y: direction.y * 10,
      z: direction.z * 10,
    },
    true,
  );

  const colliderDesc = RAPIER.ColliderDesc.ball(0.2).setDensity(20); // 👈 heavier (default is 1)

  const collider = world.createCollider(colliderDesc, body);
  // --- SHOOT IT 🚀 ---
  const speed = 40;

  body.setLinvel(
    {
      x: direction.x * speed,
      y: direction.y * speed,
      z: direction.z * speed,
    },
    true,
  );

  // store for updates
  physicsObjects.push({ mesh: sphere, body, collider: collider });
}
