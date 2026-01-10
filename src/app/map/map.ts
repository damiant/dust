import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  TextureLoader,
  MeshBasicMaterial,
  PlaneGeometry,
  Color,
  Mesh,
  AnimationMixer,
  Clock,
  Raycaster,
  Vector2,
  NumberKeyframeTrack,
  AnimationClip,
  LoopRepeat,
  Material,
  Group,
  DoubleSide,
  ShapeGeometry,
  BufferGeometry,
  CylinderGeometry,
  DirectionalLight,
  MeshPhongMaterial,
  Texture,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { SVGLoader, SVGResult } from 'three/examples/jsm/loaders/SVGLoader.js';
import { LivePoint, MapModel, MapPin, MapResult, PinColor } from './map-model';
import { delay } from '../utils/utils';

export interface AddPinResult {
  pin: Mesh | Group;
  compass?: Mesh | Group;
  background: Mesh;
}

async function mapImage(map: MapModel, disposables: any[]): Promise<Mesh | Group> {
  if (map.image.endsWith('.svg')) {
    map.image = map.image.replace('.svg', '.png');
  }
  const texture = await loadTexture(map.image);
  texture.colorSpace = SRGBColorSpace;
  const image = texture.image as any;
  map.width = image.width;
  map.height = image.height;

  const material = new MeshBasicMaterial({ map: texture });
  const geometry = new PlaneGeometry(image.width, image.height);
  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.uuid = 'map';
  disposables.push(mesh.geometry);
  disposables.push(texture);
  return mesh;
}

type MapDisposable = BufferGeometry | Material | Material[];

let depth = 0;
let mouseY = 0;
let mouseX = 0;
let mouseChange = 0;

export function canCreate(): boolean {
  return depth == 0;
}

export function resetMapState(): void {
  depth = 0;
}

function onMap(map: MapModel): boolean {
  if (map.compass) {
    if (map.compass.x < -map.width / 2) return false;
    if (map.compass.x > map.width / 2) return false;
    if (map.compass.z < -map.height / 2) return false;
    if (map.compass.z > map.height / 2) return false;
    return true;
  }
  return false;
}

function getCaptureBase64(el: HTMLElement) {
  const cav: HTMLCanvasElement | null = el.querySelector('canvas');
  if (cav) {
    const base64 = cav.toDataURL('img/png').replace(/^data:image\/[a-z]+;base64,/, '');
    return base64;
  } else {
    console.error('No canvas found');
  }
  return undefined;
}

