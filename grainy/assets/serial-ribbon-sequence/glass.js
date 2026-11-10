// Neutral studio reflections keep clear glass readable against the white page.
export function studioRadiance(x, y, z) {
  const softbox = (cx, cy, cz, spread) => {
    const length = Math.hypot(cx, cy, cz);
    return Math.exp((x * cx / length + y * cy / length + z * cz / length - 1) / spread);
  };
  return .015 + .08 * Math.max(0, y)
    + 2 * softbox(-1, .8, 1, .025)
    + 1.5 * softbox(1, .1, -.6, .018)
    + .7 * softbox(.1, 1, .2, .12);
}

export function createGlassMaterial(THREE) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: .025,
    transmission: 1, thickness: .06, ior: 1.5,
    opacity: 1, transparent: true, premultipliedAlpha: true,
    envMapIntensity: 1,
  });
}

export function createGlassEnvironment(THREE, renderer) {
  const width = 256, height = 128, data = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const theta = Math.PI * (y + .5) / height, phi = 2 * Math.PI * (x + .5) / width;
    const value = studioRadiance(-Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi));
    const at = (y * width + x) * 4;
    data[at] = data[at + 1] = data[at + 2] = value; data[at + 3] = 1;
  }
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  const generator = new THREE.PMREMGenerator(renderer);
  try { return generator.fromEquirectangular(texture); }
  finally { texture.dispose(); generator.dispose(); }
}
