import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Settings, Copy, Check, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import QualityScore from './QualityScore';
import StyleGuideEditor from './StyleGuideEditor';

interface GenerateResult {
  variants: {
    content: string;
    model: string;
    tokens_used: number;
    temperature: number;
    quality_score: {
      scores: { readability: number; sentences: number; paragraphs: number; buzzwords: number; channel_fit: number; overall: number };
      metrics: Record<string, unknown>;
      recommendation: string;
    };
  }[];
  style_guide_used: boolean;
}

interface WizardProps {
  services: Record<string, string>;
  channels: Record<string, string>;
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
      className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-gray-50 cursor-pointer">
      {ok ? <><Check size={12} className="inline mr-1" />Kopiert</> : <><Copy size={12} className="inline mr-1" />Kopieren</>}
    </button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition-colors cursor-pointer ${
        active ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-transparent text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--text)]'
      }`}>
      {label}
    </button>
  );
}

export default function GenerateWizard({ services, channels }: WizardProps) {
  const [step, setStep] = useState(0);
  const [service, setService] = useState('webdesign');
  const [channel, setChannel] = useState('linkedin');
  const [keywords, setKeywords] = useState('');
  const [audience, setAudience] = useState('');
  const [notes, setNotes] = useState('');
  const [numVariants, setNumVariants] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [saveTitle, setSaveTitle] = useState('');
  const [showStyleGuide, setShowStyleGuide] = useState(false);
  const queryClient = useQueryClient();

  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn: async () => (await api.get('/api/ai/status')).data,
  });

  const generateMutation = useMutation({
    mutationFn: async (params: { refine_instruction?: string }) =>
      (await api.post('/api/content-templates/generate', {
        service, channel, keywords, target_audience: audience, notes,
        num_variants: numVariants, refine_instruction: params.refine_instruction || '',
      })).data as GenerateResult,
    onSuccess: () => setStep(2),
    onError: () => setStep(0),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const v = generateMutation.data?.variants[selectedVariant];
      if (!v) return;
      return (await api.post('/api/content-templates', {
        service_key: service,
        service_name: services[service] || service,
        channel,
        title: saveTitle || `${services[service]} - ${channels[channel]}`,
        content: v.content,
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-templates'] });
      setStep(0);
      setSaveTitle('');
    },
  });

  const handleGenerate = () => {
    setStep(1);
    generateMutation.mutate({});
  };

  const handleRefine = (instruction: string) => {
    setStep(1);
    generateMutation.mutate({ refine_instruction: instruction });
  };

  const aiConfigured = aiStatus?.configured !== false;

  if (!aiConfigured) {
    return (
      <div className="text-center py-12 text-[var(--text-muted)]">
        <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
        <p className="font-medium">KI nicht konfiguriert</p>
        <p className="text-sm mt-1">Bitte AI_ENDPOINT_URL in den Umgebungsvariablen setzen.</p>
      </div>
    );
  }

  const STEPS = ['Briefing', 'Generierung', 'Ergebnis', 'Speichern'];
  const inputClass = 'w-full border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-white';

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
              i <= step ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-[var(--text-muted)]'
            }`}>{i + 1}</div>
            <span className={`text-xs hidden sm:inline ${i <= step ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>{s}</span>
            {i < 3 && <div className={`w-6 h-0.5 ${i < step ? 'bg-[var(--primary)]' : 'bg-gray-200'}`} />}
          </div>
        ))}
        <div className="flex-1" />
        <button onClick={() => setShowStyleGuide(true)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer" title="Style-Guide">
          <Settings size={16} />
        </button>
      </div>

      {/* Step 1: Briefing */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest mb-2">Service</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(services).map(([k, v]) => (
                <Chip key={k} label={v} active={service === k} onClick={() => setService(k)} />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest mb-2">Kanal</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(channels).map(([k, v]) => (
                <Chip key={k} label={v} active={channel === k} onClick={() => setChannel(k)} />
              ))}
            </div>
          </div>
          <input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Keywords (z.B. KMU Website Österreich)" className={inputClass} />
          <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Zielgruppe (z.B. Geschäftsführer kleiner Unternehmen)" className={inputClass} />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Zusätzliche Hinweise..." rows={3} className={`${inputClass} resize-y`} />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
              <input type="checkbox" checked={numVariants > 1} onChange={(e) => setNumVariants(e.target.checked ? 2 : 1)}
                className="rounded border-gray-300" />
              2 Varianten generieren
            </label>
            <button onClick={handleGenerate} className="flex items-center gap-2 px-5 py-2 bg-[var(--primary)] text-white text-sm rounded-lg hover:opacity-90 cursor-pointer">
              <Sparkles size={14} /> Text generieren
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Generating */}
      {step === 1 && (
        <div className="text-center py-16">
          <Loader2 size={32} className="mx-auto mb-4 animate-spin text-[var(--primary)]" />
          <p className="text-sm text-[var(--text)]">Generiere {numVariants > 1 ? `${numVariants} Varianten` : 'Text'}...</p>
          <p className="text-xs text-[var(--text-muted)] mt-2">Dein Style-Guide wird angewendet</p>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 2 && generateMutation.data && (
        <div className="space-y-4">
          {generateMutation.data.variants.map((v, i) => (
            <div key={i} className={`border rounded-xl p-4 transition-colors cursor-pointer ${
              selectedVariant === i ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'border-[var(--border)] hover:border-[var(--text-muted)]'
            }`} onClick={() => setSelectedVariant(i)}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  Variante {i + 1} · {v.model} · T={v.temperature}
                </span>
                <CopyBtn text={v.content} />
              </div>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed mb-3">{v.content}</pre>
              <QualityScore scores={v.quality_score.scores} metrics={v.quality_score.metrics as never} recommendation={v.quality_score.recommendation} compact />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleRefine('Kürze den Text um 30%')}
              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-gray-50 cursor-pointer">Kürzer</button>
            <button onClick={() => handleRefine('Ersetze allgemeine Aussagen durch konkrete Beispiele und Zahlen')}
              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-gray-50 cursor-pointer">Konkreter</button>
            <button onClick={() => handleRefine('Stärke den Call-to-Action, mache ihn spezifischer')}
              className="px-3 py-1.5 text-xs border border-[var(--border)] rounded-lg hover:bg-gray-50 cursor-pointer">Mehr CTA</button>
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(0)} className="flex items-center gap-1 px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">
              <ArrowLeft size={14} /> Neues Briefing
            </button>
            <button onClick={() => setStep(3)} className="flex items-center gap-1 px-5 py-2 bg-[var(--primary)] text-white text-sm rounded-lg hover:opacity-90 cursor-pointer">
              Weiter <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Save */}
      {step === 3 && generateMutation.data && (
        <div className="space-y-4">
          <div className="border border-[var(--border)] rounded-xl p-4">
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed line-clamp-6 mb-2">
              {generateMutation.data.variants[selectedVariant]?.content}
            </pre>
            <QualityScore
              scores={generateMutation.data.variants[selectedVariant]?.quality_score.scores}
              metrics={generateMutation.data.variants[selectedVariant]?.quality_score.metrics as never}
              recommendation={generateMutation.data.variants[selectedVariant]?.quality_score.recommendation}
              compact
            />
          </div>
          <input value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)}
            placeholder="Titel für die Vorlage (optional)" className={inputClass} />
          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="flex items-center gap-1 px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer">
              <ArrowLeft size={14} /> Zurück
            </button>
            <div className="flex gap-2">
              <button onClick={() => {
                navigator.clipboard.writeText(generateMutation.data!.variants[selectedVariant]?.content || '');
                setStep(0);
              }} className="px-4 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-gray-50 cursor-pointer">
                Direkt verwenden
              </button>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                className="px-5 py-2 bg-[var(--primary)] text-white text-sm rounded-lg hover:opacity-90 disabled:opacity-50 cursor-pointer">
                {saveMutation.isPending ? 'Speichere...' : 'Als Vorlage speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStyleGuide && <StyleGuideEditor onClose={() => setShowStyleGuide(false)} />}
    </div>
  );
}
