import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import apiClient from '../api/axios';

function ThreeJSPage() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animationRef = useRef(null);
  const graphGroupRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 初始化 Three.js 基础场景
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // 深色背景

    const camera = new THREE.PerspectiveCamera(
      60,
      el.clientWidth / el.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 2.2, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    el.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 基础光照
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const point = new THREE.PointLight(0xffffff, 1.1);
    point.position.set(6, 8, 6);
    scene.add(ambient);
    scene.add(point);

    // 占位：旋转立方体（如果没有数据时至少能看到内容）
    const cubeGeo = new THREE.BoxGeometry(1, 1, 1);
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5, metalness: 0.1 });
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    cube.name = 'demo-cube';
    scene.add(cube);

    // 容器：存放知识图谱的节点与边，便于后续清空重建
    const graphGroup = new THREE.Group();
    graphGroup.name = 'graph-group';
    scene.add(graphGroup);

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      // 轻微旋转占位物体
      const demo = scene.getObjectByName('demo-cube');
      if (demo) {
        demo.rotation.x += 0.01;
        demo.rotation.y += 0.012;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // 持有引用
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    graphGroupRef.current = graphGroup;

    // 清理
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationRef.current);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode)
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  // 加载图谱数据并渲染到 3D
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!sceneRef.current || !graphGroupRef.current) return;
      setLoading(true);
      setError(null);
      try {
        // 先尝试鉴权接口
        let data;
        try {
          const res = await apiClient.get('/graph/knowledge-map');
          data = res?.data;
        } catch (e1) {
          // 开发环境兜底
          const raw = await fetch('http://localhost:4500/api/graph/knowledge-map-dev?userId=1', { credentials: 'include' });
          data = await raw.json();
        }
        if (cancelled) return;
        const nodes = Array.isArray(data?.nodes) ? data.nodes : [];
        const links = Array.isArray(data?.links) ? data.links : [];

        // 清空旧的 graph 内容
        const group = graphGroupRef.current;
        while (group.children.length) {
          const obj = group.children.pop();
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
            else obj.material.dispose();
          }
          group.remove(obj);
        }

        if (nodes.length === 0) {
          setLoading(false);
          return;
        }

        // 构建节点（球体）
        const nodeMap = new Map();
        const sphereGeo = new THREE.SphereGeometry(0.22, 32, 32);
        const seededRand = (seed) => {
          let s = 0;
          for (let i = 0; i < seed.length; i++) s = (s * 131 + seed.charCodeAt(i)) >>> 0;
          return () => {
            s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 0xffffffff;
          };
        };

        // 随机分布半径
        const R = 8;
        nodes.forEach((n) => {
          const colorSeed = seededRand(String(n.id));
          const color = new THREE.Color().setHSL(colorSeed() * 0.9, 0.6, 0.56);
          const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.15 });
          const mesh = new THREE.Mesh(sphereGeo, mat);

          // 随机球面坐标分布
          const u = Math.random();
          const v = Math.random();
          const theta = 2 * Math.PI * u;
          const phi = Math.acos(2 * v - 1);
          const r = R * (0.6 + 0.4 * Math.random());
          mesh.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
          );

          mesh.userData = { id: n.id, name: n.name || n.title || `节点${n.id}` };
          group.add(mesh);
          nodeMap.set(String(n.id), mesh);
        });

        // 构建边（直线）
        const lineMat = new THREE.LineBasicMaterial({ color: 0x93a1b2, transparent: true, opacity: 0.5 });
        links.forEach((e) => {
          const a = nodeMap.get(String(e.source));
          const b = nodeMap.get(String(e.target));
          if (!a || !b) return;
          const pts = [a.position.clone(), b.position.clone()];
          const geo = new THREE.BufferGeometry().setFromPoints(pts);
          const line = new THREE.Line(geo, lineMat);
          group.add(line);
        });

        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || '加载失败');
        setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <h1>3D视界</h1>
      <p style={{ marginTop: 4, color: '#64748b' }}>三维知识宇宙：节点为“星球”，边为“星际航线”，可拖拽旋转、缩放与平移。</p>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>加载失败：{String(error)}</div>}
      {loading && <div style={{ color: '#94a3b8', marginBottom: 8 }}>加载图谱中…</div>}
      <div ref={mountRef} style={{ width: '100%', height: '70vh', borderRadius: 8, overflow: 'hidden', border: '1px solid #0f172a' }} />
    </div>
  );
}

export default ThreeJSPage;

