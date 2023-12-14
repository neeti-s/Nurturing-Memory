/* TO DO:
1. Add environment
2. Make the trees grow slower
*/
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

//canvas
const canvas = document.querySelector('canvas.webgl');

//rule
var axioms = ["X", "XF", "FX"];
var axiom = axioms[Math.floor(Math.random() * axioms.length)];
var sentence = axiom;
// var rules = [];

var rules = {
    X: [
        { rule: "F[+X][-X]FX", prob: 0.05 },
        { rule: "F[-X]FX", prob: 0.1 },
        { rule: "F[+X]FX", prob: 0.1 },
        { rule: "F[++X][-X]FX", prob: 0.1 },
        { rule: "F[+X][-X]FX", prob: 0.1 },
        { rule: "XX-[-X+X+X]+[+X-X-X]", prob: 0.1 },
        { rule: "F-[[X]+X]+F[+FX]-X", prob: 0.1 },
        { rule: "X[+X]X[-X]X", prob: 0.1 },
        { rule: "X[+X]X", prob: 0.1 },
        { rule: "X[-X]X", prob: 0.05 },
        { rule: "X[+X]X[-X][X]", prob: 0.05 },
        { rule: "F[+X]F[-X]+X", prob: 0.05 },
    ],
    F: [
        { rule: "FF", prob: 0.85 },
        { rule: "FFF", prob: 0.05 },
        { rule: "F", prob: 0.1 },
    ]
};

let stateStack = [];
let mesh = null;
let originalMesh = null;
const scene = new THREE.Scene();
let line;


// plane at y=0 to use as intersection
const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
const planeMaterial = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = Math.PI / 2;
plane.position.y = 0;
scene.add(plane);

//camera
const sizes = {
    width: 800,
    height: 600
}
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
camera.position.set(0,0,50);
scene.add(camera);

//raycaster
const raycaster = new THREE.Raycaster();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

//axes Helper
const axesHelper = new THREE.AxesHelper(2)
scene.add(axesHelper)

//renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height);
renderer.render(scene, camera);

// controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;

// animate
const maxIterations = 7;
let currentIteration = 0;

function generate() {
    let nextSentence = "";
    for (let i = 0; i < sentence.length; i++) {
        var current = sentence.charAt(i);
        var ruleSet = rules[current];

        if (ruleSet) {
            nextSentence += chooseOne(ruleSet);
        } else {
            nextSentence += current;
        }
    }
    sentence = nextSentence;
}

//random tree generation
function chooseOne(ruleSet) {
    let n = Math.random();
    let t = 0; 
    for (let i = 0; i< ruleSet.length; i++) {
        t += ruleSet[i].prob;
        if(t>n) {
            return ruleSet[i].rule;
        }
    }
    return "";
}


function initializeTree() {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.MeshBasicMaterial({color: 0x5F8575});

    //object
    const points = [];
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(0, 1, 0));
    geometry.setFromPoints(points);
    // line = new THREE.Line(geometry, material);
    // scene.add(line);

    originalMesh = new THREE.Line(geometry, material);
    scene.add(originalMesh);
    mesh = originalMesh.clone();
    scene.add(mesh);
}

function turtle() {
    for (let i = 0; i<sentence.length; i++) {
        let current = sentence.charAt(i);
        if (mesh != null) {
        if (current == "F") {
            const distance = 1;
            const newMesh = new THREE.Line(mesh.geometry.clone(), mesh.material.clone());
            newMesh.position.copy(mesh.position);
            newMesh.rotation.copy(mesh.rotation);
            newMesh.translateY(distance);
            scene.add(newMesh);
            mesh = newMesh;
        } else if (current == "+") {
            const angle = Math.PI / 12;
            mesh.rotateX(angle);
            mesh.rotateY(angle);
            mesh.rotateZ(angle);
        } else if (current == "-") {
            const angle = -Math.PI / 12;
            mesh.rotateX(angle);
            mesh.rotateY(-angle);
            mesh.rotateZ(angle);
        } else if (current == "[") {
            pushStateEvent();
        } else if (current == "]") {
            popStateEvent();
        }
    }
    }
}
function pushStateEvent() {
    stateStack.push({
        position: new THREE.Vector3().copy(mesh.position),
        rotation: new THREE.Euler().copy(mesh.rotation),
    });
}

function popStateEvent() {
    const state = stateStack.pop();
    mesh.position.copy(state.position);
    mesh.rotation.copy(state.rotation);
}

function generateNewTree(position) {
    sentence = axioms[Math.floor(Math.random() * axioms.length)];
    if (position) {
        mesh = originalMesh.clone();
        mesh.position.copy(position);
        console.log('New Mesh Position:', mesh.position); 
        mesh.rotation.set(0,0,0);
        scene.add(mesh);
        animateNewTree();
    } else {
        console.error('Intersection point is undefined or null.');
    }
}

const animate = () => {
    if (currentIteration<maxIterations) {
        generate();
        turtle();
        currentIteration++;
    }
    renderer.render(scene,camera);
    controls.update();
    requestAnimationFrame(animate);
}

initializeTree();
animate();

let intersects = [];

canvas.addEventListener('click', (event) => {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    console.log('Mouse Coordinates:', mouse.x, mouse.y);

    console.log('Raycaster Origin:', raycaster.ray.origin);
    console.log('Raycaster Direction:', raycaster.ray.direction);

    intersects = raycaster.intersectObject(plane);
    console.log('Intersects:', intersects);

    if (intersects && intersects.length > 0) {
        const intersection = intersects[0].point;
        console.log('Intersection Point:', intersection);
        generateNewTree(intersection);
    }

    renderer.render(scene, camera);
});

const growthSpeed = 1;

function iterateTree(node, speed, delay) {
    if (node instanceof THREE.Line) {
        setTimeout(() => {
            node.position.y += speed;
            console.log(`Delay: ${delay}, Position Y: ${node.position.y}`);
            renderer.render(scene, camera);
        }, delay);
    }
    if (node.children && node.children.length > 0) {
        for (const child of node.children) {
            delay = iterateTree(child, speed, delay);
        }
    }
    return delay;
}

function animateNewTree() {
    const maxIterations = 7;
    let iteration = 0;

    function animate() {
        console.log('Animating new tree. Iteration:', iteration);

        if (iteration < maxIterations) {
            generate();
            turtle();
            let delay = 0;
            delay = iterateTree(mesh, growthSpeed, iteration * growthSpeed);
            iteration++;
            requestAnimationFrame(animate);
        }

        if (iteration < maxIterations) {
            requestAnimationFrame(animate);
        } else {
            renderer.render(scene, camera);
        }
    }
    animate();
}