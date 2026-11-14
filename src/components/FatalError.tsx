import { useState } from 'react';
import type { ErrorInfo } from 'react';

const panelStyle = {
  width: '100%',
  maxWidth: '40rem',
  borderRadius: '1rem',
  border: '1px solid rgba(51, 65, 85, 0.8)',
  backgroundColor: 'rgba(15, 23, 42, 0.92)',
  padding: '1.5rem',
  boxShadow: '0 24px 80px rgba(2, 6, 23, 0.65)',
} as const;

const primaryButton = {
  borderRadius: '0.5rem',
  border: '1px solid rgba(34, 211, 238, 0.4)',
  backgroundColor: 'rgba(6, 182, 212, 0.14)',
  padding: '0.5rem 0.85rem',
  color: '#a5f3fc',
  fontSize: '0.75rem',
  cursor: 'pointer',
} as const;

const secondaryButton = {
  ...primaryButton,
  border: '1px solid rgba(148, 163, 184, 0.35)',
  backgroundColor: 'rgba(30, 41, 59, 0.6)',
  color: '#cbd5e1',
} as const;

function resetAegisData() {
  try {
    const keys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith('aegis_')) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    // storage may be unavailable; reloading is still safe
  }
  window.location.reload();
}

interface Props {
  error: Error;
  info: ErrorInfo | null;
}

export default function FatalError({ error, info }: Props) {
  const [copied, setCopied] = useState(false);
  const details = [error.message, error.stack, info?.componentStack]
    .filter((part): part is string => Boolean(part))
    .join('\n\n');

  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be blocked; the details are still visible below
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundColor: '#020617',
        color: '#cbd5e1',
        fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={panelStyle} role="alert">
        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#ffffff' }}>
          A.E.G.I.S. no pudo iniciar
        </p>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', lineHeight: 1.5, color: '#94a3b8' }}>
          Se produjo un error al cargar la interfaz. Puedes restablecer los datos locales o recargar la página.
        </p>
        <p
          style={{
            margin: '0.85rem 0 0',
            borderLeft: '3px solid rgba(248, 113, 113, 0.65)',
            paddingLeft: '0.65rem',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: '0.72rem',
            lineHeight: 1.6,
            color: '#fca5a5',
            overflowWrap: 'anywhere',
          }}
        >
          {error.message || 'Error desconocido'}
        </p>
        <details style={{ marginTop: '0.85rem' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: '#67e8f9' }}>
            Ver detalles técnicos
          </summary>
          <pre
            style={{
              maxHeight: '11rem',
              overflow: 'auto',
              marginTop: '0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(2, 6, 23, 0.9)',
              padding: '0.75rem',
              fontSize: '0.66rem',
              lineHeight: 1.5,
              color: '#94a3b8',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
            }}
          >
            {details}
          </pre>
        </details>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
          <button type="button" onClick={() => window.location.reload()} style={primaryButton}>
            Recargar
          </button>
          <button type="button" onClick={resetAegisData} style={secondaryButton}>
            Restablecer datos y recargar
          </button>
          <button type="button" onClick={copyDetails} style={secondaryButton}>
            {copied ? 'Copiado' : 'Copiar detalles'}
          </button>
        </div>
      </div>
    </div>
  );
}
