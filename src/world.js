import * as THREE from 'https://unpkg.com/three@0.158.0/build/three.module.js';
import { PerlinNoise } from './utils/perlinNoise.js';

const BLOCK_TYPES = [
  { id: 0, name: 'Luft', color: 0x000000 },
  { id: 1, name: 'Gras', color: 0x52a535 },
  { id: 2, name: 'Dreck', color: 0x8a5a2a },
  { id: 3, name: 'Stein', color: 0x888888 },
  { id: 4, name: 'Holz', color: 0x9d7b4a },
  { id: 5, name: 'Laub', color: 0x2f8f2f },
  { id: 6, name: 'Sand', color: 0xd7c97f }
];

const FACE_DEFS = [
  {
    dir: [0, 0, 1],
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1]
    ],
    shade: 0.95
  },
  {
    dir: [0, 0, -1],
    corners: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0]
    ],
    shade: 0.95
  },
  {
    dir: [1, 0, 0],
    corners: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1]
    ],
    shade: 0.8
  },
  {
    dir: [-1, 0, 0],
    corners: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0]
    ],
    shade: 0.8
  },
  {
    dir: [0, 1, 0],
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0]
    ],
    shade: 1
  },
  {
    dir: [0, -1, 0],
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1]
    ],
    shade: 0.6
  }
];

export class World {
  constructor(scene) {
    this.scene = scene;
    this.width = 64;
    this.height = 48;
    this.depth = 64;
    this.data = new Uint8Array(this.width * this.height * this.depth);
    this.noise = new PerlinNoise(12345);
    this.mesh = null;
    this.blockTypes = BLOCK_TYPES;
    this.generateTerrain();
    this.rebuildMesh();
  }

  index(x, y, z) {
    return x + this.width * (z + this.depth * y);
  }

  inBounds(x, y, z) {
    return (
      x >= 0 &&
      x < this.width &&
      y >= 0 &&
      y < this.height &&
      z >= 0 &&
      z < this.depth
    );
  }

  getBlock(x, y, z) {
    if (!this.inBounds(x, y, z)) return 0;
    return this.data[this.index(x, y, z)];
  }

  setBlock(x, y, z, id) {
    if (!this.inBounds(x, y, z)) return false;
    this.data[this.index(x, y, z)] = id;
    return true;
  }

  generateTerrain() {
    const maxTerrainHeight = 26;
    const minTerrainHeight = 6;
    const frequency = 0.045;
    const stoneThreshold = 5;
    const caveFrequency = 0.09;
    const caveThreshold = 0.45;
    const sandLevel = 12;

    for (let x = 0; x < this.width; x += 1) {
      for (let z = 0; z < this.depth; z += 1) {
        const heightNoise = this.noise.noise2D(x * frequency, z * frequency);
        const height = Math.floor(
          minTerrainHeight + ((heightNoise + 1) / 2) * (maxTerrainHeight - minTerrainHeight)
        );

        for (let y = 0; y < this.height; y += 1) {
          if (y > height) {
            this.setBlock(x, y, z, 0);
            continue;
          }

          let id = 3; // default stone
          if (y === height) {
            id = height < sandLevel ? 6 : 1;
          } else if (height - y <= 3) {
            id = height < sandLevel ? 6 : 2;
          }

          const caveNoise = this.noise.noise3D(
            x * caveFrequency,
            y * caveFrequency,
            z * caveFrequency
          );
          if (caveNoise > caveThreshold && y < height - stoneThreshold) {
            id = 0;
          }

          this.setBlock(x, y, z, id);
        }
      }
    }

    this.scatterTrees();
  }

