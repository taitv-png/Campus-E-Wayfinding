// Compare the live catalogue with the approved sign names and exercise both languages.
// Run: node scripts/verify-room-names.mjs [optional-canonical-signs-json]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const approvedPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'scripts/room-sign-names-2026-10-26.json');
const approved = JSON.parse(fs.readFileSync(approvedPath, 'utf8'));
assert.equal(approved.updated, '2026-10-26');
assert.equal(approved.entries.length, 25);
const expected = Object.fromEntries(approved.entries.flatMap(entry => {
  const codes = entry.room.match(/E\d{3}/g);
  assert.ok(codes?.length, `Missing room code: ${entry.room}`);
  return (codes[0] === 'E502' ? codes : [codes.join('+')]).map(id => [id, entry.names.join(' | ')]);
}));
assert.equal(Object.keys(expected).length, 26);

function loader() {
  const cache = new Map();
  function evaluate(source, file) {
    const module = { exports: {} };
    cache.set(file, module);
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const localRequire = dependency => {
      if (!dependency.startsWith('.')) return require(dependency);
      const base = path.resolve(path.dirname(file), dependency);
      const resolved = [base, `${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
      assert.ok(resolved, `Cannot resolve ${dependency} from ${file}`);
      return load(resolved);
    };
    new Function('module', 'exports', 'require', compiled)(module, module.exports, localRequire);
    return module.exports;
  }
  function load(file) {
    file = path.resolve(file);
    return cache.has(file) ? cache.get(file).exports : evaluate(fs.readFileSync(file, 'utf8'), file);
  }
  return { load, evaluate };
}

const mapPath = path.join(root, 'components/CampusEMap.tsx');
const mapSource = fs.readFileSync(mapPath, 'utf8');
const routeSource = mapSource.slice(mapSource.indexOf('const FLOOR_LABELS'), mapSource.indexOf('function labelSprite('));
assert.ok(routeSource.includes('function routeFor('), 'Production routing helpers were not found');
const routeGeometry = new Map();
let checkedRoutes = 0, checkedPhotos = 0;
try {
  for (const lang of ['en', 'vi']) {
    globalThis.document = { documentElement: { lang } };
    const { load, evaluate } = loader();
    const { ROOM_CATALOGUE, commonSpaceName } = load(path.join(root, 'components/room-catalogue.ts'));
    const { floorRooms } = load(path.join(root, 'components/floor-rooms.ts'));
    const { ROOM_SURVEYS } = load(path.join(root, 'components/room-surveys.ts'));
    const rooms = Array.from({ length: 8 }, (_, floor) => floorRooms(floor)).flat();
    assert.deepEqual(Object.keys(ROOM_CATALOGUE).sort(), Object.keys(expected).sort(), `${lang}: catalogue room IDs`);
    assert.deepEqual(rooms.map(room => room.id).sort(), Object.keys(expected).sort(), `${lang}: floor-plan room IDs`);
    for (const room of rooms) {
      assert.equal(ROOM_CATALOGUE[room.id].name, expected[room.id], `${lang}: ${room.id} approved sign name`);
      assert.equal(room.name, expected[room.id], `${lang}: ${room.id} floor-plan title`);
      assert.ok(ROOM_CATALOGUE[room.id].description.trim(), `${lang}: ${room.id} missing description`);
    }
    for (const code of ['E502', 'E503']) assert.equal(rooms.find(room => room.id === code).kind, 'lab');
    for (const code of ['E501', 'E504']) assert.equal(rooms.find(room => room.id === code).kind, 'class');
    assert.equal(commonSpaceName(0), lang === 'en' ? 'Interactive technology lobby' : 'Sảnh công nghệ tương tác');
    assert.equal(commonSpaceName(7), lang === 'en' ? 'Innovation lobby' : 'Sảnh đổi mới sáng tạo');
    assert.equal(ROOM_SURVEYS.E303.folder, 'survey-e304', 'Retain the confirmed E303 survey mapping');
    assert.equal(ROOM_SURVEYS.E304.folder, 'survey-e303', 'Retain the confirmed E304 survey mapping');
    for (const [id, survey] of Object.entries(ROOM_SURVEYS)) {
      assert.ok(expected[id], `${lang}: unknown surveyed room ${id}`);
      assert.ok(survey.summary && survey.sourceLabel, `${lang}: ${id} missing survey copy`);
      for (const photo of survey.photos) {
        assert.ok(fs.existsSync(path.join(root, 'public/rooms', survey.folder, `${photo.file}.jpg`)), `${id}: missing photo ${photo.file}`);
        if (lang === 'en') checkedPhotos++;
      }
    }
    const { STARTS, ROOMS, routeFor } = evaluate([
      "import { floorRooms } from './floor-rooms';",
      "import { tr } from './locale';",
      routeSource,
      'export { STARTS, ROOMS, routeFor };',
    ].join('\n'), mapPath);
    const pairs = [
      ...ROOMS.map(room => [STARTS[0], room]),
      ['E201', 'E204'], ['E402+E403', 'E602+E603'], ['E702', 'E001'], ['E104', 'E302'],
    ].map(pair => typeof pair[0] === 'string'
      ? [STARTS.find(start => start.id === `ROOM-${pair[0]}`), ROOMS.find(room => room.id === pair[1])]
      : pair);
    for (const [start, destination] of pairs) {
      const route = routeFor(start, destination);
      assert.ok(route.steps.length >= 3, `${lang}: ${destination.id} missing route instructions`);
      assert.equal(route.steps.at(-1), lang === 'en' ? `Stop at the door of ${destination.id}` : `Dừng ngay trước cửa ${destination.id}`);
      for (const points of Object.values(route.paths)) {
        assert.ok(points.length >= 2, `${lang}: ${destination.id} empty route segment`);
        assert.ok(points.flat().every(Number.isFinite), `${lang}: ${destination.id} nonfinite route`);
      }
      const key = `${start.id}:${destination.id}`;
      const geometry = { mode: route.mode, floors: route.floors, paths: route.paths };
      if (lang === 'en') routeGeometry.set(key, geometry);
      else assert.deepEqual(geometry, routeGeometry.get(key), `${key}: changing language must preserve the route`);
      checkedRoutes++;
    }
  }
} finally {
  delete globalThis.document;
}
console.log(`Room names passed: 26 map destinations match 25 approved signs in both languages; ${checkedRoutes} localized routes; ${checkedPhotos} survey photo references.`);
