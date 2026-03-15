import { Instagram, Facebook, Youtube, ExternalLink } from 'lucide-react';

interface Props {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/ihr-profil', icon: <Instagram size={18} />, color: 'text-pink-500 bg-pink-50' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/ihre-seite', icon: <Facebook size={18} />, color: 'text-blue-600 bg-blue-50' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@ihr-kanal', icon: <Youtube size={18} />, color: 'text-red-500 bg-red-50' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@ihr-profil', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.41a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.84z"/></svg>, color: 'text-gray-900 bg-gray-100' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/ihr-profil', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, color: 'text-gray-900 bg-gray-100' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/ihre-firma', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-[18px] h-[18px]"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, color: 'text-blue-700 bg-blue-50' },
];

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.replace('www.', '') + u.pathname.replace(/\/$/, '');
  } catch {
    return null;
  }
}

export default function SocialMediaEditor({ data, onChange }: Props) {
  const handleChange = (key: string, value: string) => {
    onChange({ ...data, [key]: value || null });
  };

  return (
    <div className="bg-white border border-[var(--border)] rounded-xl shadow-sm overflow-hidden max-w-3xl">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-gray-50/50">
        <h2 className="text-sm font-semibold">Social Links</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Verknüpfe deine Social-Media-Profile. Diese werden im Footer und auf Kontaktseiten angezeigt.</p>
      </div>
      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
        {SOCIAL_FIELDS.map((field) => {
          const val = String(data[field.key] ?? '');
          const domain = val ? extractDomain(val) : null;
          return (
            <div key={field.key}>
              <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                <span className={`p-1.5 rounded-lg ${field.color}`}>{field.icon}</span>
                {field.label}
              </label>
              <input
                type="url"
                value={val}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2.5 text-sm border border-[var(--border)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-shadow"
              />
              {domain && (
                <a
                  href={val}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1 text-xs text-[var(--primary)] hover:underline"
                >
                  <ExternalLink size={10} />
                  {domain}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