export async function init3D(container: HTMLElement, map: MapModel): Promise<MapResult> {
  if (!canCreate()) {
    throw new Error('Cannot create multiple 3D map instances simultaneously');
  }

  depth++;
  const result: MapResult = {
    rotateCompass: () => {},
    myPosition: () => {},
    setNearest: () => {},
    scrolled: () => {},
    pinSelected: () => {},
    pinUnselected: () => {},
    liveUpdated: () => {},
    capture: async () => {
      return undefined;
    },
    pinData: {},
    dispose: () => {},
  };
  let disposables: MapDisposable[] = [];
  let lastClick = new Date();
  let targetZoomLevel = 4;
  let snap = false;
  let snapImage: string | undefined = undefined;
  const scene = new Scene();
  scene.background = new Color(map.backgroundColor);
  scene.add(await mapImage(map, disposables));

  const w = container.clientWidth;
  const h = container.clientHeight;

  // Create local renderer instance instead of global
  const renderer = new WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(w, h);

  // Add WebGL context loss/restore event handlers
  const canvas = renderer.domElement;
  const handleContextLost = (event: Event) => {
    event.preventDefault();
    console.warn('WebGL context lost. Stopping animation loop.');
    renderer.setAnimationLoop(null);
  };

  const handleContextRestored = () => {
    console.log('WebGL context restored. Resuming animation loop.');
    renderer.setAnimationLoop(renderFn);
  };

  canvas.addEventListener('webglcontextlost', handleContextLost, false);
  canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

  container.appendChild(renderer.domElement);

  const renderFn = () => {
    const delta = clock.getDelta();
    for (const mixer of mixers) {
      mixer.update(delta);
    }

    renderer.render(scene, camera);
    if (snap) {
      snapImage = getCaptureBase64(container);
      snap = false;
    }
  };

  // Create local camera instance instead of global
  const camera = new PerspectiveCamera(130, w / h, 1, 10000);
  camera.position.set(0, map.height / targetZoomLevel, 20);

  // Create local controls instance instead of global
  const controls = new MapControls(camera, renderer.domElement);
  //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
  controls.enableDamping = false; // an animation loop is required when either damping or auto-rotation are enabled
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.zoomToCursor = true;
  controls.enableRotate = false;
  controls.minDistance = 50;
  controls.maxDistance = map.height;
  controls.maxPolarAngle = Math.PI / 2;

  controls.target.set(0, 0, 0);

  const mixers: AnimationMixer[] = [];
  const clock = new Clock();
  const font = await loadFont('assets/helvetiker_regular.typeface.json');
  const raycaster = new Raycaster();
  const mouse = new Vector2();

  const p = await createScene(map, font, scene, mixers, disposables, renderFn, result);

  function centerOn(pin: Mesh | Group, zoom: number = 4) {
    const z = pin.position.z + map.height / zoom;
    camera.position.set(pin.position.x, map.height / zoom, z + 20);
    controls.target.set(pin.position.x, 0, z);
  }

  // Positions the camera over the pin
  if (map.pins.length == 1 && p) {
    centerOn(p.pin);
  } else if (map.compass && p?.compass && onMap(map)) {
    // Center on the compass element if you are on the map
    centerOn(p?.compass);
  }

  // lights
  const dirLight1 = new DirectionalLight(0xffffff, 3);
  dirLight1.position.set(10, 50, 1).normalize();
  scene.add(dirLight1);

  // const dirLight2 = new DirectionalLight(0x002288, 3);
  // dirLight2.position.set(-1, - 1, - 1);
  // scene.add(dirLight2);

  // const ambientLight = new AmbientLight(0x333333);
  // scene.add(ambientLight);

  const windowResize = () => {
    if (depth == 0) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w == 0 || h == 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', windowResize);

  const pointerMove = async (e: any) => {
    if (depth == 0) return;
    if (new Date().getTime() - mouseChange > 200) {
      const deltaY = e.clientY - mouseY;
      const deltaX = e.clientX - mouseX;

      if (mouseX !== 0) {
        if (deltaX > 100 || deltaY > 100) {
          result.scrolled({ deltaY, deltaX });
        }
      }
      mouseChange = new Date().getTime();
      mouseY = e.clientY;
      mouseX = e.clientX;
    }
  };
  container.addEventListener('pointermove', pointerMove);

  const pointerDown = async (e: any) => {
    mouseY = e.clientY;
    mouseX = e.clientX;
  };
  container.addEventListener('pointerdown', pointerDown);

  const pointerUp = async (e: any) => {
    const deltaY = e.clientY - mouseY;
    const deltaX = e.clientX - mouseX;
    if (deltaX > 100 || deltaY > 100) {
      result.scrolled({ deltaY, deltaX });
    }
  };
  container.addEventListener('pointerup', pointerUp);

  result.pinSelected = (id: string) => {
    for (let key of Object.keys(result.pinData)) {
      const mat: Material = result.pinData[key].background.material as Material;
      if (key !== id) {
        mat.opacity = 0.25;
      }
    }
    centerOn(result.pinData[id].pin, 16);
    animateMesh(result.pinData[id].background, mixers);
  };

  result.pinUnselected = () => {
    for (let key of Object.keys(result.pinData)) {
      const mat: Material = result.pinData[key].background.material as Material;
      mat.opacity = 1;
    }
  };

  result.capture = async () => {
    snap = true;
    renderFn();
    while (!snapImage) {
      await delay(100);
    }
    const img = snapImage;
    snapImage = undefined;
    return img;
  };

  const containerClick = (e: any) => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    const box = container.getBoundingClientRect();
    mouse.set(((e.clientX - box.left) / width) * 2 - 1, -((e.clientY - box.top) / height) * 2 + 1);
    raycaster.setFromCamera(mouse, camera);
    unhighlight(result);
    const intersects = raycaster.intersectObjects(scene.children, true);
    const hits: number[] = [];
    intersects.forEach((hit) => {
      if (hit.object.uuid !== 'map' && hit.object.uuid !== 'txt') {
        highlight(hit.object as any, result);
        hits.push(parseInt(hit.object.uuid));
      }
    });
    if (hits.length > 0) {
      map.pinClicked(hits, e);
    }
    if (new Date().getTime() - lastClick.getTime() < 500) {
      // Double click is a zoom in / out
      switch (targetZoomLevel) {
        case 4:
          targetZoomLevel = 8;
          break;
        case 8:
          targetZoomLevel = 16;
          break;
        case 16:
          targetZoomLevel = 4;
          break;
      }
      camera.position.y = map.height / targetZoomLevel;
      camera.updateProjectionMatrix();
      return;
    }
    // No hit
    lastClick = new Date();
  };
  container.addEventListener('click', containerClick);
  renderer.setAnimationLoop(renderFn);
  let disposed = false;
  result.dispose = () => {
    // Prevent double-disposal
    if (disposed) {
      console.warn('Map already disposed, skipping');
      return;
    }
    disposed = true;
    depth--;

    // Ensure depth never goes negative
    if (depth < 0) {
      console.warn('Map depth went negative, resetting to 0');
      depth = 0;
    }

    // Stop the animation loop first
    renderer.setAnimationLoop(null);

    // Stop and dispose of all animation mixers
    for (const mixer of mixers) {
      mixer.stopAllAction();
      mixer.uncacheRoot(mixer.getRoot());
    }
    mixers.length = 0;

    // Dispose of all tracked disposables
    for (let d of disposables) {
      if (Array.isArray(d)) {
        for (let d2 of d) {
          d2.dispose();
        }
      } else {
        d.dispose();
      }
    }
    disposables = [];

    // Clear the scene
    scene.clear();

    // Dispose of Three.js objects
    controls.dispose();
    dirLight1.dispose();

    // Remove event listeners
    window.removeEventListener('resize', windowResize);
    container.removeEventListener('pointermove', pointerMove);
    container.removeEventListener('pointerdown', pointerDown);
    container.removeEventListener('pointerup', pointerUp);
    container.removeEventListener('click', containerClick);
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    canvas.removeEventListener('webglcontextrestored', handleContextRestored);

    // Remove the canvas from DOM
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }

    // Dispose of the renderer
    renderer.dispose();

    console.log('after dispose', renderer.info);

    try {
      console.log((performance as any).memory.usedJSHeapSize);
    } catch {}
  };
  return result;
}

