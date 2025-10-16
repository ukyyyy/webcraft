import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { PointerLockControls } from 'https://unpkg.com/three@0.158.0/examples/jsm/controls/PointerLockControls.js';
import { World } from './world.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 60, 180);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const controls = new PointerLockControls(camera, renderer.domElement);

const overlay = document.getElementById('overlay');
overlay.addEventListener('click', () => {
  controls.lock();
});
controls.addEventListener('lock', () => overlay.classList.add('hidden'));
controls.addEventListener('unlock', () => {
  overlay.classList.remove('hidden');
  movementState.forward = false;
  movementState.backward = false;
  movementState.left = false;
  movementState.right = false;
  movementState.sprint = false;
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0.9);
sunLight.position.set(80, 120, 60);
sunLight.castShadow = true;
scene.add(sunLight);

const world = new World(scene);
scene.add(camera);

const player = controls.getObject();
const spawnX = Math.floor(world.width / 2);
const spawnZ = Math.floor(world.depth / 2);
const spawnY = world.getSurfaceHeight(spawnX, spawnZ) + 6;
player.position.set(spawnX + 0.5, spawnY, spawnZ + 0.5);
scene.add(player);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(0, 0);
const clock = new THREE.Clock();

const movementState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false
};

let canJump = false;
let velocityY = 0;
const gravity = 25;
const playerHeight = 1.7;
const playerRadius = 0.35;
let currentBlock = 1;
const blockLabel = document.getElementById('block-label');
blockLabel.textContent = world.getBlockLabel(currentBlock);

function updateBlockLabel() {
  blockLabel.textContent = world.getBlockLabel(currentBlock);
}

function onKeyDown(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      movementState.forward = true;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      movementState.left = true;
      break;
    case 'ArrowDown':
    case 'KeyS':
      movementState.backward = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      movementState.right = true;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      movementState.sprint = true;
      break;
    case 'Space':
      if (canJump) {
        velocityY = 8;
        canJump = false;
      }
      break;
    default:
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      movementState.forward = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      movementState.left = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      movementState.backward = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      movementState.right = false;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      movementState.sprint = false;
      break;
    default:
      break;
  }
}

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

document.addEventListener('contextmenu', (event) => {
  if (controls.isLocked) event.preventDefault();
});

document.addEventListener('mousedown', (event) => {
  if (!controls.isLocked) return;

  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObject(world.mesh, false);
  const intersection = intersections[0];
  const hit = world.getIntersectedBlock(intersection);

  if (!hit) return;

  if (event.button === 0) {
    world.removeBlock(hit.position.x, hit.position.y, hit.position.z);
  } else if (event.button === 2) {
    const placePos = hit.position.clone().add(hit.normal);
    world.placeBlock(placePos.x, placePos.y, placePos.z, currentBlock);
  }
});

document.addEventListener('wheel', (event) => {
  if (!controls.isLocked) return;
  const delta = Math.sign(event.deltaY);
  currentBlock += delta;
  if (currentBlock >= world.blockTypes.length) currentBlock = 1;
  if (currentBlock <= 0) currentBlock = world.blockTypes.length - 1;
  updateBlockLabel();
});

function attemptMoveAxis(position, offset, axis) {
  if (offset === 0) return;
  position[axis] += offset;
  if (world.collides(position, playerRadius, playerHeight)) {
    position[axis] -= offset;
  }
}

function updatePlayer(delta) {
  if (!controls.isLocked) return;

  const direction = new THREE.Vector3();
  const forward = new THREE.Vector3();
  controls.getDirection(direction);
  forward.copy(direction);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize().negate();

  const move = new THREE.Vector3();
  if (movementState.forward) move.add(forward);
  if (movementState.backward) move.sub(forward);
  if (movementState.left) move.sub(right);
  if (movementState.right) move.add(right);
  if (move.lengthSq() > 0) move.normalize();

  const speed = movementState.sprint ? 10 : 6;
  move.multiplyScalar(speed * delta);

  const position = player.position;

  attemptMoveAxis(position, move.x, 'x');
  attemptMoveAxis(position, move.z, 'z');
  position.x = THREE.MathUtils.clamp(position.x, 1, world.width - 2);
  position.z = THREE.MathUtils.clamp(position.z, 1, world.depth - 2);

  velocityY -= gravity * delta;
  position.y += velocityY * delta;
  if (world.collides(position, playerRadius, playerHeight)) {
    const wasFalling = velocityY < 0;
    position.y -= velocityY * delta;
    velocityY = 0;
    if (wasFalling) canJump = true;
  } else {
    canJump = false;
  }
  position.y = THREE.MathUtils.clamp(position.y, 2, world.height + 20);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  updatePlayer(delta);
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
