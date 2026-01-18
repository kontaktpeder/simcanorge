import Joyride, { CallBackProps, STATUS, EVENTS, Step, ACTIONS } from 'react-joyride';
import { useGuide, GUIDE_STEPS } from '@/hooks/useGuide';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

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
    completeGuide, 
    dismissGuide,
    firstCarId,
    getActiveSteps,
    activeGuideType,
  } = useGuide();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const isNavigatingRef = useRef(false);
  
  // Build the active steps based on guide type and whether user has cars
  const rawSteps = getActiveSteps();
  const activeSteps = rawSteps.filter(step => {
    // If user has no cars, skip car-detail steps
    if (step.routeType === 'car-detail' && !firstCarId) {
      return false;
    }
    return true;
  });
  
  // Debug log
  useEffect(() => {
    if (isGuideRunning) {
      console.log('[GarasjeGuide] Guide running:', { 
        activeGuideType, 
        rawStepsCount: rawSteps.length,
        activeStepsCount: activeSteps.length,
        firstCarId,
        isReady,
        stepIndex
      });
    }
  }, [isGuideRunning, activeGuideType, rawSteps.length, activeSteps.length, firstCarId, isReady, stepIndex]);
  
  // Get route for a step
  const getRouteForStep = useCallback((step: typeof GUIDE_STEPS[0]): string => {
    switch (step.routeType) {
      case 'dashboard':
        return '/dashboard';
      case 'my-cars':
        return '/dashboard/mine-biler';
      case 'car-detail':
        return `/dashboard/bil/${firstCarId}`;
      case 'owner-profile':
        return '/dashboard?showOwnerProfile=true';
      default:
        return '/dashboard';
    }
  }, [firstCarId]);
  
  // Check if current route matches step
  const isOnRouteForStep = useCallback((step: typeof GUIDE_STEPS[0]): boolean => {
    switch (step.routeType) {
      case 'dashboard':
        return location.pathname === '/dashboard';
      case 'my-cars':
        return location.pathname === '/dashboard/mine-biler';
      case 'car-detail':
        return location.pathname.startsWith('/dashboard/bil/');
      case 'owner-profile':
        // For eierprofil sjekker vi bare at vi er på dashboard
        return location.pathname === '/dashboard';
      default:
        return true;
    }
  }, [location.pathname]);
  
  // Navigate to correct route when guide starts or step changes
  useEffect(() => {
    if (!isGuideRunning) {
      setStepIndex(0);
      setIsReady(false);
      return;
    }
    
    const currentStep = activeSteps[stepIndex];
    if (!currentStep) return;
    
    const targetRoute = getRouteForStep(currentStep);
    
    if (!isOnRouteForStep(currentStep)) {
      isNavigatingRef.current = true;
      setIsReady(false);
      navigate(targetRoute);
    }
  }, [isGuideRunning, stepIndex, activeSteps, getRouteForStep, isOnRouteForStep, navigate]);
  
  // Wait for target element to exist after navigation
  useEffect(() => {
    if (!isGuideRunning) return;
    
    const currentStep = activeSteps[stepIndex];
    if (!currentStep) return;
    
    // Check if element exists with retries
    let attempts = 0;
    const maxAttempts = 20;
    
    const checkElement = () => {
      const element = document.querySelector(currentStep.target);
      if (element) {
        isNavigatingRef.current = false;
        setIsReady(true);
        return true;
      }
      return false;
    };
    
    // Initial check
    if (checkElement()) return;
    
    const interval = setInterval(() => {
      attempts++;
      if (checkElement() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          // Element not found, still proceed to allow Joyride to handle it
          isNavigatingRef.current = false;
          setIsReady(true);
        }
      }
    }, 150);
    
    return () => clearInterval(interval);
  }, [isGuideRunning, stepIndex, activeSteps, location.pathname]);
  
  // Handle Joyride callbacks
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, action, index, type } = data;

    // Guide completed
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED || type === EVENTS.TOUR_END) {
      void completeGuide();
      return;
    }

    // User clicked close/skip
    if (action === ACTIONS.CLOSE || action === ACTIONS.SKIP) {
      void dismissGuide();
      return;
    }

    // If a target isn't found (DOM not ready / conditional UI), skip deterministically
    if (type === EVENTS.TARGET_NOT_FOUND) {
      const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1;

      if (nextIndex < 0) return;
      if (nextIndex >= activeSteps.length) {
        void completeGuide();
        return;
      }

      setIsReady(false);
      setStepIndex(nextIndex);
      return;
    }

    // Handle step changes
    if (type === EVENTS.STEP_AFTER) {
      const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1;

      // Check bounds
      if (nextIndex < 0) return;

      if (nextIndex >= activeSteps.length) {
        void completeGuide();
        return;
      }

      // If we need to navigate to a different route, pause until it renders
      const nextStep = activeSteps[nextIndex];
      if (nextStep && !isOnRouteForStep(nextStep)) {
        setIsReady(false);
      }

      setStepIndex(nextIndex);
    }
  }, [activeSteps, completeGuide, dismissGuide, isOnRouteForStep]);
  
  // Convert steps to Joyride format
  const joyrideSteps: Step[] = activeSteps.map((step) => ({
    target: step.target,
    title: step.title,
    content: step.content,
    placement: step.placement || 'auto',
    disableBeacon: true,
    spotlightClicks: false,
  }));
  
  if (!isGuideRunning) return null;
  
  return (
    <Joyride
      steps={joyrideSteps}
      stepIndex={stepIndex}
      run={isReady && !isNavigatingRef.current}
      continuous
      showProgress
      showSkipButton
      hideCloseButton
      disableOverlayClose
      spotlightPadding={8}
      scrollToFirstStep
      scrollOffset={120}
      scrollDuration={300}
      callback={handleJoyrideCallback}
      tooltipComponent={CustomTooltip}
      floaterProps={{
        disableAnimation: false,
      }}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: 'hsl(var(--primary))',
          overlayColor: 'transparent',
        },
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
  );
}