async function createScene(
  map: MapModel,
  font: any,
  scene: Scene,
  mixers: AnimationMixer[],
  disposables: MapDisposable[],
  renderFn: () => void,
  result: MapResult,
) {
  let p: AddPinResult | undefined = undefined;
  for (const pin of map.pins) {
    scaleToMap(pin, map.width, map.height, map.pinSizeMultiplier);
    const material = getMaterial(pin.color);
    p = await addPin(pin, material, font, 0, map.width, mixers, scene, disposables);
    result.pinData[pin.uuid] = p;
  }

  if (map.compass) {
    map.compass.animated = map.pins.length > 1;
    scaleToMap(map.compass, map.width, map.height, map.pinSizeMultiplier);
    const { pin: compass, background: background } = await addPin(
      map.compass,
      getMaterial('compass'),
      font,
      0,
      map.width,
      mixers,
      scene,
      disposables,
    );
    if (p) {
      p.compass = compass;
    }
    result.rotateCompass = (rotation: number) => {
      // Rotation is 0 - 360. Convert to 2π
      compass.rotation.z = Math.PI + Math.PI * 2 * ((360 - rotation) / 360);
      renderFn();
    };
    result.myPosition = (x: number, y: number) => {
      setMapXY(compass.position, x, y, map);
      setMapXY(background.position, x, y, map);
      renderFn();
    };
  }
  result.liveUpdated = (locations: LivePoint[]) => {
    // Update matching locations
    let changed = false;
    for (const location of locations) {
      const data = result.pinData[`${location.idx}`];
      if (setMapXY(data.pin.position, location.x, location.y, map)) {
        changed = true;
      }
      setMapXY(data.background.position, location.x, location.y, map);
      const m: MeshPhongMaterial = data.background.material as MeshPhongMaterial;
      m.color = new Color(0xcaca00);
    }
    if (changed) {
      renderFn();
    }
  };
  return p;
}
// Returns true if the position changed
function setMapXY(v: Vector3, x: number, y: number, map: MapModel): boolean {
  const px = v.x;
  const pz = v.z;
  v.x = Math.trunc((x * map.width) / 10000) - map.width / 2;
  v.z = Math.trunc((y * map.height) / 10000) - map.height / 2;
  return px !== v.x || pz !== v.z;
}

