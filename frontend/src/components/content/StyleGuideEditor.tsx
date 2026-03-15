import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, RotateCcw } from 'lucide-react';
import api from '@/lib/api';

interface Props {
  onClose: () => void;
}

const DEFAULT_GUIDE = `Ton: direkt, konkret, technisch fundiert, keine Marketing-Floskeln
Satzlänge: maximal 20 Wörter, kurze Absätze
Ansprache: Du-Form, wie ein erfahrener Berater
Verboten: revolutionär, einzigartig, gamechanger, maßgeschneidert, innovativ, ganzheitlich, nachhaltig, state-of-the-art, Synergien
Bevorzugt: konkrete Zahlen, Beispiele, Verben statt Adjektive
Struktur: Hook → Problem → Lösung → CTA`;

export default function StyleGuideEditor({ onClose }: Props) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['style-guide'],
    queryFn: async () => (await api.get('/api/content-templates/style-guide')).data,
  });
  const [text, setText] = useState<string | null>(null);
  const current = text ?? data?.style_guide ?? DEFAULT_GUIDE;

  const saveMutation = useMutation({
    mutationFn: async () => (await api.put('/api/content-templates/style-guide', { style_guide: current })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['style-guide'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Style-Guide</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"><X size={18} /></button>
        </div>
        <p className="text-xs text-gray-500">Definiere Ton, Regeln und verbotene Wörter für die KI-Generierung.</p>
        <textarea
          value={current}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white font-mono resize-y"
        />
        <div className="flex justify-between">
          <button onClick={() => setText(DEFAULT_GUIDE)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 cursor-pointer">
            <RotateCcw size={12} /> Zurücksetzen
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">Abbrechen</button>
            <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
              className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
              {saveMutation.isPending ? 'Speichere...' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
