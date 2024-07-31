import {
    Scene, PerspectiveCamera, WebGLRenderer, TextureLoader, MeshBasicMaterial, PlaneGeometry, Color,
    Mesh, AnimationMixer, Clock, Raycaster, Vector2, NumberKeyframeTrack,
    AnimationClip, LoopRepeat, Material, Group, DoubleSide, ShapeGeometry,
    BufferGeometry,
    CylinderGeometry,
    DirectionalLight,
    MeshPhongMaterial
} from 'three';
import { MapControls } from 'three/examples/jsm/controls/MapControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { MapModel, MapPin, MapResult, PinColor, ScrollResult } from './map-model';


interface AddPinResult {
    pin: Mesh | Group;
    background: Mesh;
}

async function mapImage(map: MapModel, disposables: any[]): Promise<Mesh | Group> {
    if (map.image.endsWith('.svg')) {
        map.image = map.image.replace('.svg', '.png');
    }
    const texture = await loadTexture(map.image);
    map.width = texture.image.width;
    map.height = texture.image.height;

    const material = new MeshBasicMaterial({ color: 0xffffff, map: texture });
    const geometry = new PlaneGeometry(texture.image.width, texture.image.height);
    const mesh = new Mesh(geometry, material);
    mesh.rotation.x = - Math.PI / 2;
    mesh.uuid = 'map';
    disposables.push(mesh.geometry);
    disposables.push(texture);
    return mesh;
}

type MapDisposable = BufferGeometry | Material | Material[];

let renderer: WebGLRenderer;
let camera: PerspectiveCamera;
let controls: MapControls;
let depth = 0;
let mouseY = 0;
let mouseX = 0;
let mouseChange = 0;

export function canCreate(): boolean {
    console.log('canCreate', depth);
    return depth == 0;
}

export async function init3D(container: HTMLElement, map: MapModel): Promise<MapResult> {
    depth++;
    console.log('init3D', depth);
    const result: MapResult = {
        rotateCompass: (rotation: number) => { },
        myPosition: (x: number, y: number) => { },
        setNearest: (pin: string) => { },
        scrolled: (result: ScrollResult) => { },
        dispose: () => { }
    };
    let disposables: MapDisposable[] = [];

    const scene = new Scene();
    scene.background = new Color(0x999999);
    scene.add(await mapImage(map, disposables));


    const w = container.clientWidth;
    const h = container.clientHeight;

    if (!renderer) {
        renderer = new WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(w, h);
    }

    let dom = container.appendChild(renderer.domElement);

    const renderFn = () => {
        const delta = clock.getDelta();
        for (const mixer of mixers) {
            mixer.update(delta);
        }

        renderer.render(scene, camera);
    };

    if (!camera) {
        camera = new PerspectiveCamera(130, w / h, 1, 10000);
    }
    camera.position.set(0, map.height / 4, 20);

    // controls
    if (!controls) {
        controls = new MapControls(camera, renderer.domElement);

        //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
        controls.enableDamping = false; // an animation loop is required when either damping or auto-rotation are enabled
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.zoomToCursor = true;
        controls.enableRotate = false;
        controls.minDistance = 50;
        controls.maxDistance = map.height / 4;
        controls.maxPolarAngle = Math.PI / 2;
    }

    controls.target.set(0, 0, 0);

    const mixers: AnimationMixer[] = [];
    const clock = new Clock();
    const font = await loadFont('assets/helvetiker_regular.typeface.json');
    const raycaster = new Raycaster()
    const mouse = new Vector2()

    const p = await createScene(map, font, scene, mixers, disposables, renderFn, result);

    // Positions the camera over the pin
    if (map.pins.length == 1 && p) {
        console.log(JSON.stringify(camera));
        const z = p.pin.position.z + map.height / 4;
        camera.position.set(p.pin.position.x, map.height / 4, z + 20);
        controls.target.set(p.pin.position.x, 0, z);
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

    window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });

    container.addEventListener('pointermove', async (e: any) => {
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
    });

    container.addEventListener('pointerdown', async (e: any) => {
        mouseY = e.clientY;
        mouseX = e.clientX;
    });
    container.addEventListener('pointerup', async (e: any) => {
        const deltaY = e.clientY - mouseY;
        const deltaX = e.clientX - mouseX;
        if (deltaX > 100 || deltaY > 100) {
            result.scrolled({ deltaY, deltaX });
        }
    });

    container.addEventListener('click', (e: any) => {
        const width = container.clientWidth
        const height = container.clientHeight;
        const box = container.getBoundingClientRect();
        mouse.set(((e.clientX - box.left) / width) * 2 - 1, -((e.clientY - box.top) / height) * 2 + 1)
        raycaster.setFromCamera(mouse, camera)
        unhighlight(result);
        const intersects = raycaster.intersectObjects(scene.children, true);
        intersects.forEach((hit) => {
            if (hit.object.uuid !== 'map' && hit.object.uuid !== 'txt') {
                highlight(hit.object as any, result);
                map.pinClicked(hit.object.uuid, e);
                return;
            }
        });
    });
    renderer.setAnimationLoop(renderFn);
    result.dispose = () => {
        depth--;
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
        scene.clear();
        //controls.dispose();

        // ambientLight.dispose();
        // dirLight2.dispose();
        dirLight1.dispose();
        console.log('after dispose', renderer.info);
        //renderer.renderLists.dispose();
        //renderer.dispose();
        //dom.remove();

        try {
            console.log((performance as any).memory.usedJSHeapSize);
        } catch (e) { }
    }
    return result;
}

