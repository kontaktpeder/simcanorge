import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

// Versjonering - øk dette tallet når guiden oppdateres
export const CURRENT_GUIDE_VERSION = 3;

interface GuideProgress {
  user_id: string;
  guide_key: string;
  completed_version: number;
  dismissed_at: string | null;
}

// Guide types for partial guides
export type GuideType = 'full' | 'my-cars' | 'owner-profile';

interface GuideContextType {
  // State
  isGuideRunning: boolean;
  currentStepIndex: number;
  shouldShowGuide: boolean;
  isLoading: boolean;
  firstCarId: string | null;
  activeGuideType: GuideType | null;
  
  // Actions
  startGuide: (type?: GuideType) => void;
  stopGuide: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipStep: () => void;
  completeGuide: () => Promise<void>;
  dismissGuide: () => Promise<void>;
  
  // Navigation helper
  navigateToStep: (stepIndex: number) => Promise<void>;
  
  // Get filtered steps for current guide
  getActiveSteps: () => GuideStep[];
}

// Default/fallback values for when context is not available
const defaultGuideContext: GuideContextType = {
  isGuideRunning: false,
  currentStepIndex: 0,
  shouldShowGuide: false,
  isLoading: true,
  firstCarId: null,
  activeGuideType: null,
  startGuide: () => {},
  stopGuide: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipStep: () => {},
  completeGuide: async () => {},
  dismissGuide: async () => {},
  navigateToStep: async () => {},
  getActiveSteps: () => [],
};

const GuideContext = createContext<GuideContextType>(defaultGuideContext);

export function useGuide() {
  return useContext(GuideContext);
}

// Guide steps configuration
export interface GuideStep {
  target: string; // data-guide attribute value
  title: string;
  content: string;
  routeType?: 'dashboard' | 'my-cars' | 'car-detail' | 'owner-profile'; // Which route type this step belongs to
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  disableBeacon?: boolean;
  spotlightClicks?: boolean;
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    target: '[data-guide="my-cars-card"]',
    title: 'Velkommen til Bilgarasjen! 🚗',
    content: 'Her ser du hvor mange biler du har registrert. Trykk for å se og redigere bilene dine.',
    routeType: 'dashboard',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-guide="car-list-item-0"]',
    title: 'Dine biler',
    content: 'Velg en bil for å redigere detaljer, laste opp bilder og legge til historie.',
    routeType: 'my-cars',
    placement: 'bottom',
  },
  {
    target: '[data-guide="publish-request"]',
    title: 'Publiser bilen din',
    content: 'Vil du at bilen skal vises offentlig på nettsiden? Trykk her for å be admin publisere den.',
    routeType: 'car-detail',
    placement: 'bottom',
  },
  {
    target: '[data-guide="images-section"]',
    title: 'Last opp bilder',
    content: 'Bilder gjør bilen levende! Last opp bilder her. Det første bildet blir hovedbildet.',
    routeType: 'car-detail',
    placement: 'top',
  },
  {
    target: '[data-guide="upload-image"]',
    title: 'Last opp',
    content: 'Trykk her for å laste opp ett eller flere bilder av bilen din.',
    routeType: 'car-detail',
    placement: 'bottom',
  },
  {
    target: '[data-guide="edit-basic-info"]',
    title: 'Rediger grunninfo',
    content: 'Her kan du endre merke, modell, årsmodell og andre grunnleggende opplysninger.',
    routeType: 'car-detail',
    placement: 'left',
  },
  {
    target: '[data-guide="edit-story"]',
    title: 'Fortell historien',
    content: 'Fortell litt om bilen din. Hvor kom den fra? Hva har den vært med på? 2-5 setninger holder.',
    routeType: 'car-detail',
    placement: 'left',
  },
  {
    target: '[data-guide="add-timeline-event"]',
    title: 'Legg til hendelser',
    content: 'Dokumenter viktige hendelser i bilens liv. Dette blir en tidslinje på den offentlige siden.',
    routeType: 'car-detail',
    placement: 'top',
  },
  // Eierprofil-steg
  {
    target: '[data-guide="owner-profile-card"]',
    title: 'Din profil 👤',
    content: 'Her kan du opprette eller redigere din offentlige profil. Trykk for å åpne.',
    routeType: 'dashboard',
    placement: 'bottom',
  },
  {
    target: '[data-guide="owner-display-name"]',
    title: 'Ditt visningsnavn',
    content: 'Velg hva du vil hete på nettsiden. Dette vises på bilene dine og profilsiden din.',
    routeType: 'owner-profile',
    placement: 'bottom',
  },
  {
    target: '[data-guide="owner-bio"]',
    title: 'Fortell om deg selv',
    content: 'Skriv litt om deg som bileier. Hvorfor liker du Simca? Hvor lenge har du vært entusiast?',
    routeType: 'owner-profile',
    placement: 'top',
  },
  {
    target: '[data-guide="owner-visibility"]',
    title: 'Synlighet',
    content: 'Skru på dette for å vise entusiastprofilen din offentlig. Da får du en egen profilside folk kan besøke.',
    routeType: 'owner-profile',
    placement: 'top',
  },
  {
    target: '[data-guide="owner-save"]',
    title: 'Lagre profilen',
    content: 'Husk å lagre endringene dine! Trykk her når du er ferdig.',
    routeType: 'owner-profile',
    placement: 'top',
  },
];

