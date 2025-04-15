import * as THREE from 'https://unpkg.com/three/build/three.module.js';

export function createScene() {
    const gameWindow = document.getElementById('render-target');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x7ec0ff); // Light blue background
    scene.fog = new THREE.Fog(0x7ec0ff, 10, 50); // Add fog effect
    

    const camera = new THREE.PerspectiveCamera(
        75,
        gameWindow.clientWidth / gameWindow.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 9; // Set camera position

    let verticalSpeed = 0; // Velocidade vertical do míssil
    const gravity = -0.002; // Gravidade aplicada ao míssil
    const forwardSpeed = 0.05; // Velocidade para frente
    
    const renderer = new THREE.WebGLRenderer();

    renderer.setSize(gameWindow.offsetWidth, gameWindow.offsetHeight);
    gameWindow.appendChild(renderer.domElement);

    // Add a rotating cube
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    //scene.add(cube);a

    // Add floating clouds
    const cloudGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const clouds = [];
// Enable shadows in the renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Use soft shadows for a smoother look

// Create a gradient background using a shader
const gradientGeometry = new THREE.PlaneGeometry(100, 30); // Large plane for the background
const gradientMaterial = new THREE.ShaderMaterial({
    uniforms: {
        color1: { value: new THREE.Color(0x7ec0ff) }, // Light blue
        color2: { value: new THREE.Color(0xffffff) }, // White
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        void main() {
            gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0); // Interpolate colors based on vUv.y
        }
    `,
    side: THREE.DoubleSide,
});
const gradientBackground = new THREE.Mesh(gradientGeometry, gradientMaterial);
gradientBackground.position.z = -10; // Place it behind the scene
scene.add(gradientBackground);

// Add a directional light to cast shadows
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 20, 10); // Position the light
light.castShadow = true; // Enable shadow casting
light.shadow.mapSize.width = 2048; // Shadow map resolution
light.shadow.mapSize.height = 2048;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 50;
scene.add(light);

// Add ambient light to brighten the scene and soften shadows
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Add ambient light with lower intensity
scene.add(ambientLight);

// Increase the shadow camera's frustum size
light.shadow.camera.left = -50; // Extend the left boundary
light.shadow.camera.right = 50; // Extend the right boundary
light.shadow.camera.top = 50; // Extend the top boundary
light.shadow.camera.bottom = -50; // Extend the bottom boundary

// Add a ground plane to receive shadows
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x7ec0ff });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
ground.position.y = -9; // Position below the clouds
ground.receiveShadow = true; // Enable shadow receiving
//scene.add(ground);

// Add a water-like floor
const waterGeometry = new THREE.PlaneGeometry(150, 150); // Large plane for the water
const waterMaterial = new THREE.MeshPhongMaterial({
    color: 0x1E90FF, // Dodger Blue for the water
    shininess: 100, // High shininess for a reflective surface
    transparent: true, // Enable transparency
    opacity: 0.7, // Slight transparency for a water effect
});

// Add a normal map for water ripples
const waterTextureLoader = new THREE.TextureLoader();
const waterNormalMap = waterTextureLoader.load('https://threejs.org/examples/textures/waternormals.jpg');
waterNormalMap.wrapS = waterNormalMap.wrapT = THREE.RepeatWrapping; // Repeat the texture
waterMaterial.normalMap = waterNormalMap; // Apply the normal map
waterMaterial.normalScale.set(1.5, 1.5); // Adjust the intensity of the ripples

const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2; // Rotate to make it horizontal
water.position.y = -6; // Position below the airplane
water.position.z = -25; // Position behind the clouds
water.receiveShadow = true; // Enable shadow receiving
scene.add(water);

// Animate the water ripples
function animateWater() {
    waterNormalMap.offset.x += 0.0001; // Move the texture horizontally
    waterNormalMap.offset.y += 0.0001; // Move the texture vertically
}

// Function to deform sphere geometry for a more organic look
function deformGeometry(geometry) {
    const positionAttribute = geometry.attributes.position;
    const vertexCount = positionAttribute.count;

    for (let i = 0; i < vertexCount; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);

        // Add random noise to each vertex
        const noise = (Math.random() - 0.5) * 0.3; // Adjust noise intensity
        positionAttribute.setXYZ(i, x + noise, y + noise, z + noise);
    }sdwa

    geometry.attributes.position.needsUpdate = true; // Update the geometry
}
// Update cloud generation to cast shadows
for (let i = 0; i < 10; i++) {
    const cloudGroup = new THREE.Group(); // Group to hold multiple spheres for each cloud
    const cloudMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,  
        transparent: true, // Enable transparency 
        opacity: 0.8, // Set opacity for a soft cloud effect
        shininess: 10,  // Add shininess for a glossy effect
        });

    // Create 5-10 spheres per cloud
    const sphereCount = Math.floor(Math.random() * 9) + 12;
    for (let j = 0; j < sphereCount; j++) {
        const cloudGeometry = new THREE.SphereGeometry(
            Math.random() * 0.6 + 0.4, // Random radius between 0.4 and 1.0
            32,
            32
        );
        const cloudPart = new THREE.Mesh(cloudGeometry, cloudMaterial);

        // Randomly position each sphere within the cloud group
        cloudPart.position.set(
            Math.random() * 2 - 1, // Random x offset
            Math.random() * 1 - 1, // Random y offset
            Math.random() * 0.5 - 0.25 // Random z offset
        );

        cloudPart.castShadow = true; // Enable shadow casting for each sphere
        cloudGroup.add(cloudPart);
    }

    // Position the entire cloud group in the scene
    cloudGroup.position.set(
        Math.random() * 19 - 10, // Random x position
        Math.random() * 8 - 2,   // Random y position
        Math.random() * 7 - 1      // Random z position
    );

    scene.add(cloudGroup);
    clouds.push(cloudGroup);
}

// Remove the rocket and replace it with a paper airplane
const airplaneGeometry = new THREE.ConeGeometry(0.5, 2, 3); // Triangular shape for the airplane body
const airplaneMaterial = new THREE.MeshPhongMaterial({ color: 0xB22222, shininess: 100 }); // Firebrick Red with a shiny surface
const airplane = new THREE.Mesh(airplaneGeometry, airplaneMaterial);
airplane.rotation.x = Math.PI / 2; // Rotate to make it horizontal
airplane.rotation.y = Math.PI; // Rotate to face against the clouds
airplane.position.set(0, 0, 0); // Initial position
scene.add(airplane);

// Add wings to the paper airplane
const wingGeometry = new THREE.PlaneGeometry(2, 0.5); // Larger flat wings
const wingMaterial = new THREE.MeshPhongMaterial({ color: 0xA9C9D9, side: THREE.DoubleSide, shininess: 50 }); // Grayish Baby Blue for the wings
const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
leftWing.rotation.z = Math.PI / 0.5; // Slight tilt for a more realistic look
leftWing.position.set(-0.75, -0.5, 0.5); // Position the left wing
airplane.add(leftWing);

const rightWing = leftWing.clone();
rightWing.rotation.z = -Math.PI / 0.5; // Tilt the wing in the opposite direction
rightWing.position.set(0.75, -0.5, 0.5); // Position the right wing
airplane.add(rightWing);

const underWing = leftWing.clone();
underWing.rotation.z = Math.PI / 0.5; // Slight tilt for a more realistic look
underWing.position.set(-0.75, -0.5, -0.2); // Position the left wing
airplane.add(underWing);

const underWing2 = rightWing.clone();
underWing2.rotation.z = Math.PI / 0.5; // Slight tilt for a more realistic look
underWing2.position.set(0.75, -0.5, -0.2); // Position the left wing
airplane.add(underWing2);

// Adjust strings to stand vertically between the upper and under wings
const stringGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.7, 16); // Thin cylinder for the strings
const stringMaterial = new THREE.MeshBasicMaterial({ color: 0xA9C9D9 }); // Dark Gray for the strings

// Front-left string
const frontLeftString = new THREE.Mesh(stringGeometry, stringMaterial);
frontLeftString.position.set(-0.75, -0.7, 0.15); // Position between upper and under left wings
frontLeftString.rotation.x = Math.PI / 2; // Rotate to stand vertically
airplane.add(frontLeftString);

// Front-right string
const frontRightString = new THREE.Mesh(stringGeometry, stringMaterial);
frontRightString.position.set(0.75, -0.7, 0.15); // Position between upper and under right wings
frontRightString.rotation.x = Math.PI / 2; // Rotate to stand vertically
airplane.add(frontRightString);

// Back-left string
const backLeftString = new THREE.Mesh(stringGeometry, stringMaterial);
backLeftString.position.set(-0.75, -0.3, 0.15); // Position between upper and under left wings (back)
backLeftString.rotation.x = Math.PI / 2; // Rotate to stand vertically
airplane.add(backLeftString);

// Back-right string
const backRightString = new THREE.Mesh(stringGeometry, stringMaterial);
backRightString.position.set(0.75, -0.3, 0.15); // Position between upper and under right wings (back)
backRightString.rotation.x = Math.PI / 2; // Rotate to stand vertically
airplane.add(backRightString);

// Add a tail to the paper airplane
const tailGeometry = new THREE.PlaneGeometry(1, 0.5); // Small vertical tail
const tailMaterial = new THREE.MeshPhongMaterial({ color: 0xA9C9D9, side: THREE.DoubleSide, shininess: 50 }); // Grayish Baby Blue for the tail
const tail = new THREE.Mesh(tailGeometry, tailMaterial);
tail.rotation.x = Math.PI ; // Rotate to make it vertical
tail.position.set(0, 0.5, -0.1); // Position the tail at the back
airplane.add(tail);

// Add an aerofolio (rear wings) to the back of the airplane
const aerofolioGeometry = new THREE.PlaneGeometry(1.5, 0.3); // Flat wings for the aerofolio
const aerofolioMaterial = new THREE.MeshPhongMaterial({ color: 0xA9C9D9, side: THREE.DoubleSide, shininess: 50 }); // Grayish Baby Blue for the aerofolio



// Vertical stabilizer (center fin)
const stabilizerGeometry = new THREE.PlaneGeometry(0.5, 0.7); // Vertical fin
const stabilizerMaterial = new THREE.MeshPhongMaterial({ color: 0xA9C9D9, side: THREE.DoubleSide, shininess: 50 }); // Grayish Baby Blue for the stabilizer
const stabilizer = new THREE.Mesh(stabilizerGeometry, stabilizerMaterial);
stabilizer.rotation.y = Math.PI / 2; // Rotate to make it vertical
stabilizer.position.set(0, 0.8, 0.25); // Position at the center of the tail
airplane.add(stabilizer);

// Add a rotating propeller (helice) at the front of the airplane
const propellerGeometry = new THREE.BoxGeometry(0.1, 1, 0.02); // Thin rectangular blade
const propellerMaterial = new THREE.MeshBasicMaterial({ color: 0x2F4F4F }); // Dark Gray for the propeller
const propeller = new THREE.Group(); // Group to hold the propeller blades

// Create two blades for the propeller
const blade1 = new THREE.Mesh(propellerGeometry, propellerMaterial);
blade1.rotation.x = Math.PI / 2; // Slight tilt for the blade
//propeller.add(blade1);

const blade2 = blade1.clone();
blade2.rotation.x = Math.PI / 2; // Opposite tilt for the second blade
propeller.add(blade2);

// Position the propeller at the front of the airplane
propeller.position.set(0, -1, 0.2); // Slightly in front of the airplane
airplane.add(propeller);

// Create a missile-like rocket
const missileBodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 32); // Cylinder for the body
const missileBodyMaterial = new THREE.MeshBasicMaterial({ color: 0xf8f8ff }); // Gray color
const missile = new THREE.Mesh(missileBodyGeometry, missileBodyMaterial);
missile.position.set(0, 0, 0);
//scene.add(missile);

// Add fire propulsion
const fireGeometry = new THREE.ConeGeometry(0.2, 0.5, 32);
const fireMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500, transparent: true, opacity: 0.8 });
const fire = new THREE.Mesh(fireGeometry, fireMaterial);
fire.position.set(0, -1.25, 0);
fire.rotation.x = Math.PI; // Flip the fire upside down
missile.add(fire);


// Add rocket fins
const finGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.1);
const finMaterial = new THREE.MeshBasicMaterial({ color: 0xff00000 });
const fin1 = new THREE.Mesh(finGeometry, finMaterial);
fin1.position.set(-0.3, -0.75, 0);
missile.add(fin1);

const fin2 = fin1.clone();
fin2.position.set(0.3, -0.75, 0);
missile.add(fin2);

// Add rocket head (half-sphere)
const headGeometry = new THREE.SphereGeometry(0.2, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2); // Half-sphere
const headMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color
const head = new THREE.Mesh(headGeometry, headMaterial);
head.position.set(0, 1, 0); // Position the head on top of the body
missile.add(head);

// Add 2 fins around the body
const finGeometryMissile = new THREE.BoxGeometry(0.1, 0.5, 0.02); // Thin rectangular fins
const finMaterialMissile = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Black color

for (let i = 0; i < 2; i++) {
    const fin = new THREE.Mesh(finGeometryMissile, finMaterialMissile);
    const angle = (i * Math.PI * 2) / 2; // Evenly space the fins around the body
    fin.position.set(Math.cos(angle) * 0.3, -0.75, Math.sin(angle) * 0.3); // Position fins around the body
    fin.rotation.y = angle; // Rotate fins to align with the body
    missile.add(fin);
}

// Add fire propulsion
const fireGeometryMissile = new THREE.ConeGeometry(0.2, 0.5, 32);
const fireMaterialMissile = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.9,emissive: 0xff4500, emissiveIntensity: 1.5, });
const fireMissile = new THREE.Mesh(fireGeometryMissile, fireMaterialMissile);
fireMissile.position.set(0, -1.25, 0);
fireMissile.rotation.x = Math.PI; // Flip the fire upside down
missile.add(fireMissile);

const particleGeometry = new THREE.BufferGeometry();
const particleCount = 100;
const positions = new Float32Array(particleCount * 3);


for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 0.5; // x
    positions[i * 3 + 1] = Math.random() * -3; // y (below the rocket)
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5; // z
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const particleMaterial = new THREE.PointsMaterial({
    
    color: 0xaaaaaa, // Light gray for smoke
    size: 0.1,
    transparent: true,
    opacity: 0.5,
});

const particles = new THREE.Points(particleGeometry, particleMaterial);
//missile.add(particles);

// Update particles 
function updateParticles() {
    const positions = particleGeometry.attributes.position.array;

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += 0.01; // Mover partículas para cima
        if (positions[i * 3 + 1] > 0) {
            positions[i * 3 + 1] = Math.random() * -1; // Resetar posição Y
            positions[i * 3] = (Math.random() - 0.5) * 0.5; // Resetar posição X
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5; // Resetar posição Z
        }
    }

    particleGeometry.attributes.position.needsUpdate = true;

    // Manter as partículas abaixo do míssil
    particles.position.set(missile.position.x, missile.position.y - 1.5, missile.position.z);
}

// Create a particle system for the airplane trail
const trailGeometry = new THREE.BufferGeometry();
const trailCount = 50;
const trailPositions = new Float32Array(trailCount * 3);

for (let i = 0; i < trailCount; i++) {
    trailPositions[i * 3] = 0; // x
    trailPositions[i * 3 + 1] = 0; // y
    trailPositions[i * 3 + 2] = 0; // z
}

trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

const trailMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa, // Light gray for smoke
    size: 0.2,
    transparent: true,
    opacity: 0.1,
});

const trailParticles = new THREE.Points(trailGeometry, trailMaterial);
scene.add(trailParticles);

// Update the trail particles
function updateTrail() {
    const positions = trailGeometry.attributes.position.array;

    for (let i = trailCount - 1; i > 0; i--) {
        positions[i * 3] = positions[(i - 1) * 3]; // x
        positions[i * 3 + 1] = positions[(i - 1) * 3 + 1]; // y
        positions[i * 3 + 2] = positions[(i - 1) * 3 + 2]; // z
    }

    // Set the first particle to the airplane's current position
    positions[0] = airplane.position.x;
    positions[1] = airplane.position.y - 0.5; // Slightly below the airplane
    positions[2] = airplane.position.z;

    trailGeometry.attributes.position.needsUpdate = true;
}

// Add a spotlight to follow the airplane
const airplaneLight = new THREE.SpotLight(0xffd700, 1, 50, Math.PI / 6, 0.5, 2); // Golden light
airplaneLight.position.set(0, 5, 0);
airplaneLight.target = airplane;
airplaneLight.castShadow = true;
scene.add(airplaneLight);

// Update the light position to follow the airplane
function updateAirplaneLight() {
    airplaneLight.position.set(airplane.position.x, airplane.position.y + 5, airplane.position.z);
    airplaneLight.target.position.set(airplane.position.x, airplane.position.y, airplane.position.z);
}

    const keys = {};

// Track key presses
window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

let rocketFlyingOffset = 0; // Offset for the flying animation

    // Animation loop
    function draw() {
    // Rotate the propeller around the Z-axis (standing rotation)
    propeller.rotation.y += 0.2; // Adjust speed as needed

    // Move the airplane based on keys
    if (keys['ArrowUp']) airplane.position.y += 0.05; // Move up
    if (keys['ArrowDown']) airplane.position.y -= 0.05; // Move down
    if (keys['ArrowLeft']) airplane.position.x -= 0.05; // Move left
    if (keys['ArrowRight']) airplane.position.x += 0.05; // Move right
    if (keys['w']) airplane.position.z -= 0.05; // Move forward
    if (keys['s']) airplane.position.z += 0.05; // Move backward

    if (keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'] || keys['w'] || keys['s']) {
        applyCameraShake();
    }

    // Move clouds
    clouds.forEach(cloud => {
        cloud.position.z += forwardSpeed; // Move clouds backward
        if (cloud.position.z > 10) {
            cloud.position.z = -20; // Reset cloud position
            cloud.position.x = Math.random() * 20 - 10; // Randomize x position
            cloud.position.y = Math.random() * 10 - 2; // Randomize y position
        }
    });

    // Atualizar partículas (fumaça)
    updateParticles();

    // Animate water ripples
    animateWater();

    // Animate small objects to move with the clouds
    animateSmallObjects();

    // Update the trail particles
    updateTrail();

    // Update the light position to follow the airplane
    updateAirplaneLight();

    // Renderizar a cena
    renderer.render(scene, camera);
}

    function start() {
        renderer.setAnimationLoop(draw);
    }

    function stop() {
        renderer.setAnimationLoop(null);
    }

  
    

    // Track key presses
window.addEventListener('keydown', (event) => {
    keys[event.key] = true;
});

window.addEventListener('keyup', (event) => {
    keys[event.key] = false;
});

// Create a group for small objects (boats)
const smallObjects = [];

// Function to create a small boat
function createBoat() {
    const boatGeometry = new THREE.BoxGeometry(1, 0.5, 0.5); // Simple box for the boat
    const boatMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 }); // Brown color for the boat
    const boat = new THREE.Mesh(boatGeometry, boatMaterial);

    // Add a sail to the boat
    const sailGeometry = new THREE.PlaneGeometry(0.5, 1);
    const sailMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide }); // White sail
    const sail = new THREE.Mesh(sailGeometry, sailMaterial);
    sail.rotation.y = Math.PI / 2; // Rotate the sail
    sail.position.set(0, 0.5, 0); // Position the sail above the boat
    boat.add(sail);

    return boat;
}

// Add small objects (only boats) to the scene
for (let i = 0; i < 2; i++) {
    const object = createBoat(); // Only create boats

    object.position.set(
        Math.random() * 40 - 20, // Random X position
        -5.5, // Slightly above the water
        Math.random() * -50 - 10 // Random Z position behind the scene
    );

    scene.add(object);
    smallObjects.push(object);
}

// Animate small objects to move with the clouds
function animateSmallObjects() {
    smallObjects.forEach(object => {
        object.position.z += forwardSpeed; // Move forward with the clouds
        if (object.position.z > 10) {
            object.position.z = -50; // Reset position to the back
            object.position.x = Math.random() * 40 - 20; // Randomize X position
        }
    });
}

// Add movement instructions to the screen
const instructions = document.createElement('div');
instructions.style.position = 'absolute';
instructions.style.top = '10px';
instructions.style.left = '10px';
instructions.style.color = 'white';
instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
instructions.style.padding = '10px';
instructions.style.borderRadius = '5px';
instructions.style.fontFamily = 'Arial, sans-serif';
instructions.style.fontSize = '14px';
instructions.innerHTML = `
    <strong>Controls:</strong><br>
    - <strong>Arrow Up:</strong> Move Up<br>
    - <strong>Arrow Down:</strong> Move Down<br>
    - <strong>Arrow Left:</strong> Move Left<br>
    - <strong>Arrow Right:</strong> Move Right<br>
    - <strong>W:</strong> Move Forward<br>
    - <strong>S:</strong> Move Backward
`;
document.body.appendChild(instructions);

function applyCameraShake() {
    const shakeIntensity = 0.02; // Adjust the intensity of the shake
    camera.position.x += (Math.random() - 0.5) * shakeIntensity;
    camera.position.y += (Math.random() - 0.5) * shakeIntensity;
}

    return {
        start,
        stop,
    };
}