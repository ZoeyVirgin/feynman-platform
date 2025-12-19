// src/pages/CesiumPage.jsx
import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './CesiumPage.css';
import apiClient from '../api/axios';

// 设置 Cesium 的默认 token
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5YjU1NmU5Ny0wYjJkLTQyYjEtYjVlOS05NDljYjY0MDBkYzkiLCJpZCI6MjE1MzgwLCJpYXQiOjE3MTY4ODc1Nzd9.s-T6YkM_G2SA4O-dG9ie6h-o-Zp-l-s3zY_CHid2-2E';

function CesiumPage() {
  const cesiumContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. 初始化 Cesium Viewer
  useEffect(() => {
    if (cesiumContainerRef.current && !viewerRef.current) {
      const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        shouldAnimate: true,
        terrainProvider: Cesium.createWorldTerrain(), // 添加地形
      });
      viewerRef.current = viewer;

      // 优化视觉效果：关闭天空大气层，使背景透明
      viewer.scene.skyAtmosphere.show = false;
      viewer.scene.backgroundColor = Cesium.Color.TRANSPARENT;
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // 2. 加载和渲染知识图谱数据
  useEffect(() => {
    if (!viewerRef.current) return;

    const loadGraphData = async () => {
      setLoading(true);
      setError(null);
      try {
        let data;
        try {
          const res = await apiClient.get('/graph/knowledge-map');
          data = res?.data;
        } catch (e) {
          console.warn('API request failed, using fallback data.');
          const raw = await fetch('/api/graph/knowledge-map-dev?userId=1');
          data = await raw.json();
        }

        const viewer = viewerRef.current;
        if (!data || !viewer) return;

        // 清空之前的所有实体
        viewer.entities.removeAll();

        const nodes = data.nodes || [];
        const links = data.links || [];

        // 渲染节点
        const nodeMap = new Map();
        nodes.forEach(node => {
          const lon = Math.random() * 360 - 180;
          const lat = Math.random() * 180 - 90;
          const position = Cesium.Cartesian3.fromDegrees(lon, lat, 0);

          const entity = viewer.entities.add({
            position: position,
            point: {
              pixelSize: 10,
              color: Cesium.Color.fromRandom({ alpha: 1.0 }),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
            },
            label: {
              text: node.name || node.title,
              font: '14px sans-serif',
              fillColor: Cesium.Color.WHITE,
              pixelOffset: new Cesium.Cartesian2(0, -20),
              showBackground: true,
              backgroundColor: new Cesium.Color(0.1, 0.1, 0.1, 0.7),
            },
          });
          nodeMap.set(String(node.id), position);
        });

        // 渲染边（弧线）
        links.forEach(link => {
          const startPos = nodeMap.get(String(link.source));
          const endPos = nodeMap.get(String(link.target));

          if (startPos && endPos) {
            const arc = new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.2,
                color: Cesium.Color.YELLOW.withAlpha(0.7),
            });

            viewer.entities.add({
              polyline: {
                positions: [startPos, endPos],
                width: 2,
                material: arc,
              },
            });
          }
        });

        setLoading(false);
      } catch (err) {
        setError(err.message || '加载数据失败');
        setLoading(false);
      }
    };

    loadGraphData();

  }, [viewerRef.current]); // 依赖 viewer 实例是否创建

  return (
    <div>
      <h1>Cesium 3D 地球</h1>
      <p style={{ marginTop: 4, color: '#64748b' }}>这是一个基于 Cesium 实现的 3D 地球，后续将在此基础上加载知识图谱节点。</p>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>加载失败：{String(error)}</div>}
      {loading && <div style={{ color: '#94a3b8', marginBottom: 8 }}>加载图谱中…</div>}
      <div ref={cesiumContainerRef} className="cesium-container" />
    </div>
  );
}

export default CesiumPage;
