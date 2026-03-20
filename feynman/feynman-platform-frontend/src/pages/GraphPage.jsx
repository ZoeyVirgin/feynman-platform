import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import apiClient from '../api/axios';

function GraphPage() {
  const [option, setOption] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get('/graph/knowledge-map');
        const data = res?.data || { nodes: [], links: [] };
        
        // 增强节点数据，为每个节点赋予随机颜色和大小
        const nodes = (Array.isArray(data.nodes) ? data.nodes : []).map(node => ({
          ...node,
          symbolSize: Math.random() * 20 + 10, // 随机大小
          itemStyle: {
            color: `hsl(${Math.random() * 360}, 80%, 60%)`, // 随机 HSL 颜色
          },
        }));

        const opt = {
          backgroundColor: '#000000', // 设置黑色背景
          tooltip: {
            trigger: 'item',
            formatter: '{b}', // 简化提示
          },
          series: [
            {
              type: 'graph',
              layout: 'force',
              data: nodes,
              links: Array.isArray(data.links) ? data.links : [],
              roam: true, // 允许缩放和平移
              label: {
                show: true,
                position: 'right',
                formatter: '{b}',
                color: '#ffffff', // 标签文字颜色
                fontSize: 12,
              },
              force: {
                repulsion: 100, // 节点间的斥力因子
                edgeLength: [50, 150], // 边的长度范围
                gravity: 0.1, // 节点受到的向中心聚合的引力
              },
              emphasis: {
                focus: 'adjacency',
                lineStyle: { width: 8, color: '#f0f0f0' },
              },
              lineStyle: {
                color: 'rgba(255, 255, 255, 0.2)', // 边的颜色
                width: 1,
                curveness: 0.1,
              },
            },
          ],
        };
        setOption(opt);
      } catch (e) {
        setError(e?.response?.data?.msg || e?.message || '获取数据失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const onEvents = useMemo(() => ({
    click: (params) => {
      if (params?.componentType === 'series' && params?.dataType === 'node') {
        const id = params?.data?.id;
        if (id) navigate(`/kp/edit/${id}`);
      }
    },
  }), [navigate]);

  if (loading) return <div style={{ color: 'white', textAlign: 'center' }}>正在生成知识图谱...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center' }}>加载失败：{String(error)}</div>;

  return (
    <ReactECharts 
      option={option} 
      style={{ height: '100vh', width: '100vw' }} 
      onEvents={onEvents} 
    />
  );
}

export default GraphPage;
