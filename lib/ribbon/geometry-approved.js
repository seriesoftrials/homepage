/**
 * Closed, constant-width SERIAL ribbon. Main front projection follows the 2D master.
 * Source coordinates are centered at (650, 600), Y-up, and divided by 350.
 * No renderer, animation, dependency, or external asset is owned by this module.
 */
const SOURCE = Object.freeze({
  center: [650, 600],
  normalize: 350,
  mainPoints: [[850, 255], [580, 465], [650, 600], [720, 735], [450, 945]],
  returnPoints: [[850, 255], [932, 345], [650, 600], [368, 855], [450, 945]],
  mainKnots: [0, .33, .5, .67, 1],
  returnKnots: [0, .22, .5, .78, 1],
  centerWidth: 70,
  endWidth: 8,
  returnWidth: 8,
  crossingClearance: 9,
});
const PI = Math.PI;
const TAU = 2 * PI;
const MAIN_SEGMENTS = 512;
const RETURN_SEGMENTS = 192;
const RADIAL_SEGMENTS = 96;
const ARC_SAMPLES = 8192;
const clamp01 = value => Math.max(0, Math.min(1, value));
const smootherstep = value => {
  const t = clamp01(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// The same clamped cubic spline construction as the selected 2D master.
function spline(values, knots, startSlope, endSlope) {
  const count = values.length;
  const a = [], b = [], c = [], rhs = [];
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      const h = knots[1] - knots[0];
      a.push(0); b.push(2 * h); c.push(h);
      rhs.push(6 * ((values[1] - values[0]) / h - startSlope));
    } else if (i === count - 1) {
      const h = knots[i] - knots[i - 1];
      a.push(h); b.push(2 * h); c.push(0);
      rhs.push(6 * (endSlope - (values[i] - values[i - 1]) / h));
    } else {
      const hp = knots[i] - knots[i - 1], hn = knots[i + 1] - knots[i];
      a.push(hp); b.push(2 * (hp + hn)); c.push(hn);
      rhs.push(6 * ((values[i + 1] - values[i]) / hn - (values[i] - values[i - 1]) / hp));
    }
  }
  for (let i = 1; i < count; i++) {
    const ratio = a[i] / b[i - 1];
    b[i] -= ratio * c[i - 1]; rhs[i] -= ratio * rhs[i - 1];
  }
  const second = Array(count).fill(0);
  second[count - 1] = rhs[count - 1] / b[count - 1];
  for (let i = count - 2; i >= 0; i--) second[i] = (rhs[i] - c[i] * second[i + 1]) / b[i];
  return (value, derivative = false) => {
    const t = clamp01(value);
    let i = 0;
    while (i < count - 2 && t > knots[i + 1]) i++;
    const h = knots[i + 1] - knots[i], u = t - knots[i], v = knots[i + 1] - t;
    if (derivative) return (second[i + 1] * u * u - second[i] * v * v) / (2 * h)
      + (values[i + 1] - values[i]) / h - (second[i + 1] - second[i]) * h / 6;
    return second[i] * v * v * v / (6 * h) + second[i + 1] * u * u * u / (6 * h)
      + (values[i] - second[i] * h * h / 6) * v / h
      + (values[i + 1] - second[i + 1] * h * h / 6) * u / h;
  };
}

const mx = spline(SOURCE.mainPoints.map(p => p[0]), SOURCE.mainKnots, -1000, -1000);
const my = spline(SOURCE.mainPoints.map(p => p[1]), SOURCE.mainKnots, 0, 0);
const rx = spline(SOURCE.returnPoints.map(p => p[0]), SOURCE.returnKnots, 700, 700);
const ry = spline(SOURCE.returnPoints.map(p => p[1]), SOURCE.returnKnots, 0, 0);
const reflectSource = point => [1300 - point[0], 1200 - point[1]];
const mainSource = t => t > .5 ? reflectSource(mainSource(1 - t)) : [mx(t), my(t)];
const mainTangentSource = t => t > .5 ? mainTangentSource(1 - t) : [mx(t, true), my(t, true)];
const returnSource = t => t > .5 ? reflectSource(returnSource(1 - t)) : [rx(t), ry(t)];
const sourceNormal = t => {
  const [x, y] = mainTangentSource(t), length = Math.hypot(x, y);
  return [-y / length, x / length];
};
const toWorld = point => [(point[0] - 650) / 350, (600 - point[1]) / 350, 0];
const worldNormal = tangent => {
  const x = tangent[0], y = -tangent[1], length = Math.hypot(x, y);
  return [-y / length, x / length];
};

