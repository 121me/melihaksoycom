import './style.css'
import * as THREE from 'three';

// Three.js Background Implementation
let scene, camera, renderer;
let particles, particlesGeometry, material;

function init() {
  // Create scene
  scene = new THREE.Scene();

  // Setup camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 30;

  // Setup renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('background-canvas'),
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x0a0a0a, 1);

  // Create particles
  particlesGeometry = new THREE.BufferGeometry();
  const count = 5000;

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count * 3; i += 3) {
    // Positions
    positions[i] = (Math.random() - 0.5) * 100;
    positions[i + 1] = (Math.random() - 0.5) * 100;
    positions[i + 2] = (Math.random() - 0.5) * 100;

    // Colors
    colors[i] = Math.random() * 0.2;
    colors[i + 1] = Math.random() * 0.5;
    colors[i + 2] = Math.random() * 0.5 + 0.5;
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  // Material
  material = new THREE.PointsMaterial({
    size: 0.5,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });

  // Create point cloud
  particles = new THREE.Points(particlesGeometry, material);
  scene.add(particles);

  // Add light
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);

  const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
  pointLight.position.set(10, 10, 10);
  scene.add(pointLight);

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Mouse move effect
  document.addEventListener('mousemove', onMouseMove);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

let mouseX = 0;
let mouseY = 0;

function onMouseMove(event) {
  mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function animate() {
  requestAnimationFrame(animate);

  const positions = particlesGeometry.attributes.position.array;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];

    // Add subtle movement
    positions[i + 1] = y + Math.sin(Date.now() * 0.001 + x * 0.1) * 0.01;
    positions[i] = x + Math.cos(Date.now() * 0.001 + z * 0.1) * 0.01;
  }

  particlesGeometry.attributes.position.needsUpdate = true;

  // Rotate based on mouse position
  particles.rotation.x += 0.0003;
  particles.rotation.y += 0.0005;

  // Apply mouse movement influence
  particles.rotation.x += mouseY * 0.0003;
  particles.rotation.y += mouseX * 0.0003;

  renderer.render(scene, camera);
}

init();
animate();

// Smooth scrolling for anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();

    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});