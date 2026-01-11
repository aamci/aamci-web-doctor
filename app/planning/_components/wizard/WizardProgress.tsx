'use client';

import { WizardProgressProps } from './types';

const STEP_LABELS: Record<number, string> = {
  1: 'Horaires',
  2: 'Récurrence',
  3: 'Options',
};

export default function WizardProgress({
  currentStep,
  totalSteps,
}: WizardProgressProps) {
  return (
    <div className="mb-6">
      {/* Progress circles */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(step => (
          <div key={step} className="flex items-center">
            {/* Circle */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step === currentStep
                  ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                  : step < currentStep
                    ? 'bg-teal-200 text-teal-700'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step}
            </div>

            {/* Connector line */}
            {step < totalSteps && (
              <div
                className={`w-8 sm:w-12 h-0.5 mx-1 transition-all ${
                  step < currentStep ? 'bg-teal-200' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step label */}
      <p className="text-center text-sm text-gray-600 mt-3 font-medium">
        Étape {currentStep}/{totalSteps} : {STEP_LABELS[currentStep]}
      </p>
    </div>
  );
}
