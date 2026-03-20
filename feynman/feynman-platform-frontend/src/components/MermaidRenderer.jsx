import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

function MermaidRenderer({ code }) {
    const containerRef = useRef(null);
    const [svg, setSvg] = useState('');

    useEffect(() => {
        if (!containerRef.current || !code?.trim()) {
            setSvg('');
            return;
        }

        mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            securityLevel: 'loose',
        });

        const render = async () => {
            try {
                const uniqueId = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
                const { svg: svgCode } = await mermaid.render(uniqueId, code.trim());
                setSvg(svgCode);
            } catch (err) {
                console.error('Mermaid 渲染失败：', err);
                setSvg(`<pre class="mermaid-error">Mermaid 渲染失败：${err.message}</pre>`);
            }
        };

        render();
    }, [code]);

    return (
        <div
            ref={containerRef}
            className="mermaid-container"
            style={{ width: '100%', overflow: 'auto', margin: '10px 0' }}
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
}

export default MermaidRenderer;

