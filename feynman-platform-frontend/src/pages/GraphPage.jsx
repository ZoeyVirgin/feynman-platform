import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import apiClient from '../api/axios';

function GraphPage() {
  const [option, setOption] = useState(null);
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
        const opt = {
          tooltip: {
            trigger: 'item',
            formatter: (params) => {
              if (params.dataType === 'node') {
                const v = params?.data?.value || '';
                return `<div style="max-width:280px;word-break:break-all;">` +
                       `<div style="font-weight:600;margin-bottom:4px;">${params.name}</div>` +
                       `<div style="color:#666;">${String(v || '').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>` +
                       `</div>`;
              }
              return params.name || '';
            },
          },
          series: [
            {
              type: 'graph',
              layout: 'force',
              data: Array.isArray(data.nodes) ? data.nodes : [],
              links: Array.isArray(data.links) ? data.links : [],
              roam: true,
              label: {
                show: true,
                position: 'right',
                formatter: '{b}',
              },
              force: {
                repulsion: 140,
                edgeLength: [40, 120],
              },
              emphasis: {
                focus: 'adjacency',
                lineStyle: { width: 6 },
              },
              edgeLabel: {
                show: true,
                formatter: '引用',
                color: '#666',
              },
              lineStyle: {
                color: '#aaa',
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

  if (loading) return <div>正在生成知识图谱...</div>;
  if (error) return <div style={{ color: 'red' }}>加载失败：{String(error)}</div>;

  return (
    <div>
      <h1>知识图谱</h1>
      <p>展示知识点之间的引用关系。点击节点可跳转到编辑。</p>
      <ReactECharts option={option} style={{ height: 600, width: '100%' }} onEvents={onEvents} />
    </div>
  );
}

export default GraphPage;

