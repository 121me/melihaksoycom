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
    this.mouse = new THREE.Vector2();
    this.particleCount = 1500; // Reduced number of particles
    this.maxParticleSize = 2.5;
    this.minParticleSize = 0.5;
    this.baseParticleSize = 0.8;

    this.init();
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050505);
    this.scene.fog = new THREE.FogExp2(0x080808, 0.01);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 40;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Effect Composer for bloom effect
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,  // strength (reduced)
      0.4,  // radius
      0.2,  // threshold
    );
    this.composer.addPass(bloomPass);

    // Create particles
    this.createParticles();

    // Create particle interactions
    this.setupEventListeners();

    // Animate
    this.animate();
  }

  createParticles() {
    this.particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      // Spread particles in a spherical distribution
      const radius = 50 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // White to light grey colors with some variation
      const brightness = 0.7 + Math.random() * 0.3;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness;

      // Varying particle sizes with more emphasis on smaller particles
      sizes[i] = this.baseParticleSize * (0.5 + Math.random() * 0.5);
    }

    this.particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(this.particlesGeometry, material);
    this.scene.add(this.particles);
  }

  setupEventListeners() {
    window.addEventListener('mousemove', (event) => this.onMouseMove(event));
    window.addEventListener('touchmove', (event) => {
      if (event.touches.length > 0) {
        this.onMouseMove(event.touches[0]);
      }
    });
    window.addEventListener('resize', () => this.onWindowResize());
  }

  onMouseMove(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const positions = this.particlesGeometry.attributes.position.array;
    const sizes = this.particlesGeometry.attributes.size.array;
    const time = Date.now() * 0.0005;

    // Subtle particle animation
    for (let i = 0; i < this.particleCount; i++) {
      // Very subtle movement for a more stable appearance
      positions[i * 3 + 1] += Math.sin(time + i) * 0.002;

      // Pulsing effect for stars
      sizes[i] = this.baseParticleSize * (0.8 + Math.sin(time * 2 + i) * 0.2);
    }

    this.particlesGeometry.attributes.position.needsUpdate = true;
    this.particlesGeometry.attributes.size.needsUpdate = true;

    // Very slow rotation
    this.particles.rotation.x += 0.00001;
    this.particles.rotation.y += 0.00002;

    // Slight interactive rotation based on mouse
    this.particles.rotation.x += this.mouse.y * 0.0002;
    this.particles.rotation.y += this.mouse.x * 0.0002;

    this.composer.render();
  }
}

function initBackground() {
  if (document.getElementById('background-canvas')) {
    return new InteractiveParticleBackground('background-canvas');
  }
}

window.addEventListener('load', initBackground);

// Smooth scrolling for anchors
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

// Add header pinning functionality
window.addEventListener('scroll', function() {
  const header = document.querySelector('header');
  if (window.scrollY > 50) {
    header.classList.add('pinned');
  } else {
    header.classList.remove('pinned');
  }
});