// Pins are sized to a 10,000 x 10,000 grid. Scale this to the map size.
function scaleToMap(pin: MapPin, width: number, height: number, pinSizeMultiplier = 1.0) {
  pin.x = Math.trunc((pin.x * width) / 10000);
  pin.z = Math.trunc((pin.z * height) / 10000);
  pin.size = Math.trunc((pin.size * width) / 10000) * pinSizeMultiplier;

  // The map is centered at 0,0, so move pins
  pin.x -= width / 2;
  pin.z -= height / 2;
}

function highlight(mesh: Mesh, result: MapResult) {
  result.currentHex = (mesh.material as MeshPhongMaterial).emissive.getHex();
  result.currentObject = mesh;
  (mesh.material as MeshPhongMaterial).emissive.setHex(0x999999);
}

function unhighlight(result: MapResult) {
  if (result.currentObject) {
    (result.currentObject.material as MeshPhongMaterial).emissive.setHex(result.currentHex);
    result.currentObject = undefined;
    result.currentHex = undefined;
  }
}

function getMaterial(pinColor: PinColor): MeshPhongMaterial {
  switch (pinColor) {
    case 'primary':
      return new MeshPhongMaterial({ color: 0xf61067, transparent: true });
    case 'secondary':
      return new MeshPhongMaterial({ color: 0x2196f3, transparent: true });
    case 'tertiary':
      return new MeshPhongMaterial({ color: 0x2dd36f, transparent: true });
    case 'accent':
      return new MeshPhongMaterial({ color: 0x9e9e9e, transparent: true });
    case 'warning':
      return new MeshPhongMaterial({ color: 0xffc409, transparent: true });
    case 'live':
      return new MeshPhongMaterial({ color: 0xcaca00, transparent: true });
    case 'compass':
      return new MeshPhongMaterial({ color: 0x8bc34a });
    case 'medical':
      return new MeshPhongMaterial({ color: 0x5260ff });
    default:
      return new MeshPhongMaterial({ color: 0x000000 });
  }
}

function animateMesh(mesh: Mesh | Group, mixers: AnimationMixer[], scaleFrom = 1, scaleTo = 2) {
  const duration = 2;

  //const track = new NumberKeyframeTrack('.material.opacity', [0, 1, 2], [1, 0, 1]);
  const trackX = new NumberKeyframeTrack('.scale[x]', [0, 1, 2], [scaleFrom, scaleTo, scaleFrom]);
  const trackZ = new NumberKeyframeTrack('.scale[z]', [0, 1, 2], [scaleFrom, scaleTo, scaleFrom]);
  const clip = new AnimationClip('anim', duration, [trackX, trackZ]);
  const mixer = new AnimationMixer(mesh);
  const action = mixer.clipAction(clip);
  action.setLoop(LoopRepeat, 9999);
  action.play();
  mixers.push(mixer);
}

