import { useEffect, useState } from 'react';
import type { MedicalGuidance } from '../engine/medicalAssistant';
import { aegisEngine } from '../engine/aegisEngine';

const SEVERITY_STYLES: Record<string, string> = {
  emergency: 'bg-red-500/20 text-red-300 border border-red-500/40',
  critical: 'bg-red-500/20 text-red-300 border border-red-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  info: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
};

export default function ActionProtocol() {
  const [guidance, setGuidance] = useState<MedicalGuidance | null>(null);

  useEffect(() => {
    const refresh = () => setGuidance(aegisEngine.getMedicalGuidance());
    const unsubscribe = aegisEngine.subscribe(refresh);
    refresh();
    return () => { unsubscribe(); };
  }, []);

  if (!guidance) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <span className="text-2xl">▸</span>
          Asistente Médico Autónomo
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-slate-400">Sin guías activas</p>
          <p className="text-xs text-slate-600 mt-2">
            El triage se activa automáticamente ante hallazgos críticos, eventos de radiación o deterioro conductual
          </p>
        </div>
      </div>
    );
  }

  const offlineSteps = guidance.steps.filter(s => !s.needsCommunication).length;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <span className="text-2xl">‌+</span>
            {guidance.title}
          </h3>
          <p className="text-sm text-slate-400 mt-1">{guidance.trigger}</p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${SEVERITY_STYLES[guidance.severity]}`}>
            Prioridad {guidance.priority}
          </div>
          <span className="text-[10px] text-slate-500">Pasos offline: {offlineSteps}/{guidance.steps.length}</span>
        </div>
      </div>

      {guidance.findings.length > 0 && (
        <div className="mb-4 rounded-xl bg-slate-800/30 border border-slate-700 p-3">
          <p className="text-xs font-semibold text-slate-300 mb-1">Hallazgos considerados por el triage</p>
          <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">
            {guidance.findings.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {guidance.steps.map((step, index) => (
          <div key={step.n} className="relative">
            {index < guidance.steps.length - 1 && (
              <div className="absolute left-5 top-12 w-0.5 h-6 bg-slate-700" />
            )}
            <div className="flex gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                step.needsCommunication
                  ? 'bg-amber-500/20 border-amber-500/40'
                  : 'bg-indigo-500/20 border-indigo-500/40'
              }`}>
                <span className={`text-sm font-bold ${step.needsCommunication ? 'text-amber-300' : 'text-indigo-300'}`}>{step.n}</span>
              </div>
              <div className="flex-1 pb-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h4 className="text-sm font-semibold text-slate-200">{step.action}</h4>
                    <div className="flex items-center gap-2 text-xs">
                      {step.needsCommunication && (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          ⇄ enlace Tierra
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300">{step.role}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">{step.deadline}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{step.detail}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <p className="text-xs font-semibold text-slate-300 mb-1">Sin enlace con Tierra</p>
        <p className="text-xs text-slate-400 leading-relaxed">{guidance.offlineRecommendation}</p>
      </div>

      <div className="mt-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
        <p className="text-xs text-indigo-300">
          <span className="font-medium">Clasificación del dato: RECOMENDADO.</span> {guidance.disclaimer}
        </p>
      </div>
    </div>
  );
}
