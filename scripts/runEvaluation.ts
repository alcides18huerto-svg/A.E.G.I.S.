import { runEvaluation } from '../src/engine/evaluation';

const report = runEvaluation();
console.log('=== A.E.G.I.S. Evaluation Report (Fase 5) ===');
console.log('Nota:', report.note);
console.log(
  'Aggregate:',
  `TP=${report.aggregate.tp} FP=${report.aggregate.fp} TN=${report.aggregate.tn} FN=${report.aggregate.fn}`,
  `Sens=${report.aggregate.sensitivity.toFixed(3)}`,
  `Spec=${report.aggregate.specificity.toFixed(3)}`,
  `Prec=${report.aggregate.precision.toFixed(3)}`,
  `F1=${report.aggregate.f1.toFixed(3)}`,
  `FR/h=${report.aggregate.falseAlertsPerHour.toFixed(2)}`,
  `AUROC=${report.aggregate.auroc.toFixed(3)}`
);
for (const [crew, m] of Object.entries(report.perCrew)) {
  console.log(`${crew}: sens=${m.sensitivity.toFixed(2)} spec=${m.specificity.toFixed(2)} prec=${m.precision.toFixed(2)} f1=${m.f1.toFixed(2)} auroc=${m.auroc.toFixed(2)}`);
}