  scatterTrees() {
    const treeFrequency = 0.025;
    const treeHeight = { min: 4, max: 6 };

    for (let x = 2; x < this.width - 2; x += 1) {
      for (let z = 2; z < this.depth - 2; z += 1) {
        const height = this.getSurfaceHeight(x, z);
        if (height <= 0) continue;
        const blockId = this.getBlock(x, height, z);
        if (blockId !== 1) continue;
        const noiseValue = this.noise.noise2D(x * treeFrequency, z * treeFrequency);
        if (noiseValue < 0.3) continue;
        if (Math.random() > 0.1) continue;

        const trunkHeight = Math.floor(
          treeHeight.min + Math.random() * (treeHeight.max - treeHeight.min)
        );

        for (let i = 1; i <= trunkHeight && height + i < this.height - 1; i += 1) {
          this.setBlock(x, height + i, z, 4);
        }

        const leafRadius = 2;
        const leafTop = height + trunkHeight;
        for (let lx = -leafRadius; lx <= leafRadius; lx += 1) {
          for (let ly = -leafRadius; ly <= leafRadius; ly += 1) {
            for (let lz = -leafRadius; lz <= leafRadius; lz += 1) {
              const dist = Math.abs(lx) + Math.abs(ly) + Math.abs(lz);
              if (dist > leafRadius + 1) continue;
              const px = x + lx;
              const py = leafTop + ly;
              const pz = z + lz;
              if (!this.inBounds(px, py, pz)) continue;
              if (this.getBlock(px, py, pz) !== 0) continue;
              if (py < this.height) {
                this.setBlock(px, py, pz, 5);
              }
            }
          }
        }
      }
    }
  }

  getSurfaceHeight(x, z) {
    for (let y = this.height - 1; y >= 0; y -= 1) {
      const block = this.getBlock(x, y, z);
      if (block !== 0) {
        return y;
      }
    }
    return 0;
  }

  rebuildMesh() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    }

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const normals = [];
    const colors = [];
    const uvs = [];
    const indices = [];
    const color = new THREE.Color();

    let indexOffset = 0;

    for (let x = 0; x < this.width; x += 1) {
      for (let y = 0; y < this.height; y += 1) {
        for (let z = 0; z < this.depth; z += 1) {
          const id = this.getBlock(x, y, z);
          if (id === 0) continue;
          const block = this.blockTypes[id];
          if (!block) continue;

          for (const face of FACE_DEFS) {
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];
            if (this.getBlock(nx, ny, nz) !== 0) continue;

            const shade = face.shade;
            color.setHex(block.color).multiplyScalar(shade);

            const faceCorners = face.corners;
            for (let i = 0; i < faceCorners.length; i += 1) {
              const corner = faceCorners[i];
              positions.push(x + corner[0], y + corner[1], z + corner[2]);
              normals.push(face.dir[0], face.dir[1], face.dir[2]);
              colors.push(color.r, color.g, color.b);
              const u = i === 0 || i === 3 ? 0 : 1;
              const v = i < 2 ? 0 : 1;
              uvs.push(u, v);
            }

            indices.push(
              indexOffset,
              indexOffset + 1,
              indexOffset + 2,
              indexOffset,
              indexOffset + 2,
              indexOffset + 3
            );
            indexOffset += 4;
          }
        }
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();

    const material = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
  }

  getIntersectedBlock(intersection) {
    if (!intersection) return null;
    const normal = intersection.face.normal;
    const point = intersection.point.clone().addScaledVector(normal, -0.5);
    const x = Math.floor(point.x);
    const y = Math.floor(point.y);
    const z = Math.floor(point.z);
    if (!this.inBounds(x, y, z)) return null;
    return {
      position: new THREE.Vector3(x, y, z),
      id: this.getBlock(x, y, z),
      normal
    };
  }

  placeBlock(x, y, z, id) {
    const px = Math.floor(x);
    const py = Math.floor(y);
    const pz = Math.floor(z);
    if (!this.setBlock(px, py, pz, id)) return false;
    this.rebuildMesh();
    return true;
  }

  removeBlock(x, y, z) {
    const px = Math.floor(x);
    const py = Math.floor(y);
    const pz = Math.floor(z);
    if (!this.setBlock(px, py, pz, 0)) return false;
    this.rebuildMesh();
    return true;
  }

  isSolid(x, y, z) {
    const block = this.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
    return block !== 0;
  }

  collides(position, radius, height) {
    const minX = Math.floor(position.x - radius);
    const maxX = Math.floor(position.x + radius);
    const minY = Math.floor(position.y - height);
    const maxY = Math.floor(position.y);
    const minZ = Math.floor(position.z - radius);
    const maxZ = Math.floor(position.z + radius);

    for (let x = minX; x <= maxX; x += 1) {
      for (let y = minY; y <= maxY; y += 1) {
        for (let z = minZ; z <= maxZ; z += 1) {
          if (this.getBlock(x, y, z) !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  getBlockLabel(index) {
    const block = this.blockTypes[index];
    return block ? block.name : '';
  }
}
