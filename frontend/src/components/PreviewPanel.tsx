import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Monitor, Smartphone, Tablet, RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import type { Section } from '@/types/cms';

interface Props {
  pageId: number | undefined;
  sections: Section[];
  title: string;
  onBlockClick?: (blockId: string, sectionId: string) => void;
  selectedBlockId?: string;
}

const VIEWPORTS = [
  { key: 'desktop', label: 'Desktop', icon: Monitor, width: '100%' },
  { key: 'tablet', label: 'Tablet', icon: Tablet, width: '768px' },
  { key: 'mobile', label: 'Mobile', icon: Smartphone, width: '375px' },
] as const;

export default function PreviewPanel({ pageId, sections, title, onBlockClick, selectedBlockId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [viewport, setViewport] = useState<string>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewReady, setPreviewReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sendToPreview = useCallback((currentSections: Section[], currentTitle: string) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      {
        type: 'cms-preview-update',
        payload: { title: currentTitle, sections: currentSections },
      },
      '*',
    );
  }, []);

  // Listen for messages from the iframe (ready + block clicks)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (typeof event.data !== 'object' || event.data === null) return;
      const msg = event.data as Record<string, unknown>;
      if (msg.type === 'cms-preview-ready') {
        setPreviewReady(true);
        sendToPreview(sections, title);
      }
      if (msg.type === 'cms-preview-block-click' && onBlockClick) {
        onBlockClick(msg.blockId as string, msg.sectionId as string);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [sections, title, sendToPreview, onBlockClick]);

  // Send sections to preview iframe whenever they change (debounced)
  useEffect(() => {
    if (!previewReady) return;
    const timer = setTimeout(() => sendToPreview(sections, title), 150);
    return () => clearTimeout(timer);
  }, [sections, title, previewReady, sendToPreview]);

  // Reset ready state on refresh
  useEffect(() => {
    setPreviewReady(false);
  }, [refreshKey]);

  // Editor → Preview: scroll to selected block
  useEffect(() => {
    if (!selectedBlockId || !previewReady) return;
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({ type: 'cms-scroll-to-block', blockId: selectedBlockId }, '*');
  }, [selectedBlockId, previewReady]);

  if (!pageId) return null;

  const vp = VIEWPORTS.find((v) => v.key === viewport) ?? VIEWPORTS[0];
  const token = localStorage.getItem('cms_token') || '';
  // Inline Preview: lokale preview.html (schnelles postMessage-Update)
  const previewUrl = `/preview.html?pageId=${pageId}&token=${encodeURIComponent(token)}`;
  // Vollbild Preview: Astro SSR Route mit echtem Tailwind CSS
  const astroPreviewUrl = `https://preview.ir-tours.de/preview?pageId=${pageId}&token=${encodeURIComponent(token)}`;

  if (expanded) {
    return createPortal(
      <div className="fixed inset-0 z-[100] bg-white flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 shrink-0">
          <span className="text-xs font-medium text-[var(--text-muted)]">Live Vorschau</span>
          <div className="flex items-center gap-1 ml-2">
            {VIEWPORTS.map((v) => (
              <button
                key={v.key}
                onClick={() => setViewport(v.key)}
                className={`p-1.5 rounded transition-colors ${
                  viewport === v.key
                    ? 'bg-white shadow-sm text-[var(--primary)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
                title={v.label}
              >
                <v.icon size={14} />
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            title="Aktualisieren"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setExpanded(false)}
            className="p-1.5 rounded text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            title="Verkleinern"
          >
            <Minimize2 size={14} />
          </button>
        </div>
        <div className="flex-1 flex justify-center bg-gray-100 p-4">
          <div style={{ width: vp.width, maxWidth: '100%' }} className="bg-white shadow-lg rounded overflow-hidden flex flex-col flex-1">
            <iframe
              key={`expanded-${refreshKey}`}
              src={astroPreviewUrl}
              className="w-full border-0 flex-1"
              title="Seitenvorschau"
            />
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 shrink-0">
        <span className="text-[11px] font-medium text-[var(--text-muted)] mr-1">Live Vorschau</span>
        {VIEWPORTS.map((v) => (
          <button
            key={v.key}
            onClick={() => setViewport(v.key)}
            className={`p-1 rounded transition-colors ${
              viewport === v.key
                ? 'bg-white shadow-sm text-[var(--primary)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
            title={v.label}
          >
            <v.icon size={13} />
          </button>
        ))}
        <div className="flex-1" />
        <StatusDot ready={previewReady} />
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          title="Aktualisieren"
        >
          <RefreshCw size={13} />
        </button>
        <button
          onClick={() => setExpanded(true)}
          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          title="Vollbild"
        >
          <Maximize2 size={13} />
        </button>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 flex justify-center bg-gray-100 overflow-hidden p-3">
        <div
          style={{ width: vp.width, maxWidth: '100%' }}
          className="bg-white flex flex-col h-full rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden"
        >
          <iframe
            ref={iframeRef}
            key={refreshKey}
            src={previewUrl}
            className="w-full border-0 flex-1"
            title="Seitenvorschau"
          />
        </div>
      </div>
    </div>
  );
}

function StatusDot({ ready }: { ready: boolean }) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${ready ? 'bg-green-500' : 'bg-amber-400 animate-pulse'}`}
      title={ready ? 'Live-Vorschau aktiv' : 'Verbindung wird hergestellt...'}
    />
  );
}
