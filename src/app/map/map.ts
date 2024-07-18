import {
    Scene, PerspectiveCamera, WebGLRenderer, TextureLoader, MeshBasicMaterial, PlaneGeometry, Color,
    Mesh, AnimationMixer, Clock, Raycaster, Vector2, AmbientLight, DirectionalLight, NumberKeyframeTrack,
    AnimationClip, LoopRepeat, Material, Object3D, CircleGeometry, Group, DoubleSide, ShapeGeometry
} from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { MapModel, MapPin, MapResult, PinColor } from './map-model';

interface AddPinResult {
    pin: Object3D;
    background: Object3D;
}

async function mapImage(map: MapModel): Promise<Mesh> {
    const texture = await loadTexture(map.image);
    map.width = texture.image.width;
    map.height = texture.image.height;
    const material = new MeshBasicMaterial({ color: 0xffffff, map: texture });
    const geometry = new PlaneGeometry(texture.image.width, texture.image.height);
    const mesh = new Mesh(geometry, material);
    mesh.rotation.x = - Math.PI / 2;
    mesh.uuid = 'map';
    return mesh;
}

export async function init3D(container: HTMLElement, map: MapModel): Promise<MapResult> {
    const result: MapResult = {
        rotateCompass: (rotation: number) => { },
        myPosition: (x: number, y: number) => { },
        setNearest: (pin: string) => { }
    };
    const scene = new Scene();
    scene.background = new Color(0x999999);
    scene.add(await mapImage(map));

    const w = container.clientWidth;
    const h = container.clientHeight;

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);

    container.appendChild(renderer.domElement);

    const renderFn = () => {
        const delta = clock.getDelta();
        for (const mixer of mixers) {
            mixer.update(delta);
        }

        renderer.render(scene, camera);
    };

    renderer.setAnimationLoop(renderFn);

    const camera = new PerspectiveCamera(70, w / h, 1, 10000);
    camera.position.set(0, map.height, 40);

    // controls
    const controls = new MapControls(camera, renderer.domElement);

    //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
    controls.enableDamping = false; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;

    controls.screenSpacePanning = false;
    controls.zoomToCursor = true;
    controls.enableRotate = false;

    controls.minDistance = 100;
    controls.maxDistance = map.height;

    controls.maxPolarAngle = Math.PI / 2;

    const mixers: AnimationMixer[] = [];
    const clock = new Clock();

    const font = await loadFont('assets/helvetiker_regular.typeface.json');

    const raycaster = new Raycaster()
    const mouse = new Vector2()


    for (const pin of map.pins) {
        scaleToMap(pin, map.width, map.height);
        const material = getMaterial(pin.color);
        await addPin(pin, material, font, 0, map.width, mixers, scene);
    }

    if (map.compass) {
        scaleToMap(map.compass, map.width, map.height);
        const { pin: compass, background: background } = await addPin(map.compass, getMaterial('compass'), font, 0, map.width, mixers, scene);

        result.rotateCompass = (rotation: number) => {
            // Rotation is 0 - 360. Convert to 2π
            compass.rotation.z = Math.PI * 2 * (rotation / 360);
            renderFn();
        }
        result.myPosition = (x: number, y: number) => {
            const nx = Math.trunc(x * map.width / 10000);
            const nz = Math.trunc(y * map.height / 10000);
            background.position.x = nx;
            background.position.z = nz;
            compass.position.x = nx;
            compass.position.z = nz;
            renderFn();
        }
    }

    // lights
    const dirLight1 = new DirectionalLight(0xffffff, 3);
    dirLight1.position.set(1, 1, 1);
    scene.add(dirLight1);

    const dirLight2 = new DirectionalLight(0x002288, 3);
    dirLight2.position.set(- 1, - 1, - 1);
    scene.add(dirLight2);

    const ambientLight = new AmbientLight(0x555555);
    scene.add(ambientLight);

    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    container.addEventListener('click', (e: any) => {
        const width = container.clientWidth
        const height = container.clientHeight;
        const box = container.getBoundingClientRect();
        mouse.set(((e.clientX - box.left) / width) * 2 - 1, -((e.clientY - box.top) / height) * 2 + 1)
        raycaster.setFromCamera(mouse, camera)
        const intersects = raycaster.intersectObjects(scene.children, true);
        intersects.forEach((hit) => {
            if (hit.object.uuid !== 'map') {
                map.pinClicked(hit.object.uuid, e);
            }
        });
    });
    return result;
}

