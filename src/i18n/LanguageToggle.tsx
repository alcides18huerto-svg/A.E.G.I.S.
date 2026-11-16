import { useI18n, type Lang } from './LanguageContext';

const OPTIONS: { id: Lang; label: string }[] = [
  { id: 'es', label: 'ES' },
  { id: 'en', label: 'EN' },
];

export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      className={`flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/70 p-1 ${className}`}
    >
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => setLang(option.id)}
          aria-pressed={lang === option.id}
          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            lang === option.id
              ? 'bg-sky-500/25 text-sky-200'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