interface GuideProviderProps {
  children: ReactNode;
}

export function GuideProvider({ children }: GuideProviderProps) {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isGuideRunning, setIsGuideRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [guideProgress, setGuideProgress] = useState<GuideProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firstCarId, setFirstCarId] = useState<string | null>(null);
  const [activeGuideType, setActiveGuideType] = useState<GuideType | null>(null);
  
  // Fetch first car ID for navigation
  useEffect(() => {
    if (!user) return;
    
    const fetchFirstCar = async () => {
      const { data } = await supabase
        .from('car_owners')
        .select('car_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setFirstCarId(data.car_id);
      }
    };
    
    fetchFirstCar();
  }, [user]);
  
  // Fetch or create guide progress
  useEffect(() => {
    if (authLoading || !user) {
      setIsLoading(false);
      return;
    }
    
    const fetchProgress = async () => {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('user_guides')
        .select('*')
        .eq('user_id', user.id)
        .eq('guide_key', 'garage_onboarding')
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching guide progress:', error);
        setIsLoading(false);
        return;
      }
      
      if (data) {
        setGuideProgress(data as GuideProgress);
      } else {
        // Create new progress row
        const { data: newData, error: insertError } = await supabase
          .from('user_guides')
          .insert({
            user_id: user.id,
            guide_key: 'garage_onboarding',
            completed_version: 0,
          })
          .select()
          .single();
        
        if (!insertError && newData) {
          setGuideProgress(newData as GuideProgress);
        }
      }
      
      setIsLoading(false);
    };
    
    fetchProgress();
  }, [user, authLoading]);
  
  // Should show guide?
  const shouldShowGuide = !isLoading && 
    guideProgress !== null &&
    guideProgress.completed_version < CURRENT_GUIDE_VERSION &&
    guideProgress.dismissed_at === null;
  
  // Get filtered steps based on guide type
  const getStepsForGuideType = useCallback((type: GuideType): GuideStep[] => {
    switch (type) {
      case 'my-cars':
        // Mine biler: dashboard my-cars-card -> my-cars -> car-detail steg
        return GUIDE_STEPS.filter(step => 
          (step.routeType === 'dashboard' && step.target.includes('my-cars')) ||
          step.routeType === 'my-cars' ||
          step.routeType === 'car-detail'
        );
      case 'owner-profile':
        // Eierprofil: dashboard eierprofil-kort -> owner-profile steg
        return GUIDE_STEPS.filter(step => 
          (step.routeType === 'dashboard' && step.target.includes('owner-profile')) ||
          step.routeType === 'owner-profile'
        );
      case 'full':
      default:
        // Full guide: alle steg
        return GUIDE_STEPS;
    }
  }, []);
  
  // Get active steps (for current guide type)
  const getActiveSteps = useCallback((): GuideStep[] => {
    if (!activeGuideType) return GUIDE_STEPS;
    return getStepsForGuideType(activeGuideType);
  }, [activeGuideType, getStepsForGuideType]);
  
  // Get route for step (using active steps)
  const getRouteForStep = useCallback((stepIndex: number): string | null => {
    const activeSteps = getActiveSteps();
    const step = activeSteps[stepIndex];
    if (!step) return null;
    
    switch (step.routeType) {
      case 'dashboard':
        return '/dashboard';
      case 'my-cars':
        return '/dashboard/mine-biler';
      case 'car-detail':
        return firstCarId ? `/dashboard/bil/${firstCarId}` : null;
      case 'owner-profile':
        // For eierprofil navigerer vi til dashboard, men åpner eierprofil-seksjonen
        return '/dashboard?showOwnerProfile=true';
      default:
        return null;
    }
  }, [firstCarId, getActiveSteps]);
  
  // Check if we're on correct route for step
  const isOnCorrectRoute = useCallback((stepIndex: number): boolean => {
    const activeSteps = getActiveSteps();
    const step = activeSteps[stepIndex];
    if (!step) return false;
    
    switch (step.routeType) {
      case 'dashboard':
        return location.pathname === '/dashboard';
      case 'my-cars':
        return location.pathname === '/dashboard/mine-biler';
      case 'car-detail':
        return location.pathname.startsWith('/dashboard/bil/');
      case 'owner-profile':
        // For eierprofil sjekker vi bare at vi er på dashboard
        // Eierprofil-seksjonen åpnes automatisk via URL-parameter
        return location.pathname === '/dashboard';
      default:
        return true;
    }
  }, [location.pathname, getActiveSteps]);
  
  // Start guide with optional type
  const startGuide = useCallback((type: GuideType = 'full') => {
    setActiveGuideType(type);
    setCurrentStepIndex(0);
    setIsGuideRunning(true);
    
    // Get steps for this guide type and navigate to first step
    const steps = getStepsForGuideType(type);
    const firstStep = steps[0];
    if (!firstStep) return;
    
    let route: string | null = null;
    switch (firstStep.routeType) {
      case 'dashboard':
        route = '/dashboard';
        break;
      case 'my-cars':
        route = '/dashboard/mine-biler';
        break;
      case 'car-detail':
        route = firstCarId ? `/dashboard/bil/${firstCarId}` : null;
        break;
      case 'owner-profile':
        route = '/dashboard?showOwnerProfile=true';
        break;
    }
    
    if (route && location.pathname !== route.split('?')[0]) {
      navigate(route);
    }
  }, [navigate, location.pathname, getStepsForGuideType, firstCarId]);
  
  // Stop guide
  const stopGuide = useCallback(() => {
    setIsGuideRunning(false);
    setActiveGuideType(null);
  }, []);
  
  // Navigate to step (within active guide)
  const navigateToStep = useCallback(async (stepIndex: number) => {
    const activeSteps = getActiveSteps();
    const step = activeSteps[stepIndex];
    if (!step) return;
    
    const route = getRouteForStep(stepIndex);
    
    // If step needs car-detail but no car exists, skip to end
    if (step.routeType === 'car-detail' && !firstCarId) {
      // User has no cars, complete guide early
      await completeGuide();
      return;
    }
    
    // If we need to navigate
    if (route && !isOnCorrectRoute(stepIndex)) {
      navigate(route);
      // Wait for navigation and render
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setCurrentStepIndex(stepIndex);
  }, [getRouteForStep, isOnCorrectRoute, navigate, firstCarId, getActiveSteps]);
  
  // Next step (within active guide)
  const nextStep = useCallback(() => {
    const activeSteps = getActiveSteps();
    if (currentStepIndex < activeSteps.length - 1) {
      navigateToStep(currentStepIndex + 1);
    } else {
      // Complete guide
      completeGuide();
    }
  }, [currentStepIndex, navigateToStep, getActiveSteps]);
  
  // Previous step
  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      navigateToStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, navigateToStep]);
  
  // Skip step
  const skipStep = useCallback(() => {
    nextStep();
  }, [nextStep]);
  
  // Complete guide
  const completeGuide = useCallback(async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('user_guides')
      .update({
        completed_version: CURRENT_GUIDE_VERSION,
        dismissed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('guide_key', 'garage_onboarding');
    
    if (!error) {
      setGuideProgress(prev => prev ? {
        ...prev,
        completed_version: CURRENT_GUIDE_VERSION,
        dismissed_at: new Date().toISOString(),
      } : null);
    }
    
    setIsGuideRunning(false);
    setActiveGuideType(null);
  }, [user]);
  
  // Dismiss guide (without completing)
  const dismissGuide = useCallback(async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('user_guides')
      .update({
        dismissed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('guide_key', 'garage_onboarding');
    
    if (!error) {
      setGuideProgress(prev => prev ? {
        ...prev,
        dismissed_at: new Date().toISOString(),
      } : null);
    }
    
    setIsGuideRunning(false);
    setActiveGuideType(null);
  }, [user]);
  
  const value: GuideContextType = {
    isGuideRunning,
    currentStepIndex,
    shouldShowGuide,
    isLoading,
    firstCarId,
    activeGuideType,
    startGuide,
    stopGuide,
    nextStep,
    prevStep,
    skipStep,
    completeGuide,
    dismissGuide,
    navigateToStep,
    getActiveSteps,
  };
  
  return (
    <GuideContext.Provider value={value}>
      {children}
    </GuideContext.Provider>
  );
}
