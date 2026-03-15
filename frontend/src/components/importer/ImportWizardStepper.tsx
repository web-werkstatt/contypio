import { CheckCircle } from 'lucide-react';
import { STEPS, type ImportStep } from './types';

interface Props {
  currentStep: ImportStep;
  completedSteps: Set<ImportStep>;
  onStepClick(step: ImportStep): void;
}

export default function ImportWizardStepper({ currentStep, completedSteps, onStepClick }: Props) {
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="space-y-1">
      <h2 className="text-sm font-semibold mb-3 px-1">Astro Import</h2>
      {STEPS.map((step, idx) => {
        const isActive = step.key === currentStep;
        const isDone = completedSteps.has(step.key);
        const isOptional = step.optional;
        // Optionale Schritte sind anklickbar sobald der vorherige Schritt erledigt ist
        const isClickable = isDone || idx <= currentIdx || (isOptional && completedSteps.has('analysis'));

        return (
          <button
            key={step.key}
            onClick={() => isClickable && onStepClick(step.key)}
            disabled={!isClickable}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
              isActive
                ? 'bg-[var(--primary-light)] text-[var(--primary)] font-medium'
                : isDone
                  ? 'text-[var(--text)] hover:bg-gray-100'
                  : isClickable && isOptional
                    ? 'text-[var(--text-muted)] hover:bg-gray-100 cursor-pointer'
                    : 'text-[var(--text-muted)] opacity-50 cursor-not-allowed'
            }`}
          >
            {isDone ? (
              <CheckCircle size={16} className="text-green-500 shrink-0" />
            ) : (
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  isActive
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-gray-200 text-[var(--text-muted)]'
                }`}
              >
                {step.number}
              </span>
            )}
            <span>
              {step.label}
              {isOptional && <span className="text-[10px] text-[var(--text-muted)] ml-1">(optional)</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