async function addPin(
  pin: MapPin,
  material: Material,
  font: any,
  rotation: number,
  mapWidth: number,
  mixers: AnimationMixer[],
  scene: Scene,
  disposables: MapDisposable[],
): Promise<AddPinResult> {
  const geometry = new CylinderGeometry(pin.size, pin.size, 1, 24);
  const mesh = new Mesh(geometry, material);
  mesh.position.set(pin.x, 1, pin.z);
  mesh.uuid = pin.uuid;
  if (pin.animated) {
    animateMesh(mesh, mixers);
  }
  disposables.push(mesh.geometry);
  disposables.push(mesh.material);
  scene.add(mesh);
  let svg = undefined;
  switch (pin.label) {
    case '^':
      svg = 'assets/location.svg';
      rotation = Math.PI;
      break;
    case '-':
      svg = 'assets/camp.svg';
      rotation = Math.PI;
      break;
    case ':':
      svg = 'assets/bike.svg';
      rotation = Math.PI;
      break;
    case '+':
      svg = 'assets/medical.svg';
      break;
    case '@':
      svg = 'assets/bus.svg';
      rotation = Math.PI;
      break;
    case '':
      svg = 'assets/compass.svg';
      break;
  }

  if (svg) {
    let scale = 0.15 * (mapWidth / 10000);
    if (pin.size < 50) {
      scale = 0.1 * (mapWidth / 10000);
    }
    const p = await addSVG(svg, scale, rotation, disposables, 'txt');
    p.position.x = mesh.position.x;
    p.position.z = mesh.position.z;
    if (pin.animated) {
      animateMesh(p, mixers, 1, 2);
    }
    scene.add(p);
    return { pin: p, background: mesh };
  } else {
    if (pin.label && pin.label.length > 0) {
      const txt = addText(pin.label, font, pin.size, disposables);
      txt.position.x = mesh.position.x;
      txt.position.z = mesh.position.z;
      txt.uuid = 'txt';
      scene.add(txt);
      return { pin: txt, background: mesh };
    } else {
      return { pin: mesh, background: mesh };
    }
  }
}

function loadFont(name: string): Promise<any> {
  return new Promise((resolve) => {
    const loader = new FontLoader();
    loader.load(name, function (font) {
      resolve(font);
    });
  });
}

async function loadSVG(name: string): Promise<SVGResult> {
  return new Promise((resolve) => {
    const loader = new SVGLoader();
    loader.load(name, function (svg) {
      resolve(svg);
    });
  });
}

async function loadTexture(name: string): Promise<Texture> {
  return new Promise((resolve) => {
    const loader = new TextureLoader();
    loader.load(name, function (svg) {
      resolve(svg);
    });
  });
}

const svgCache: Map<string, SVGResult> = new Map();

async function addSVG(
  name: string,
  scale: number,
  rotation: number,
  disposables: MapDisposable[],
  uuid: string,
): Promise<Group> {
  let svg = svgCache.get(name);
  if (svg === undefined) {
    svg = await loadSVG(name);
    svgCache.set(name, svg);
  }
  const group = new Group();

  for (const path of svg.paths) {
    const material = new MeshBasicMaterial({
      color: path.color,
      // side: DoubleSide,
      // depthWrite: false
    });
    const shapes = SVGLoader.createShapes(path);
    const geometry = new ShapeGeometry(shapes);
    geometry.scale(scale, scale, scale);
    const d = 512 * scale * 0.5; // SVG size is 512 x 512
    geometry.translate(-d, -d, 0);
    const mesh = new Mesh(geometry, material);
    disposables.push(mesh.geometry);
    disposables.push(mesh.material);
    mesh.uuid = uuid;
    group.add(mesh);
  }
  group.position.y = 2;
  group.rotation.x = -Math.PI / 2;
  group.rotation.z = rotation;
  return group;
}

function addText(message: string, font: any, size: number, disposables: MapDisposable[]): Mesh {
  const shapes = font.generateShapes(message, size * 0.7);
  const geometry = new ShapeGeometry(shapes);
  geometry.computeBoundingBox();
  const xMid = -0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x);
  const yMid = -0.5 * (geometry.boundingBox!.max.y - geometry.boundingBox!.min.y);
  geometry.translate(xMid, yMid, 0);
  const material = new MeshBasicMaterial({
    color: 0xffffff,
    side: DoubleSide,
  });

  disposables.push(geometry);
  disposables.push(material);
  const text = new Mesh(geometry, material);
  text.position.y = 2;
  text.rotation.x = -Math.PI / 2;
  return text;
}
