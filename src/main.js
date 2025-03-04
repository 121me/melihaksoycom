import './style.css'
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

class InteractiveParticleBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.particles = null;
    this.particlesGeometry = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.interactionPoint = new THREE.Vector3();
    this.particleCount = 5000;
    this.maxParticleSize = 1.5;
    this.minParticleSize = 0.1;

    this.init();
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 30;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;

    // Effect Composer for bloom effect
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      2.5,  // strength
      0.2,  // radius
      0.1,  // threshold
    );
    this.composer.addPass(bloomPass);

    // Create particles
    this.createParticles();

    // Create particle interactions
    this.setupEventListeners();

    // Lights
    this.setupLighting();

    // Animate
    this.animate();
  }

  createParticles() {
    this.particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      // Spread particles in a more spherical distribution
      const phi = Math.random() * Math.PI * 2;
      const cosTheta = Math.random() * 2 - 1;
      const u = Math.random();
      const theta = Math.acos(cosTheta);
      const r = Math.cbrt(u) * 50;  // Cube root for more uniform sphere distribution

      positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = r * Math.cos(theta);

      // Gradient blue colors
      colors[i * 3] = 0;
      colors[i * 3 + 1] = Math.random() * 0.5;
      colors[i * 3 + 2] = 0.5 + Math.random() * 0.5;

      // Varying particle sizes
      sizes[i] = Math.random() * (this.maxParticleSize - this.minParticleSize) + this.minParticleSize;
    }

    this.particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 0.1));

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8
    });

    this.particles = new THREE.Points(this.particlesGeometry, material);
    this.scene.add(this.particles);
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
    pointLight.position.set(10, 10, 10);
    this.scene.add(pointLight);
  }

  setupEventListeners() {
    // Desktop mouse move
    window.addEventListener('mousemove', (event) => this.onMouseMove(event));

    // Touch move for mobile
    window.addEventListener('touchmove', (event) => {
      if (event.touches.length > 0) {
        this.onMouseMove(event.touches[0]);
      }
    });

    // Responsive resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  onMouseMove(event) {
    // Normalize mouse coordinates
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.interactionPoint.copy(this.raycaster.ray.direction).multiplyScalar(20);
  }

  onWindowResize() {
    // Update camera
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Update composer
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Get positions and sizes
    const positions = this.particlesGeometry.attributes.position.array;
    const sizes = this.particlesGeometry.attributes.size.array;

    // Particle animation
    for (let i = 0; i < this.particleCount; i++) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];
      const time = Date.now() * 0.0001;

      // Add subtle movement
      positions[i + 1] = y + Math.sin(Date.now() * 0.001 + x * 0.1) * 0.01;
      positions[i] = x + Math.cos(Date.now() * 0.0001 + z * 0.1) * 0.01;

      // Subtle pulsing of particle sizes
      sizes[i] = this.minParticleSize +
        Math.sin(time * 2 + i) * 0.5 *
        (this.maxParticleSize - this.minParticleSize);
    }

    // Update geometries
    this.particlesGeometry.attributes.position.needsUpdate = true;
    this.particlesGeometry.attributes.size.needsUpdate = true;

    // Subtle rotation
    this.particles.rotation.x += 0.000015;
    this.particles.rotation.y += 0.000035;

    // Interactive rotation based on mouse
    this.particles.rotation.x += this.mouse.y * 0.001;
    this.particles.rotation.y += this.mouse.x * 0.001;

    // Render
    this.composer.render();
  }
}

// Initialize the background
function initBackground() {
  if (document.getElementById('background-canvas')) {
    return new InteractiveParticleBackground('background-canvas');
  }
}

// Call on page load
window.addEventListener('load', initBackground);

export default InteractiveParticleBackground;

// Smooth scrolling for anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();

    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});