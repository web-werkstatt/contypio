import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Copy, Check, GripVertical, PanelRightClose } from 'lucide-react';
import api from '@/lib/api';
import type { Page, CollectionSchema, CollectionItem } from '@/types/cms';
import { useSectionEditor } from '@/hooks/useSectionEditor';
import SectionList from '@/components/sections/SectionList';
import PreviewPanel from '@/components/PreviewPanel';
import PropertiesSidebar, { type BlockSelection } from '@/components/editor/PropertiesSidebar';
import DuplicateDialog from '@/components/editor/DuplicateDialog';
import StructureTree from '@/components/editor/StructureTree';
import { useTenant } from '@/hooks/useTenant';
import PageContentTab from '@/components/editor/PageContentTab';
import PageSeoTab from '@/components/editor/PageSeoTab';
import PageSettingsTab from '@/components/editor/PageSettingsTab';
import PageCollectionTab from '@/components/editor/PageCollectionTab';

const SIDEBAR_KEY = 'cms-properties-sidebar-open';
const PREVIEW_KEY = 'cms-preview-panel-open';
const PREVIEW_W_KEY = 'cms-preview-width';
const calcMaxW = () => Math.max(320, window.innerWidth - 224 - 400 - 56);

export default function PageEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { tenant } = useTenant();
  const { t } = useTranslation(['content', 'common']);
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [path, setPath] = useState('');
  const [pageType, setPageType] = useState('content');
  const [parentId, setParentId] = useState<number | null>(null);
  const [collectionKey, setCollectionKey] = useState('');
  const [seo, setSeo] = useState({ title: '', description: '' });
  const [activeTab, setActiveTab] = useState<'content' | 'layout' | 'seo' | 'settings' | 'collection'>('content');
  const [colEditItem, setColEditItem] = useState<CollectionItem | null>(null);
  const [colShowForm, setColShowForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => { const s = localStorage.getItem(SIDEBAR_KEY); return s !== null ? s === 'true' : true; });
  const [selectedBlock, setSelectedBlock] = useState<BlockSelection | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [slugCopied, setSlugCopied] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(() => localStorage.getItem(PREVIEW_KEY) === 'true');
  const [previewWidth, setPreviewWidth] = useState(() => { const b = Number(localStorage.getItem(PREVIEW_W_KEY)) || 480; return Math.min(b, calcMaxW()); });
  const isDragging = useRef(false);
  const contentAreaRef = useRef<HTMLDivElement>(null);

  const togglePreview = useCallback(() => {
    setPreviewOpen((v) => { const n = !v; localStorage.setItem(PREVIEW_KEY, String(n)); if (!n) setSelectedBlock(null); return n; });
  }, []);

  useEffect(() => {
    const h = () => setPreviewWidth((w) => Math.min(w, calcMaxW()));
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    if (activeTab === 'layout') { setSidebarOpen(!previewOpen); localStorage.setItem(SIDEBAR_KEY, String(!previewOpen)); }
  }, [previewOpen, activeTab]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); isDragging.current = true;
    const startX = e.clientX, startW = previewWidth;
    const onMove = (ev: MouseEvent) => { if (!isDragging.current) return; setPreviewWidth(Math.min(Math.max(startW + startX - ev.clientX, 320), calcMaxW())); };
    const onUp = () => { isDragging.current = false; setPreviewWidth((w) => { localStorage.setItem(PREVIEW_W_KEY, String(w)); return w; }); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
  }, [previewWidth]);

  const sectionEditor = useSectionEditor([]);

  const { data: page } = useQuery<Page>({ queryKey: ['page', id], queryFn: async () => (await api.get(`/api/pages/${id}`)).data, enabled: !isNew && !!id });
  const { data: allPages } = useQuery<Page[]>({ queryKey: ['pages'], queryFn: async () => (await api.get('/api/pages')).data });
  const { data: collections } = useQuery<CollectionSchema[]>({ queryKey: ['collections'], queryFn: async () => (await api.get('/api/collections')).data });
  const linkedKey = page?.collection_key || collectionKey || '';
  const { data: linkedSchema } = useQuery<CollectionSchema>({ queryKey: ['collectionSchema', linkedKey], queryFn: async () => (await api.get(`/api/collections/${linkedKey}/schema`)).data, enabled: !!linkedKey });
  const { data: linkedItems, refetch: refetchLinkedItems } = useQuery<{ items: CollectionItem[]; total: number }>({ queryKey: ['collectionItems', linkedKey], queryFn: async () => (await api.get(`/api/collections/${linkedKey}/items`)).data, enabled: !!linkedKey });

  const colDeleteMutation = useMutation({
    mutationFn: (itemId: number) => api.delete(`/api/collections/${linkedKey}/items/${itemId}`),
    onSuccess: () => { refetchLinkedItems(); qc.invalidateQueries({ queryKey: ['collections'] }); },
  });

  useEffect(() => {
    if (!page) return;
    setTitle(page.title); setSlug(page.slug); setPath(page.path); setPageType(page.page_type);
    setCollectionKey(page.collection_key ?? ''); setParentId(page.parent_id ?? null);
    setSeo({ title: page.seo?.title || '', description: page.seo?.description || '' });
    sectionEditor.reset(page.sections || []);
  }, [page]);

  const titleToSlug = (t: string) => t.toLowerCase().replace(/[äöüß]/g, (c) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' })[c] || c).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const handleTitleChange = (val: string) => { setTitle(val); if (isNew) { const s = titleToSlug(val); setSlug(s); setPath(`/${s}`); } };

  const invalidatePages = () => { qc.invalidateQueries({ queryKey: ['pageTree'] }); qc.invalidateQueries({ queryKey: ['pages'] }); };
  const invalidateAll = () => { qc.invalidateQueries({ queryKey: ['page', id] }); invalidatePages(); };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = { title, slug, path, page_type: pageType, parent_id: parentId, collection_key: collectionKey || null, seo, sections: sectionEditor.sections };
      return isNew ? (await api.post('/api/pages', body)).data : (await api.put(`/api/pages/${id}`, body)).data;
    },
    onSuccess: (data) => { invalidatePages(); sectionEditor.reset(sectionEditor.sections); if (isNew) navigate(`/pages/${data.id}`, { replace: true }); },
  });
  const statusMutation = useMutation({
    mutationFn: async ({ status, publishedAt }: { status: string; publishedAt?: string | null }) => (await api.put(`/api/pages/${id}`, { status, published_at: publishedAt })).data,
    onSuccess: invalidateAll,
  });
  const archiveMutation = useMutation({
    mutationFn: async () => (await api.put(`/api/pages/${id}`, { status: 'archived' })).data,
    onSuccess: () => { invalidateAll(); navigate('/'); },
  });
  const duplicateMutation = useMutation({
    mutationFn: async ({ dupTitle, dupSlug }: { dupTitle: string; dupSlug: string }) => (await api.post('/api/pages', { title: dupTitle, slug: dupSlug, path: `/${dupSlug}`, page_type: pageType, parent_id: parentId, collection_key: collectionKey || null, seo, sections: sectionEditor.sections, status: 'draft', sort_order: (page?.sort_order ?? 0) + 1 })).data,
    onSuccess: (data) => { invalidatePages(); setShowDuplicateDialog(false); navigate(`/pages/${data.id}`); },
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === 's') { e.preventDefault(); saveMutation.mutate(); }
    const el = document.activeElement;
    const editing = el instanceof HTMLElement && (el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
    if (mod && e.key === 'z' && !e.shiftKey && !editing) { e.preventDefault(); sectionEditor.undo(); }
    if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey)) && !editing) { e.preventDefault(); sectionEditor.redo(); }
    if (mod && e.key === 'p') { e.preventDefault(); togglePreview(); }
    if (mod && e.key === '\\') { e.preventDefault(); setSidebarOpen((v) => { const n = !v; localStorage.setItem(SIDEBAR_KEY, String(n)); return n; }); }
  }, [saveMutation, togglePreview]);

  useEffect(() => { window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [handleKeyDown]);
  useEffect(() => { if (!sectionEditor.isDirty) return; const h = (e: BeforeUnloadEvent) => { e.preventDefault(); }; window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h); }, [sectionEditor.isDirty]);

  const toggleSidebar = () => setSidebarOpen((v) => { const n = !v; localStorage.setItem(SIDEBAR_KEY, String(n)); return n; });

  const handleSelectBlock = (sectionId: string, columnId: string, blockId: string) => {
    const fb = sectionEditor.flatBlocks; const idx = fb.findIndex((f) => f.block.id === blockId);
    if (!fb[idx]) return;
    setSelectedBlock({ sectionId, columnId, blockId, block: fb[idx].block, index: idx, total: fb.length });
  };

  const handlePreviewBlockClick = (blockId: string, sectionId: string) => {
    for (const sec of sectionEditor.sections) { if (sec.id !== sectionId) continue; for (const col of sec.columns) { if (col.blocks.find((b) => b.id === blockId)) { handleSelectBlock(sectionId, col.id, blockId); setTimeout(() => document.querySelector(`[data-editor-block-id="${blockId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); return; } } }
  };

  const tabs: { key: typeof activeTab; label: string; hint?: string }[] = [
    { key: 'content', label: t('content:tab_content'), hint: t('content:tab_content_hint') },
    { key: 'layout', label: t('content:tab_layout'), hint: t('content:tab_layout_hint') },
    { key: 'seo', label: t('content:tab_seo'), hint: t('content:tab_seo_hint') },
    { key: 'settings', label: t('content:tab_settings'), hint: t('content:tab_settings_hint') },
    ...(linkedKey ? [{ key: 'collection' as const, label: t('content:data_label', { label: linkedSchema?.label || linkedKey }) }] : []),
  ];

  const showLayoutPreview = previewOpen && activeTab === 'layout';

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-[var(--bg)]">
        <div className="flex items-center gap-2">
          <input value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder={t('content:page_title_placeholder')} className="text-lg font-semibold bg-transparent border-none outline-none placeholder:text-gray-300 w-64" />
          {path && <button onClick={() => { navigator.clipboard.writeText(path); setSlugCopied(true); setTimeout(() => setSlugCopied(false), 1500); }} className="p-1 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors" title={t('content:copy_path', { path })}>{slugCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}</button>}
        </div>
        <button onClick={togglePreview} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${previewOpen ? 'bg-[var(--primary)] border-[var(--primary)] text-white' : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-gray-50'}`} title={previewOpen ? t('content:live_preview_hide') : t('content:live_preview_show')}>
          {previewOpen ? <EyeOff size={14} /> : <Eye size={14} />} {t('content:live_preview')}
        </button>
      </div>
      <div className="flex gap-0 bg-[var(--bg)] px-6 border-b border-gray-200">
        {tabs.map((tab) => <button key={tab.key} onClick={() => setActiveTab(tab.key)} title={tab.hint} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'}`}>{tab.label}</button>)}
      </div>
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'layout' && <div className="w-56 shrink-0 bg-[var(--bg)] p-3 pr-0 overflow-auto"><div className="bg-white rounded-lg shadow-sm sticky top-0"><StructureTree editor={sectionEditor} selectedBlockId={selectedBlock?.blockId ?? null} onSelectBlock={handleSelectBlock} /></div></div>}
        <div ref={contentAreaRef} onClick={(e) => { if (!(e.target as HTMLElement).closest('[data-block-id]')) setSelectedBlock(null); }} className={`overflow-auto bg-[var(--bg)] p-8 flex-1 ${previewOpen && activeTab === 'content' ? 'w-1/2 min-w-[400px]' : ''} transition-[margin] duration-300`} style={showLayoutPreview ? { marginRight: previewWidth + 16 } : undefined}>
          {activeTab === 'content' && <PageContentTab editor={sectionEditor} previewOpen={previewOpen} selectedBlockId={selectedBlock?.blockId} onSelectBlock={handleSelectBlock} />}
          {activeTab === 'layout' && <div className="w-full"><SectionList editor={sectionEditor} mode="layout" selectedBlockId={selectedBlock?.blockId} onSelectBlock={handleSelectBlock} /></div>}
          {activeTab === 'seo' && <PageSeoTab seo={seo} onSeoChange={setSeo} pageTitle={title} pagePath={page?.path} />}
          {activeTab === 'settings' && <PageSettingsTab path={path} onPathChange={(p, s) => { setPath(p); setSlug(s); }} parentId={parentId} onParentIdChange={setParentId} pageType={pageType} onPageTypeChange={setPageType} collectionKey={collectionKey} onCollectionKeyChange={setCollectionKey} allPages={allPages} currentPageId={page?.id} collections={collections} tenantDomain={tenant?.domain} />}
          {activeTab === 'collection' && linkedKey && <PageCollectionTab linkedKey={linkedKey} linkedSchema={linkedSchema} linkedItems={linkedItems} colEditItem={colEditItem} colShowForm={colShowForm} setColEditItem={setColEditItem} setColShowForm={setColShowForm} colDeleteMutation={colDeleteMutation} refetchLinkedItems={refetchLinkedItems} />}
        </div>
        {previewOpen && activeTab === 'content' && <div className="w-1/2 min-w-[350px] flex flex-col"><PreviewPanel pageId={page?.id} sections={sectionEditor.sections} title={title} selectedBlockId={selectedBlock?.blockId} onBlockClick={handlePreviewBlockClick} /></div>}
        <PropertiesSidebar open={sidebarOpen} onToggle={toggleSidebar} canUndo={sectionEditor.canUndo} canRedo={sectionEditor.canRedo} onUndo={sectionEditor.undo} onRedo={sectionEditor.redo} currentSections={sectionEditor.sections} page={page} isNew={isNew} onStatusChange={(st, pa) => statusMutation.mutate({ status: st, publishedAt: pa })} onDelete={() => archiveMutation.mutate()} onDuplicate={() => setShowDuplicateDialog(true)} onSave={() => saveMutation.mutate()} isSaving={saveMutation.isPending} isDirty={sectionEditor.isDirty} selectedBlock={selectedBlock} onSelectBlock={handleSelectBlock} onVersionRestored={async () => { const r = await api.get(`/api/pages/${id}`); const p = r.data as Page; setTitle(p.title); setSlug(p.slug); setPath(p.path); setSeo({ title: p.seo?.title || '', description: p.seo?.description || '' }); sectionEditor.reset(p.sections || []); qc.invalidateQueries({ queryKey: ['pageTree'] }); }} />
      </div>
      {activeTab === 'layout' && (
        <div className="fixed top-0 right-0 h-full flex z-50 pointer-events-none" style={{ width: previewWidth + 40 }}>
          <div className={`w-full h-full flex transition-transform duration-300 ease-in-out ${showLayoutPreview ? 'pointer-events-auto' : 'pointer-events-none'}`} style={{ transform: showLayoutPreview ? 'translateX(0)' : `translateX(${previewWidth + 40}px)` }}>
            <div className="shrink-0 flex flex-col items-center">
              <button onClick={togglePreview} className={`w-8 py-3 mt-20 -ml-8 bg-white rounded-l-lg shadow-[-4px_2px_8px_rgba(0,0,0,0.08)] flex items-center justify-center hover:bg-gray-50 transition-all duration-300 ${previewOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`} title={t('content:live_preview_close')}><PanelRightClose size={14} className="text-[var(--text-muted)]" /></button>
            </div>
            <div onMouseDown={handleResizeStart} className="w-1.5 shrink-0 cursor-col-resize hover:bg-blue-200 active:bg-blue-300 transition-colors flex items-center justify-center group" title={t('content:adjust_width')}><GripVertical size={10} className="text-gray-300 group-hover:text-blue-500 transition-colors" /></div>
            <div className="flex-1 bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.12)] flex flex-col min-w-0"><PreviewPanel pageId={page?.id} sections={sectionEditor.sections} title={title} selectedBlockId={selectedBlock?.blockId} onBlockClick={handlePreviewBlockClick} /></div>
          </div>
        </div>
      )}
      <DuplicateDialog title={title} slug={slug} open={showDuplicateDialog} onClose={() => setShowDuplicateDialog(false)} onConfirm={(dt, ds) => duplicateMutation.mutate({ dupTitle: dt, dupSlug: ds })} />
    </div>
  );
}