async function createScene(map: MapModel, font: any, scene: Scene, mixers: AnimationMixer[], disposables: MapDisposable[], renderFn: () => void, result: MapResult) {
    let p = undefined;
    for (const pin of map.pins) {
        scaleToMap(pin, map.width, map.height);
        const material = getMaterial(pin.color);
        p = await addPin(pin, material, font, 0, map.width, mixers, scene, disposables);
    }

    if (map.compass) {
        scaleToMap(map.compass, map.width, map.height);
        const { pin: compass, background: background } = await addPin(map.compass, getMaterial('compass'), font, 0, map.width, mixers, scene, disposables);
        result.rotateCompass = (rotation: number) => {
            // Rotation is 0 - 360. Convert to 2π
            compass.rotation.z = (Math.PI + (Math.PI * 2 * ((360 - rotation) / 360)));
            renderFn();
        }
        result.myPosition = (x: number, y: number) => {
            const nx = Math.trunc(x * map.width / 10000) - map.width / 2;
            const nz = Math.trunc(y * map.height / 10000) - map.height / 2;
            background.position.x = nx;
            background.position.z = nz;
            compass.position.x = nx;
            compass.position.z = nz;
            renderFn();
        }
    }
    return p;
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

function highlight(mesh: Mesh, result: MapResult) {
    result.currentHex = (mesh.material as MeshPhongMaterial).emissive.getHex();
    result.currentObject = mesh;
    (mesh.material as MeshPhongMaterial).emissive.setHex(0x999999)
}

function unhighlight(result: MapResult) {
    if (result.currentObject) {
        (result.currentObject.material as MeshPhongMaterial).emissive.setHex(result.currentHex);
        console.log('unhighlight', result.currentHex);
        result.currentObject = undefined;
        result.currentHex = undefined;
    }
}

function getMaterial(pinColor: PinColor): MeshPhongMaterial {
    switch (pinColor) {
        case 'primary':
            return new MeshPhongMaterial({ color: 0xF61067, transparent: true });
        case 'secondary':
            return new MeshPhongMaterial({ color: 0x2196F3, transparent: true });
        case 'tertiary':
            return new MeshPhongMaterial({ color: 0x2dd36f, transparent: true });
        case 'warning':
            return new MeshPhongMaterial({ color: 0xffc409, transparent: true });
        case 'compass':
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
    pin: MapPin, material: Material, font: any,
    rotation: number, mapWidth: number,
    mixers: AnimationMixer[],
    scene: Scene, disposables: MapDisposable[]): Promise<AddPinResult> {
    //const geometry = new CircleGeometry(pin.size, 24);
    const geometry = new CylinderGeometry(pin.size, pin.size, 3, 24);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(pin.x, 3, pin.z);
    mesh.uuid = pin.uuid;
    if (pin.animated) {
        animateMesh(mesh, mixers);
    }
    disposables.push(mesh.geometry);
    disposables.push(mesh.material);
    scene.add(mesh);
    let svg = undefined;
    switch (pin.label) {
        case '^': svg = 'assets/location.svg'; rotation = Math.PI; break;
        case '-': svg = 'assets/camp.svg'; rotation = Math.PI; break;
        case ':': svg = 'assets/bike.svg'; rotation = Math.PI; break;
        case '+': svg = 'assets/medical.svg'; break;
        case '': svg = 'assets/compass.svg'; break;
    }

    console.log(pin, svg);
    if (svg) {
        const scale = 0.2 * (mapWidth / 10000);
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

async function addSVG(name: string, scale: number, rotation: number, disposables: MapDisposable[], uuid: string): Promise<Group> {
    const svg = await loadSVG(name);
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
    group.position.y = 5;
    group.rotation.x = - Math.PI / 2;
    group.rotation.z = rotation;
    return group;
}

function addText(message: string, font: any, size: number, disposables: MapDisposable[]): Mesh {
    const shapes = font.generateShapes(message, size * 0.7);
    const geometry = new ShapeGeometry(shapes);
    geometry.computeBoundingBox();
    const xMid = - 0.5 * (geometry.boundingBox!.max.x - geometry.boundingBox!.min.x);
    const yMid = - 0.5 * (geometry.boundingBox!.max.y - geometry.boundingBox!.min.y);
    geometry.translate(xMid, yMid, 0);
    const material = new MeshBasicMaterial({
        color: 0xFFFFFF,
        side: DoubleSide
    });

    disposables.push(geometry);
    disposables.push(material);
    const text = new Mesh(geometry, material);
    text.position.y = 5;
    text.rotation.x = - Math.PI / 2;
    return text;
}