const lengths = [0];
let previous = mainSource(0);
for (let i = 1; i <= ARC_SAMPLES; i++) {
  const current = mainSource(i / ARC_SAMPLES);
  lengths.push(lengths[i - 1] + Math.hypot(current[0] - previous[0], current[1] - previous[1]));
  previous = current;
}
const totalLength = lengths[ARC_SAMPLES];
function arcFraction(t) {
  const value = clamp01(t) * ARC_SAMPLES, index = Math.min(ARC_SAMPLES - 1, Math.floor(value));
  return (lengths[index] + (lengths[index + 1] - lengths[index]) * (value - index)) / totalLength;
}
const peakArc = arcFraction(.5);
function profileAt(t) {
  const u = arcFraction(Math.min(t, 1 - t)) / peakArc;
  const sine = Math.sin(PI * u / 2);
  return { width: 8 + 62 * (.5 * sine ** 6 + .5 * sine ** 2) };
}

function mainRoll(t) {
  if (t === .5) return 0;
  const cosine = Math.max(0, Math.min(1, (profileAt(t).width - 8) / 62));
  return Math.sign(.5 - t) * Math.acos(cosine);
}

// Arclength parameterization of a 70 x 8 stadium. The long, flat faces are
// connected by true radius-4 semicircles, with continuous perimeter tangents.
// This cross-section stays constant throughout the ribbon, including returns.
function capsuleAt(theta) {
  const radius = 4, halfSegment = 31, faceLength = 62;
  const quarterArc = PI * radius / 2, halfArc = PI * radius;
  const perimeter = 2 * faceLength + 2 * PI * radius;
  let s = ((theta / TAU) % 1 + 1) % 1 * perimeter;
  if (s <= quarterArc) {
    const angle = s / radius;
    return [halfSegment + radius * Math.cos(angle), radius * Math.sin(angle)];
  }
  s -= quarterArc;
  if (s <= faceLength) return [halfSegment - s, radius];
  s -= faceLength;
  if (s <= halfArc) {
    const angle = PI / 2 + s / radius;
    return [-halfSegment + radius * Math.cos(angle), radius * Math.sin(angle)];
  }
  s -= halfArc;
  if (s <= faceLength) return [-halfSegment + s, -radius];
  s -= faceLength;
  const angle = 3 * PI / 2 + s / radius;
  return [halfSegment + radius * Math.cos(angle), radius * Math.sin(angle)];
}

const centralNormal = sourceNormal(.5);
const gapDistance = SOURCE.centerWidth / 2 + SOURCE.returnWidth / 2 + SOURCE.crossingClearance;
let cutLo = .35, cutHi = .5;
for (let i = 0; i < 60; i++) {
  const t = (cutLo + cutHi) / 2, q = returnSource(t);
  const distance = Math.abs((q[0] - 650) * centralNormal[0] + (q[1] - 600) * centralNormal[1]);
  if (distance > gapDistance) cutLo = t; else cutHi = t;
}
const returnCutoff = (cutLo + cutHi) / 2;

const subtract = (a, b) => a.map((value, i) => value - b[i]);
function normalize(vector) {
  const length = Math.hypot(...vector);
  return vector.map(value => value / length);
}
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function makeSurface(center, tangent, rollAt, zAt, depthScale) {
  return (t, theta) => {
    const c = center(t), n = worldNormal(tangent(t)), alpha = rollAt(t);
    const [wide, thin] = capsuleAt(theta), cosine = Math.cos(alpha), sine = Math.sin(alpha);
    const across = (wide * cosine - thin * sine) / 350;
    const depth = (wide * sine + thin * cosine) / 350;
    return [c[0] + n[0] * across, c[1] + n[1] * across,
      zAt(t) * depthScale / 350 + depth];
  };
}