// Pins are sized to a 10,000 x 10,000 grid. Scale this to the map size.
function scaleToMap(pin: MapPin, width: number, height: number) {
    pin.x = Math.trunc(pin.x * width / 10000);
    pin.z = Math.trunc(pin.z * height / 10000);
    pin.size = Math.trunc(pin.size * width / 10000);

    // The map is centered at 0,0, so move pins
    pin.x -= width / 2;
    pin.z -= height / 2;
}

function getMaterial(pinColor: PinColor): MeshBasicMaterial {
    switch (pinColor) {
        case 'primary':
            return new MeshBasicMaterial({ color: 0xF61067, transparent: true });
        case 'secondary':
            return new MeshBasicMaterial({ color: 0x2196F3, transparent: true });
        case 'tertiary':
            return new MeshBasicMaterial({ color: 0x2dd36f, transparent: true });
        case 'warning':
            return new MeshBasicMaterial({ color: 0xffc409, transparent: true });
        case 'compass':
            return new MeshBasicMaterial({ color: 0x5260ff });
        default:
            return new MeshBasicMaterial({ color: 0x000000 });
    }
}

function animateMesh(mesh: Mesh, mixers: AnimationMixer[]) {
    const duration = 2;
    const track = new NumberKeyframeTrack('.material.opacity', [0, 1, 2], [1, 0, 1]);
    const clip = new AnimationClip('scaleAnimation', duration, [track]);
    const mixer = new AnimationMixer(mesh);
    const action = mixer.clipAction(clip);
    action.setLoop(LoopRepeat, 9999);
    action.play();
    mixers.push(mixer);
}

async function addPin(pin: MapPin, material: Material, font: any, rotation: number, mapWidth: number, mixers: AnimationMixer[], scene: Scene): Promise<AddPinResult> {
    const geometry = new CircleGeometry(pin.size, 24);
    //geometry.translate(0, 0.5, 0);
    const mesh = new Mesh(geometry, material);
    mesh.position.x = pin.x;
    mesh.position.y = 3;
    mesh.position.z = pin.z;
    mesh.rotation.x = - Math.PI / 2;
    mesh.uuid = pin.uuid;
    if (pin.animated) {
        animateMesh(mesh, mixers);
    }
    scene.add(mesh);
    if (pin.label === '') {
        const scale = 0.2 * (mapWidth / 10000);
        const p = await addSVG('assets/compass.svg', scale, rotation);
        p.position.x = mesh.position.x;
        p.position.z = mesh.position.z;
        scene.add(p);
        return { pin: p, background: mesh };
    } else {
        const txt = addText(pin.label, font, pin.size);
        txt.position.x = mesh.position.x;
        txt.position.z = mesh.position.z;
        scene.add(txt);
        return { pin: txt, background: mesh };
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


async function loadSVG(name: string): Promise<any> {
    return new Promise((resolve) => {
        const loader = new SVGLoader();
        loader.load(name, function (svg) {
            resolve(svg);
        });
    });
}

async function loadTexture(name: string): Promise<any> {
    return new Promise((resolve) => {
        const loader = new TextureLoader();
        loader.load(name, function (svg) {
            resolve(svg);
        });
    });
}

async function addSVG(name: string, scale: number, rotation: number): Promise<Group> {
    const svg = await loadSVG(name);
    const group = new Group();

    for (const path of svg.paths) {
        const material = new MeshBasicMaterial({
            color: path.color,
            side: DoubleSide,
            depthWrite: false
        });

        const shapes = SVGLoader.createShapes(path);
        const geometry = new ShapeGeometry(shapes);
        geometry.scale(scale, scale, scale);
        const d = 512 * scale * 0.5; // SVG size is 512 x 512
        geometry.translate(-d, -d, 0);
        const mesh = new Mesh(geometry, material);
        group.add(mesh);
    }
    group.position.y = 5;
    group.rotation.x = - Math.PI / 2;
    group.rotation.z = rotation;
    return group;
}

function addText(message: string, font: any, size: number): Mesh {
    const shapes = font.generateShapes(message, size * 0.7);
    const geometry = new ShapeGeometry(shapes);
    geometry.computeBoundingBox();
    const xMid = - 0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x);
    const yMid = - 0.5 * (geometry.boundingBox!.max.y - geometry.boundingBox!.min.y);
    geometry.translate(xMid, yMid, 0);
    const matLite = new MeshBasicMaterial({
        color: 0xFFFFFF,
        side: DoubleSide
    });

    const text = new Mesh(geometry, matLite);
    text.position.y = 5;
    text.rotation.x = - Math.PI / 2;
    return text;
}
