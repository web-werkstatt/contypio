import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe } from 'lucide-react';
import api from '@/lib/api';
import type { ImportStep, PageScrapeResult, CmsPage, ImportSummary, ScrapeResult } from '@/components/importer/types';
import ImportWizardStepper from '@/components/importer/ImportWizardStepper';
import ImportSummaryPanel from '@/components/importer/ImportSummaryPanel';
import StepSource from '@/components/importer/StepSource';
import StepAnalysis from '@/components/importer/StepAnalysis';
import StepMapping from '@/components/importer/StepMapping';
import StepPreview from '@/components/importer/StepPreview';
import StepImport from '@/components/importer/StepImport';
import StepResult from '@/components/importer/StepResult';

export default function WebsiteImporterPage() {
  const [step, setStep] = useState<ImportStep>('source');
  const [completedSteps, setCompletedSteps] = useState<Set<ImportStep>>(new Set());
  const [sourceUrl, setSourceUrl] = useState('https://preview.ir-tours.de');
  const [pageResults, setPageResults] = useState<Record<string, PageScrapeResult>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<Record<string, 'pending' | 'importing' | 'done' | 'error'>>({});

  const { data: cmsPages = [] } = useQuery<CmsPage[]>({
    queryKey: ['pages-list'],
    queryFn: async () => {
      const res = await api.get('/api/pages');
      return res.data?.data || res.data || [];
    },
  });

  const goToStep = useCallback((target: ImportStep) => {
    setStep(target);
  }, []);

  const completeAndGo = useCallback((current: ImportStep, next: ImportStep) => {
    setCompletedSteps((prev) => new Set([...prev, current]));
    setStep(next);
  }, []);

  // --- Analyse ---
  const startAnalysis = useCallback(async (paths: string[]) => {
    setIsAnalyzing(true);
    for (const path of paths) {
      setPageResults((prev) => ({ ...prev, [path]: { path, result: null, status: 'scraping' } }));
      try {
        const url = `${sourceUrl.replace(/\/$/, '')}${path === '/' ? '' : path}`;
        const res = await api.post('/api/website-import/scrape', { url });
        const result = res.data as ScrapeResult;
        setPageResults((prev) => ({ ...prev, [path]: { path, result, status: 'done' } }));
      } catch (err: unknown) {
        const detail =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
          || (err as { message?: string })?.message
          || 'Unbekannter Fehler';
        setPageResults((prev) => ({ ...prev, [path]: { path, result: null, status: 'error', error: detail } }));
      }
    }
    setIsAnalyzing(false);
  }, [sourceUrl]);

  // --- Mapping ---
  const updateMapping = useCallback((path: string, blockId: string, newType: string) => {
    setPageResults((prev) => {
      const pr = prev[path];
      if (!pr) return prev;
      return {
        ...prev,
        [path]: { ...pr, mappingOverrides: { ...(pr.mappingOverrides || {}), [blockId]: newType } },
      };
    });
  }, []);

  // --- Import ---
  const startImport = useCallback(async () => {
    setIsImporting(true);
    const donePaths = Object.entries(pageResults).filter(([, r]) => r.status === 'done' && r.result);
    const progress: Record<string, 'pending' | 'importing' | 'done' | 'error'> = {};
    donePaths.forEach(([path]) => { progress[path] = 'pending'; });
    setImportProgress({ ...progress });

    for (const [path, pr] of donePaths) {
      const cmsPage = cmsPages.find((p) => p.path === path);
      if (!cmsPage || !pr.result) {
        progress[path] = 'error';
        setImportProgress({ ...progress });
        continue;
      }
      progress[path] = 'importing';
      setImportProgress({ ...progress });
      try {
        await api.put(`/api/pages/${cmsPage.id}`, { sections: pr.result.sections });
        progress[path] = 'done';
        setPageResults((prev) => ({ ...prev, [path]: { ...prev[path], imported: true } }));
      } catch {
        progress[path] = 'error';
      }
      setImportProgress({ ...progress });
    }
    setIsImporting(false);
  }, [pageResults, cmsPages]);

  // --- Summary berechnen ---
  const summary: ImportSummary = (() => {
    const done = Object.values(pageResults).filter((r) => r.status === 'done' && r.result);
    const blockCounts: Record<string, number> = {};
    let totalSections = 0;
    let totalBlocks = 0;
    const warnings: string[] = [];

    for (const pr of done) {
      if (!pr.result) continue;
      totalSections += pr.result.section_count;
      totalBlocks += pr.result.block_count;
      for (const [bt, c] of Object.entries(pr.result.block_counts)) {
        blockCounts[bt] = (blockCounts[bt] || 0) + c;
      }
    }

    const noCmsPages = Object.keys(pageResults).filter((p) => !cmsPages.find((cp) => cp.path === p));
    if (noCmsPages.length > 0) {
      warnings.push(`${noCmsPages.length} Seite(n) nicht im CMS: ${noCmsPages.join(', ')}`);
    }

    return {
      totalPages: Object.keys(pageResults).length,
      scrapedPages: done.length,
      totalSections,
      totalBlocks,
      blockCounts,
      warnings,
      importedPages: Object.values(pageResults).filter((r) => r.imported).length,
    };
  })();

  const restart = () => {
    setStep('source');
    setCompletedSteps(new Set());
    setPageResults({});
    setImportProgress({});
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--border)]">
        <Globe size={20} className="text-[var(--primary)]" />
        <div>
          <h1 className="text-base font-semibold">Astro Import</h1>
          <p className="text-xs text-[var(--text-muted)]">
            Analysiere und überführe Inhalte aus einer Astro-Website in dein CMS
          </p>
        </div>
      </div>

      {/* Wizard Layout: Stepper | Main | Summary */}
      <div className="flex flex-1 overflow-hidden">
        {/* Stepper links */}
        <div className="w-48 shrink-0 border-r border-[var(--border)] p-4 bg-gray-50/50">
          <ImportWizardStepper currentStep={step} completedSteps={completedSteps} onStepClick={goToStep} />
        </div>

        {/* Hauptbereich */}
        <div className="flex-1 overflow-auto p-6">
          {step === 'source' && (
            <StepSource sourceUrl={sourceUrl} onSourceUrlChange={setSourceUrl} onNext={() => completeAndGo('source', 'analysis')} />
          )}
          {step === 'analysis' && (
            <StepAnalysis
              pageResults={pageResults}
              isAnalyzing={isAnalyzing}
              onStartAnalysis={startAnalysis}
              onNext={() => completeAndGo('analysis', 'preview')}
            />
          )}
          {step === 'mapping' && (
            <StepMapping pageResults={pageResults} onUpdateMapping={updateMapping} onNext={() => completeAndGo('mapping', 'preview')} />
          )}
          {step === 'preview' && (
            <StepPreview pageResults={pageResults} onNext={() => completeAndGo('preview', 'import')} />
          )}
          {step === 'import' && (
            <StepImport
              pageResults={pageResults}
              cmsPages={cmsPages}
              isImporting={isImporting}
              importProgress={importProgress}
              onStartImport={startImport}
              onNext={() => completeAndGo('import', 'result')}
            />
          )}
          {step === 'result' && (
            <StepResult summary={summary} pageResults={pageResults} onRestart={restart} />
          )}
        </div>

        {/* Summary rechts */}
        {summary.scrapedPages > 0 && (
          <div className="w-52 shrink-0 border-l border-[var(--border)] p-4 bg-gray-50/50 overflow-auto">
            <ImportSummaryPanel summary={summary} />
          </div>
        )}
      </div>
    </div>
  );
}
