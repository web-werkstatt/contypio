import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
interface Scores {
  readability: number;
  sentences: number;
  paragraphs: number;
  buzzwords: number;
  channel_fit: number;
  overall: number;
}

interface Metrics {
  flesch_reading_ease: number;
  wiener_sachtextformel: number;
  avg_sentence_length: number;
  avg_paragraph_length: number;
  reading_time_seconds: number;
  word_count: number;
  char_count: number;
  buzzword_count: number;
  buzzwords_found: string[];
}

interface Props {
  scores: Scores;
  metrics?: Metrics;
  recommendation?: string;
  compact?: boolean;
}

const SCORE_LABELS: Record<string, string> = {
  readability: 'Lesbarkeit',
  sentences: 'Satzlänge',
  paragraphs: 'Absatzlänge',
  buzzwords: 'Buzzwords',
  channel_fit: 'Kanal-Konformität',
};

function scoreColor(score: number): string {
  if (score >= 4) return 'bg-[var(--success)]';
  if (score >= 3) return 'bg-[var(--warning)]';
  return 'bg-[var(--danger)]';
}

function scoreBadgeColor(score: number): string {
  if (score >= 4) return 'text-green-700 bg-green-100';
  if (score >= 3) return 'text-yellow-700 bg-yellow-100';
  return 'text-red-700 bg-red-100';
}

export default function QualityScore({ scores, metrics, recommendation, compact = false }: Props) {
  const [expanded, setExpanded] = useState(!compact);

  return (
    <div className="border border-[var(--border)] rounded-lg p-3">
      {/* Overall Score */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold ${scores.overall >= 4 ? 'text-green-600' : scores.overall >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
            {scores.overall}
          </span>
          <span className="text-sm text-[var(--text-muted)]">/ 5.0</span>
          {recommendation && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              recommendation === 'publish' ? 'bg-green-100 text-green-700' :
              recommendation === 'revise' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {recommendation === 'publish' ? 'Veröffentlichen' :
               recommendation === 'revise' ? 'Überarbeiten' : 'Neu schreiben'}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Detail Scores */}
      {expanded && (
        <div className="mt-3 space-y-2">
          {Object.entries(SCORE_LABELS).map(([key, label]) => {
            const score = scores[key as keyof Scores] as number;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)] w-28 shrink-0">{label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${scoreColor(score)}`}
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${scoreBadgeColor(score)}`}>
                  {score}
                </span>
              </div>
            );
          })}

          {/* Metrics */}
          {metrics && (
            <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[var(--text-muted)]">Flesch DE</span>
                <p className="font-medium">{metrics.flesch_reading_ease}</p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Wörter</span>
                <p className="font-medium">{metrics.word_count}</p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Lesezeit</span>
                <p className="font-medium">{Math.round(metrics.reading_time_seconds)}s</p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Zeichen</span>
                <p className="font-medium">{metrics.char_count}</p>
              </div>
            </div>
          )}

          {/* Buzzwords found */}
          {metrics && metrics.buzzwords_found.length > 0 && (
            <div className="mt-2 text-xs">
              <span className="text-[var(--danger)]">Floskeln: </span>
              <span className="text-[var(--text-muted)]">{metrics.buzzwords_found.join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
