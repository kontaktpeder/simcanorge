import Joyride, { CallBackProps, STATUS, EVENTS, Step } from 'react-joyride';
import { useGuide, GUIDE_STEPS } from '@/hooks/useGuide';
import { useEffect, useState, useCallback, useRef } from 'react';
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
    completeGuide, 
    dismissGuide,
    navigateToStep,
    nextStep,
    firstCarId,
  } = useGuide();
  
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(currentStepIndex);
  const [targetExists, setTargetExists] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const checkAttemptsRef = useRef(0);
  const maxCheckAttempts = 10;
  
  // Sync step index with context
  useEffect(() => {
    setStepIndex(currentStepIndex);
    checkAttemptsRef.current = 0;
    setIsNavigating(true);
  }, [currentStepIndex]);
  
  // Check if target element exists with retries
  useEffect(() => {
    if (!isGuideRunning) return;
    
    const checkTarget = () => {
      const step = GUIDE_STEPS[stepIndex];
      if (!step) {
        setTargetExists(false);
        setIsNavigating(false);
        return;
      }
      
      const element = document.querySelector(step.target);
      
      if (element) {
        setTargetExists(true);
        setIsNavigating(false);
        checkAttemptsRef.current = 0;
      } else {
        checkAttemptsRef.current += 1;
        
        if (checkAttemptsRef.current >= maxCheckAttempts) {
          // Element not found after max attempts, skip to next step or complete
          console.warn(`Guide: Element ${step.target} not found, skipping step`);
          setIsNavigating(false);
          
          if (stepIndex < GUIDE_STEPS.length - 1) {
            nextStep();
          } else {
            completeGuide();
          }
        }
      }
    };
    
    // Check immediately
    checkTarget();
    
    // Keep checking with interval if navigating
    const interval = setInterval(() => {
      if (checkAttemptsRef.current < maxCheckAttempts && !targetExists) {
        checkTarget();
      }
    }, 300);
    
    return () => clearInterval(interval);
  }, [isGuideRunning, stepIndex, location.pathname, targetExists, nextStep, completeGuide]);
  
  // Reset targetExists when step changes
  useEffect(() => {
    setTargetExists(false);
  }, [stepIndex]);
  
  // Handle Joyride callbacks
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action, index, type } = data;

    // react-joyride can end the tour either via STATUS.FINISHED/SKIPPED or via end events.
    if (status === STATUS.FINISHED || type === EVENTS.TOUR_END) {
      void completeGuide();
      return;
    }

    // Handle skip/close
    if (status === STATUS.SKIPPED || action === 'close') {
      void dismissGuide();
      return;
    }

    // Safety: when the user clicks "Neste" on the last step, explicitly complete.
    if (type === EVENTS.STEP_AFTER) {
      const isLast = index >= GUIDE_STEPS.length - 1;
      if (isLast && action !== 'prev') {
        void completeGuide();
        return;
      }

      const nextIndex = action === 'prev' ? index - 1 : index + 1;
      if (nextIndex >= 0 && nextIndex < GUIDE_STEPS.length) {
        setIsNavigating(true);
        void navigateToStep(nextIndex);
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
  
  // If user has no cars and we're trying to show car-detail steps, skip those
  const currentStep = GUIDE_STEPS[stepIndex];
  const needsCarButHasNone = currentStep?.routeType === 'car-detail' && !firstCarId;
  
  return (
    <>
      <Joyride
        steps={joyrideSteps}
        stepIndex={stepIndex}
        run={isGuideRunning && targetExists && !isNavigating && !needsCarButHasNone}
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
            // We'll render the dimming via the spotlight boxShadow instead of the overlay layer
            overlayColor: 'transparent',
          },
          // Ensure the highlighted area is truly "see-through" and reveals the real UI beneath.
          spotlight: {
            borderRadius: '12px',
            backgroundColor: 'transparent',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          },
          overlay: {
            backgroundColor: 'transparent',
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
      
      {/* Loading overlay when navigating */}
      <AnimatePresence>
        {isGuideRunning && isNavigating && !targetExists && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
          >
            <div className="bg-card rounded-xl p-6 shadow-2xl max-w-sm mx-4 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Laster inn...</p>
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
