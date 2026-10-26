// Headless safety checks for the installed computer labs. Run from any directory:
// node scripts/verify-computer-lab.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const threeUrl = pathToFileURL(require.resolve('three').replace('three.cjs', 'three.module.js')).href;
const gradient = () => ({ addColorStop() {} });
const context = new Proxy({
  measureText: text => ({ width: String(text).length * 14 }),
  createLinearGradient: gradient,
  createRadialGradient: gradient,
  createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
}, { get: (object, key) => key in object ? object[key] : () => {}, set: () => true });
globalThis.document = {
  // Minimal Node-only CanvasTexture stub; no deprecated browser API is invoked.
  // eslint-disable-next-line typescript/no-deprecated
  createElement: () => ({ width: 0, height: 0, getContext: () => context }),
};

// Use the real TypeScript sources without adding a test runner dependency.
const modules = new Map();
function compile(relativeFile) {
  const file = path.resolve(root, relativeFile);
  if (modules.has(file)) return modules.get(file);
  let js = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  js = js.replace(/(['"])three\1/g, JSON.stringify(threeUrl));
  js = js.replace(/(from\s*|import\s*)(['"])(\.{1,2}\/[^'"]+)\2/g, (_match, prefix, _quote, dependency) => {
    const base = path.resolve(path.dirname(file), dependency);
    const resolved = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    assert.ok(resolved, `Cannot resolve ${dependency} from ${file}`);
    return prefix + JSON.stringify(compile(resolved));
  });
  const url = 'data:text/javascript;base64,' + Buffer.from(js).toString('base64');
  modules.set(file, url);
  return url;
}

const labUrl = compile('components/computer-lab-scene.ts');
const { createComputerLabRoom, isInstalledComputerLab } = await import(labUrl);
const { roomEntry } = await import(compile('components/campus-tour-scene.ts'));
const catalogueUrl = compile('components/room-catalogue.ts');
const campus = fs.readFileSync(path.join(root, 'components/CampusEMap.tsx'), 'utf8');
const definitions = [
  `import { ROOM_CATALOGUE } from '${catalogueUrl}';`,
  `import { isInstalledComputerLab } from '${labUrl}';`,
  campus.slice(campus.indexOf('const FLOOR_LABELS'), campus.indexOf('const PLACES')),
  'export { ROOMS };',
].join('\n');
const dataJs = ts.transpileModule(definitions, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { ROOMS } = await import('data:text/javascript;base64,' + Buffer.from(dataJs).toString('base64'));

// Exercise the collision and click-to-walk implementation used by RoomPreview.
const walkSource = campus.slice(campus.indexOf('function roomFree('), campus.indexOf('function RoomPreview('));
assert.ok(walkSource.includes('function roomWalkPath('), 'RoomPreview navigation helpers were not found');
const walkJs = ts.transpileModule(walkSource + '\nreturn { roomFree, roomSegmentFree, roomWalkPath };', {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
// Evaluate only the local, trusted TypeScript helpers to exercise production navigation.
// eslint-disable-next-line typescript/no-implied-eval
const navigation = new Function('E104_PLAN', 'dist', walkJs)({}, distance);
const free = (point, built) => navigation.roomFree(point.x, point.z, built.obstacles, built.width, built.depth);
const segmentFree = (a, b, built) => navigation.roomSegmentFree([a.x, a.z], [b.x, b.z], built.obstacles, built.width, built.depth);

function reachableFloor(built) {
  const step = .16;
  const key = p => `${Math.round((p.x - built.start.x) / step)},${Math.round((p.z - built.start.z) / step)}`;
  assert.ok(free(built.start, built), `Entry spawn (${built.start.x.toFixed(3)}, ${built.start.z.toFixed(3)}) must be on unobstructed floor`);
  const queue = [{ x: built.start.x, z: built.start.z }];
  const visited = new Set([key(queue[0])]);
  for (let index = 0; index < queue.length; index++) {
    const point = queue[index];
    for (const [dx, dz] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const next = { x: point.x + dx, z: point.z + dz };
      const id = key(next);
      if (visited.has(id) || !free(next, built) || !segmentFree(point, next, built)) continue;
      visited.add(id);
      queue.push(next);
    }
  }
  assert.ok(queue.length > 100, 'Entry must connect to the room, not an isolated landing');
  return queue;
}

function verifyClickRoute(built, destination, label) {
  const start = [built.start.x, built.start.z];
  const route = navigation.roomWalkPath(start, [destination.x, destination.z], built.obstacles, built.width, built.depth);
  assert.ok(route.length, `${label}: click-to-walk must find a route`);
  let previous = built.start;
  for (const [x, z] of route) {
    const point = { x, z };
    assert.ok(free(point, built), `${label}: route waypoint intersects a wall or furniture`);
    assert.ok(segmentFree(previous, point, built), `${label}: smoothed route cuts through an obstacle`);
    previous = point;
  }
}

function verifyDoorOpenings(scene, room) {
  scene.updateMatrixWorld(true);
  const [left, north, right, south] = room.box;
  for (const door of room.doors) {
    const entry = roomEntry({ ...room, door });
    const normal = new THREE.Vector3(
      Math.abs(door[0] - left) < .01 ? -1 : Math.abs(door[0] - right) < .01 ? 1 : 0,
      0,
      Math.abs(door[1] - north) < .01 ? -1 : Math.abs(door[1] - south) < .01 ? 1 : 0,
    );
    assert.equal(normal.length(), 1, 'Door must lie on a room boundary');
    const tangent = new THREE.Vector3(-normal.z, 0, normal.x);
    for (const offset of [-.22, 0, .22]) {
      const origin = new THREE.Vector3(entry.x, 1.35, entry.z).addScaledVector(normal, -.4).addScaledVector(tangent, offset);
      const ray = new THREE.Raycaster(origin, normal, .01, .8);
      const blockers = ray.intersectObjects(scene.children, true).filter(hit => {
        if (!hit.object.isMesh) return false;
        const materials = Array.isArray(hit.object.material) ? hit.object.material : [hit.object.material];
        return materials.some(material => material.visible && material.opacity > .8);
      });
      assert.equal(blockers.length, 0, `${room.id}: an opaque mesh fills the door opening at ${door.join(',')}`);
    }
  }
}

function verifyFiniteTransforms(scene, label) {
  scene.updateMatrixWorld(true);
  scene.traverse(object => {
    assert.ok([...object.matrix.elements, ...object.matrixWorld.elements].every(Number.isFinite), `${label}: nonfinite transform on ${object.name || object.type}`);
    if (object.isInstancedMesh) assert.ok(object.instanceMatrix.array.every(Number.isFinite), `${label}: nonfinite furniture instance transform`);
  });
}

function appearance(scene) {
  const result = [];
  scene.traverse(object => {
    const materials = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : [];
    result.push([object.visible, ...materials.flatMap(material => [material.color?.getHex(), material.emissive?.getHex(), material.emissiveIntensity])]);
  });
  return JSON.stringify(result);
}

const targetIds = ['E402+E403', 'E602+E603'];
assert.deepEqual(ROOMS.filter(room => isInstalledComputerLab(room.id)).map(room => room.id), targetIds, 'Only the two photo-documented suites use this scene');
assert.equal(isInstalledComputerLab('E104'), false);
assert.equal(isInstalledComputerLab('E502+E503'), false);
assert.equal(isInstalledComputerLab('unknown'), false);
const results = [];

for (const id of targetIds) {
  const room = ROOMS.find(candidate => candidate.id === id);
  assert.ok(room, `${id} must exist in the real room catalogue`);
  assert.deepEqual(room.doors, [[4.2, 2.62], [1.3, 2.62], [5.38, 4.6]], `${id}: preserve the three documented entrances`);
  const cases = [];
  for (const furnished of [true, false]) {
    const scene = new THREE.Scene();
    const built = createComputerLabRoom(scene, room, furnished);
    const survey = scene.userData.computerLabSurvey;
    assert.ok(survey && Array.isArray(survey.columnCenters), 'Survey metadata must identify the fixed columns');
    assert.equal(survey.columnCenters.length, 2, 'The two structural columns must survive furniture toggles');
    const columns = scene.getObjectByName('survey-structural-columns');
    assert.ok(columns && columns.children.length >= 2 && columns.visible, 'The structural columns must remain visible');
    for (const column of survey.columnCenters) {
      assert.equal(free(column, built), false, `${id}: a column is missing from player collision`);
    }
    assert.equal(built.portals.length, 3, `${id}: all three entrances must remain usable`);
    for (const door of room.doors) {
      const expected = roomEntry({ ...room, door });
      assert.ok(built.portals.some(portal => portal.kind === 'exit' && Math.hypot(portal.x - expected.x, portal.z - expected.z) < .001), `${id}: portal does not match floor-plan entrance ${door.join(',')}`);
    }
    const reachable = reachableFloor(built);
    for (const door of room.doors) {
      const approach = roomEntry({ ...room, door }).start;
      assert.ok(free(approach, built), `${id}: furniture blocks a doorway landing`);
      assert.ok(reachable.some(point => Math.hypot(point.x - approach.x, point.z - approach.z) < .24), `${id}: a doorway is disconnected from the entry`);
      verifyClickRoute(built, approach, `${id} door ${door.join(',')}`);
    }
    if (furnished) {
      assert.ok(built.items.length > 0, `${id}: furniture must expose item information`);
      for (const item of built.items) {
        const candidates = reachable.filter(point => Math.hypot(point.x - item.x, point.z - item.z) < 2.2)
          .sort((a, b) => Math.hypot(a.x - item.x, a.z - item.z) - Math.hypot(b.x - item.x, b.z - item.z));
        const approach = candidates.find(point => navigation.roomWalkPath([built.start.x, built.start.z], [point.x, point.z], built.obstacles, built.width, built.depth).length);
        assert.ok(approach, `${id}: ${item.name} cannot be approached through click-to-walk for interaction`);
        verifyClickRoute(built, approach, `${id} item ${item.name}`);
      }
    } else {
      assert.equal(built.interactables.filter(object => Number.isInteger(object.userData.station)).length, 0, 'Hidden furniture must not remain pickable');
      assert.ok(built.obstacles.length > 0, 'Structural columns must still block walking when furniture is hidden');
    }
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(-9, 10, 11);
    built.update(0, .016, camera, false);
    verifyDoorOpenings(scene, room);
    let visibleActions = 0;
    for (let index = 0; index < built.items.length; index++) {
      built.highlight(index);
      const before = appearance(scene);
      built.activate(index);
      built.update(250, .016, camera, false);
      if (appearance(scene) !== before) visibleActions++;
      built.activate(index);
      built.highlight(-1);
    }
    if (furnished) assert.ok(visibleActions > 0, 'At least one equipment action must change the displayed state');
    for (const top of [true, false]) {
      for (const x of [-10, 10]) {
        camera.position.set(x, top ? 18 : 7, -x);
        built.update(1000, .016, camera, top);
        verifyFiniteTransforms(scene, `${id}, furnished=${furnished}, top=${top}`);
      }
    }
    cases.push({ built, scene, reachable: reachable.length });
  }
  for (const column of cases[1].built.obstacles) {
    assert.equal(free(column, cases[1].built), false, 'Hidden-furniture mode must collide with every structural obstacle');
    assert.equal(free(column, cases[0].built), false, 'Showing furniture must preserve structural collision');
  }
  results.push({ room: id, doors: 3, items: cases[0].built.items.length, reachableFloorCells: cases.map(testCase => testCase.reachable), structuralObstacles: cases[1].built.obstacles.length });
}

console.log(JSON.stringify({ status: 'PASS', rooms: results, checks: ['real room data', 'door geometry', 'entrance and equipment reachability', 'click-to-walk routes', 'structural collisions with furniture hidden', 'equipment actions', 'top and perspective updates', 'finite transforms'] }, null, 2));
