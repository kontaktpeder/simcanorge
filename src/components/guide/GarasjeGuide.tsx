import Joyride, { CallBackProps, STATUS, EVENTS, Step } from 'react-joyride';
import { useGuide, GUIDE_STEPS, CURRENT_GUIDE_VERSION } from '@/hooks/useGuide';
import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Custom tooltip component
interface CustomTooltipProps {
  continuous: boolean;
  index: number;
  step: Step;
  backProps: any;
  closeProps: any;
  primaryProps: any;
  skipProps: any;
  tooltipProps: any;
  isLastStep: boolean;
  size: number;
}

function CustomTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
  size,
}: CustomTooltipProps) {
  return (
    <motion.div
      {...tooltipProps}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      className="bg-card border-2 border-primary rounded-xl shadow-2xl max-w-sm mx-4"
    >
      {/* Progress indicator */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: size }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === index ? 'bg-primary' : i < index ? 'bg-primary/40' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {index + 1} / {size}
        </span>
      </div>
      
      {/* Content */}
      <div className="p-4 pt-2">
        <h3 className="font-display text-lg text-foreground mb-2">
          {step.title}
        </h3>
        <p className="text-base text-muted-foreground leading-relaxed">
          {step.content}
        </p>
      </div>
      
      {/* Actions */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2">
        <button
          {...skipProps}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
        >
          Avslutt guide
        </button>
        
        <div className="flex gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-colors text-sm font-medium"
            >
              Tilbake
            </button>
          )}
          <button
            {...primaryProps}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            {isLastStep ? 'Fullfør' : 'Neste'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function GarasjeGuide() {
  const { 
    isGuideRunning, 
    currentStepIndex, 
    stopGuide, 
    completeGuide, 
    dismissGuide,
    navigateToStep,
  } = useGuide();
  
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(currentStepIndex);
  const [targetExists, setTargetExists] = useState(false);
  
  // Sync step index with context
  useEffect(() => {
    setStepIndex(currentStepIndex);
  }, [currentStepIndex]);
  
  // Check if target element exists
  useEffect(() => {
    if (!isGuideRunning) return;
    
    const checkTarget = () => {
      const step = GUIDE_STEPS[stepIndex];
      if (!step) return;
      
      const element = document.querySelector(step.target);
      setTargetExists(!!element);
    };
    
    // Check immediately and after a short delay (for elements that render after navigation)
    checkTarget();
    const timer = setTimeout(checkTarget, 500);
    
    return () => clearTimeout(timer);
  }, [isGuideRunning, stepIndex, location.pathname]);
  
  // Handle Joyride callbacks
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action, index, type } = data;
    
    // Handle completion
    if (status === STATUS.FINISHED) {
      completeGuide();
      return;
    }
    
    // Handle skip/close
    if (status === STATUS.SKIPPED || action === 'close') {
      dismissGuide();
      return;
    }
    
    // Handle step changes
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextIndex = action === 'prev' ? index - 1 : index + 1;
      
      if (nextIndex >= 0 && nextIndex < GUIDE_STEPS.length) {
        navigateToStep(nextIndex);
      }
    }
  }, [completeGuide, dismissGuide, navigateToStep]);
  
  // Convert our steps to Joyride format
  const joyrideSteps: Step[] = GUIDE_STEPS.map((step) => ({
    target: step.target,
    title: step.title,
    content: step.content,
    placement: step.placement || 'auto',
    disableBeacon: step.disableBeacon ?? true,
    spotlightClicks: step.spotlightClicks ?? false,
  }));
  
  if (!isGuideRunning) return null;
  
  return (
    <>
      <Joyride
        steps={joyrideSteps}
        stepIndex={stepIndex}
        run={isGuideRunning && targetExists}
        continuous
        showProgress
        showSkipButton
        hideCloseButton
        disableOverlayClose
        spotlightPadding={8}
        callback={handleJoyrideCallback}
        tooltipComponent={CustomTooltip}
        floaterProps={{
          disableAnimation: false,
        }}
        styles={{
          options: {
            zIndex: 10000,
            primaryColor: 'hsl(var(--primary))',
            overlayColor: 'rgba(0, 0, 0, 0.6)',
          },
          spotlight: {
            borderRadius: '12px',
          },
          overlay: {
            mixBlendMode: 'normal' as const,
          },
        }}
        locale={{
          back: 'Tilbake',
          close: 'Lukk',
          last: 'Fullfør',
          next: 'Neste',
          skip: 'Avslutt',
        }}
      />
      
      {/* Loading overlay when target doesn't exist */}
      <AnimatePresence>
        {isGuideRunning && !targetExists && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
          >
            <div className="bg-card rounded-xl p-6 shadow-2xl max-w-sm mx-4 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Navigerer...</p>
              <button
                onClick={() => dismissGuide()}
                className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Avbryt guide
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
