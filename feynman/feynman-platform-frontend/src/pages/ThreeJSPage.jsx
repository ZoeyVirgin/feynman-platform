// src/pages/ThreeJSPage.jsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import apiClient from '../api/axios';
import './ThreeJSPage.css';

// --- 辅助函数：创建辉光纹理 ---
const createGlowTexture = (color) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0.0, `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.8)`);
  gradient.addColorStop(0.4, `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.3)`);
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
};

function ThreeJSPage() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // --- 1. 基础设置 ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.set(0, 5, 35);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    el.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    el.appendChild(labelRenderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 5;
    controls.maxDistance = 100;

    // --- 2. 场景内容 ---
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 20000; i++) {
      const x = (Math.random() - 0.5) * 2500;
      const y = (Math.random() - 0.5) * 2500;
      const z = (Math.random() - 0.5) * 2500;
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    const graphGroup = new THREE.Group();
    scene.add(graphGroup);

    // --- 3. 加载数据并渲染图谱 ---
    let isCancelled = false;
    const loadGraph = async () => {
      try {
        let data;
        try {
          const res = await apiClient.get('/graph/knowledge-map');
          data = res?.data;
        } catch (e) {
          const raw = await fetch('/api/graph/knowledge-map-dev?userId=1');
          data = await raw.json();
        }
        if (isCancelled) return;

        const nodes = data.nodes || [];
        const links = data.links || [];

        if (nodes.length === 0) return;

        const nodeMap = new Map();

        nodes.forEach(node => {
          const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.6);
          const nodeGroup = new THREE.Group();

          const coreGeo = new THREE.SphereGeometry(0.5, 32, 32);
          const coreMat = new THREE.MeshBasicMaterial({ color: color });
          const core = new THREE.Mesh(coreGeo, coreMat);
          nodeGroup.add(core);

          const wireGeo = new THREE.SphereGeometry(0.55, 16, 8);
          const wireMat = new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.5 });
          const wireframe = new THREE.Mesh(wireGeo, wireMat);
          nodeGroup.add(wireframe);

          const glowTexture = createGlowTexture(color);
          const glowMat = new THREE.SpriteMaterial({ map: glowTexture, blending: THREE.AdditiveBlending, transparent: true });
          const glowSprite = new THREE.Sprite(glowMat);
          glowSprite.scale.set(6, 6, 1);
          nodeGroup.add(glowSprite);

          const pos = new THREE.Vector3(
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 30
          );
          nodeGroup.position.copy(pos);
          graphGroup.add(nodeGroup);
          nodeMap.set(String(node.id), nodeGroup);

          const labelDiv = document.createElement('div');
          labelDiv.className = 'node-label';
          labelDiv.textContent = node.name || node.title;
          const label = new CSS2DObject(labelDiv);
          label.position.copy(nodeGroup.position);
          label.position.y += 1.0;
          graphGroup.add(label);
        });

        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.6 });
        links.forEach(link => {
          const startNode = nodeMap.get(String(link.source));
          const endNode = nodeMap.get(String(link.target));
          if (startNode && endNode) {
            const points = [startNode.position, endNode.position];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            graphGroup.add(line);
          }
        });
      } catch (err) {
        console.error('Failed to load graph data:', err);
      }
    };

    loadGraph();

    // --- 4. 动画与清理 ---
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      graphGroup.children.forEach(child => {
        if (child.isGroup) {
          const wireframe = child.children.find(c => c.material && c.material.wireframe);
          if (wireframe) {
            wireframe.rotation.y += 0.005;
          }
        }
      });
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      labelRenderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isCancelled = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      el.innerHTML = '';
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }}
    />
  );
}

export default ThreeJSPage;