// Analytic-surface normals avoid faceting and remain smooth across the central ring.
function surfaceNormal(surface, t, theta) {
  const epsilon = 1e-5, lo = Math.max(0, t - epsilon), hi = Math.min(1, t + epsilon);
  const along = subtract(surface(hi, theta), surface(lo, theta));
  const radial = subtract(surface(t, theta + epsilon), surface(t, theta - epsilon));
  return normalize(cross(radial, along));
}

// One periodic sweep: 512 main segments followed by 384 rear segments.
// There are no duplicated seam vertices or terminal caps. The closing index
// permutation accounts for the stadium cross-section's half-turn symmetry.
function closedSweep(THREE, mainSurface, rearSurface) {
  const mainSegments = MAIN_SEGMENTS, rearSegments = RETURN_SEGMENTS * 2;
  const ringCount = mainSegments + rearSegments, radial = RADIAL_SEGMENTS;
  const positions = [], normals = [], indices = [];
  const append = (position, normal) => { positions.push(...position); normals.push(...normal); };
  for (let i = 0; i <= mainSegments; i++) {
    for (let j = 0; j < radial; j++) {
      if (i > mainSegments / 2) {
        const match = (radial / 2 - j + radial) % radial;
        const offset = ((mainSegments - i) * radial + match) * 3;
        append([-positions[offset], -positions[offset + 1], positions[offset + 2]],
          [-normals[offset], -normals[offset + 1], normals[offset + 2]]);
      } else {
        const t = i / mainSegments, theta = j / radial * TAU;
        append(mainSurface(t, theta), surfaceNormal(mainSurface, t, theta));
      }
    }
  }
  // B (rear parameter zero) is already the last main ring. A (rear parameter
  // one) is already the first main ring; both are reused in the index buffer.
  for (let k = 1; k < rearSegments; k++) {
    for (let j = 0; j < radial; j++) {
      const theta = j / radial * TAU;
      if (k > rearSegments / 2) {
        const match = (radial - j) % radial;
        const offset = ((mainSegments + rearSegments - k) * radial + match) * 3;
        append([-positions[offset], -positions[offset + 1], positions[offset + 2]],
          [-normals[offset], -normals[offset + 1], normals[offset + 2]]);
      } else {
        const t = k / rearSegments;
        append(rearSurface(t, theta), surfaceNormal(rearSurface, t, theta));
      }
    }
  }
  for (let i = 0; i < ringCount; i++) {
    for (let j = 0; j < radial; j++) {
      const nextJ = (j + 1) % radial, a = i * radial + j, b = i * radial + nextJ;
      const closing = i === ringCount - 1;
      const c = closing ? (j + radial / 2) % radial : (i + 1) * radial + j;
      const d = closing ? (nextJ + radial / 2) % radial : (i + 1) * radial + nextJ;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  return { geometry, positions, normals, triangles: indices.length / 3, ringCount, mainSegments, rearSegments };
}

/** A single welded, closed ribbon; depthScale changes centerline Z excursion. */
export function createSerialLogo(THREE, { depthScale = 1 } = {}) {
  if (!Number.isFinite(depthScale) || depthScale <= 0) throw new RangeError('depthScale must be positive and finite.');
  const mainZ = t => 90 * Math.sin(PI * t) ** 2;
  const mainSurface = makeSurface(t => toWorld(mainSource(t)), mainTangentSource, mainRoll, mainZ, depthScale);
  const rearCenter = t => toWorld(returnSource(1 - t));
  const rearTangent = t => [-rx(1 - t, true), -ry(1 - t, true)];
  const rearZ = t => -70 * Math.sin(PI * t) ** 2;
  // The return is traversed B -> A. Its wide axis remains edge-on throughout.
  const rearUnphased = makeSurface(rearCenter, rearTangent, () => PI / 2, rearZ, depthScale);
  const rearSurface = (t, theta) => rearUnphased(t, theta + PI);
  const built = closedSweep(THREE, mainSurface, rearSurface);
  const material = new THREE.MeshStandardMaterial({ color: 0x101010, roughness: .38, metalness: .12 });
  const mesh = new THREE.Mesh(built.geometry, material);
  mesh.name = 'SERIAL single welded continuous ribbon';
  mesh.castShadow = true; mesh.receiveShadow = true;
  const group = new THREE.Group();
  group.name = 'SERIAL continuous closed twisted ribbon';
  group.add(mesh);
  let minZ = Infinity, maxZ = -Infinity;
  for (let i = 2; i < built.positions.length; i += 3) {
    minZ = Math.min(minZ, built.positions[i] * 350);
    maxZ = Math.max(maxZ, built.positions[i] * 350);
  }
  let symmetryResidual = 0;
  const radial = RADIAL_SEGMENTS;
  for (let i = 0; i < built.ringCount; i++) for (let j = 0; j < radial; j++) {
    let partnerRing, partnerJ;
    if (i <= built.mainSegments) {
      partnerRing = built.mainSegments - i;
      partnerJ = (radial / 2 - j + radial) % radial;
    } else {
      const k = i - built.mainSegments;
      partnerRing = built.mainSegments + built.rearSegments - k;
      partnerJ = (radial - j) % radial;
    }
    const a = (i * radial + j) * 3, b = (partnerRing * radial + partnerJ) * 3;
    symmetryResidual = Math.max(symmetryResidual, Math.hypot(
      built.positions[a] + built.positions[b], built.positions[a + 1] + built.positions[b + 1],
      built.positions[a + 2] - built.positions[b + 2]));
  }
  const frontBackSeparation = 160 * depthScale - 39;
  const metrics = {
    source: 'serial-logo-symmetric.mjs / geometry-ribbon.js', normalization: 350, sourceOrigin: [650, 600],
    construction: 'One indexed welded periodic ribbon mesh; main A to B and complete rear return B to A. No caps, hidden faces, masks, duplicated seam rings, or unused vertices.',
    principalWidthSourceUnits: 70, thicknessSourceUnits: 8,
    crossSection: 'Constant 70 x 8 stadium, straight face 62 plus radius-4 rounded edges.',
    widthSourceUnits: { min: 8, max: 70, central: 70, return: 8 },
    projectedMainWidthSourceUnits: { min: 8, max: 70 },
    mainRollDegrees: { start: 90, center: 0, end: -90 },
    returnRollDegrees: 90,
    depthScale,
    depthScaleMeaning: 'Changes centerline Z excursion; actual 70 x 8 cross-section stays constant.',
    centerlineZSourceUnits: { outerJoins: 0, mainCenter: 90 * depthScale, rearCenter: -70 * depthScale },
    centralPosition: [0, 0, 90 * depthScale / 350],
    geometryZRangeSourceUnits: { min: minZ, max: maxZ, span: maxZ - minZ },
    minimumCentralFrontBackSeparationSourceUnits: frontBackSeparation,
    minimumCentralFrontBackSeparationWorldUnits: frontBackSeparation / 350,
    centralFrontBackCollisionFree: frontBackSeparation > 0,
    symmetry: 'Exact 180-degree rotation around Z, including the nonplanar depth geometry.',
    symmetryResidual,
    vertices: built.geometry.getAttribute('position').count,
    triangles: built.triangles,
    segments: { main: built.mainSegments, rear: built.rearSegments, radial },
    boundaryEdgesExpected: 0,
    topology: 'Closed genus-one surface (solid ribbon boundary); a 180-degree perimeter permutation closes the capsule section.',
    silhouetteNote: 'The full rear curve passes naturally behind the main S; previous center gaps are no longer cut out.',
  };
  group.userData.serialMetrics = metrics;
  return { group, metrics, dispose() { built.geometry.dispose(); material.dispose(); } };
}
