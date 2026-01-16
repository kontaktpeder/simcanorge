import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

// Versjonering - øk dette tallet når guiden oppdateres
export const CURRENT_GUIDE_VERSION = 2;

interface GuideProgress {
  user_id: string;
  guide_key: string;
  completed_version: number;
  dismissed_at: string | null;
}

interface GuideContextType {
  // State
  isGuideRunning: boolean;
  currentStepIndex: number;
  shouldShowGuide: boolean;
  isLoading: boolean;
  firstCarId: string | null;
  
  // Actions
  startGuide: () => void;
  stopGuide: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipStep: () => void;
  completeGuide: () => Promise<void>;
  dismissGuide: () => Promise<void>;
  
  // Navigation helper
  navigateToStep: (stepIndex: number) => Promise<void>;
}

const GuideContext = createContext<GuideContextType | null>(null);

export function useGuide() {
  const context = useContext(GuideContext);
  if (!context) {
    throw new Error('useGuide must be used within a GuideProvider');
  }
  return context;
}

// Guide steps configuration
export interface GuideStep {
  target: string; // data-guide attribute value
  title: string;
  content: string;
  routeType?: 'dashboard' | 'my-cars' | 'car-detail'; // Which route type this step belongs to
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
  
  // Get route for step
  const getRouteForStep = useCallback((stepIndex: number): string | null => {
    const step = GUIDE_STEPS[stepIndex];
    if (!step) return null;
    
    switch (step.routeType) {
      case 'dashboard':
        return '/dashboard';
      case 'my-cars':
        return '/dashboard/mine-biler';
      case 'car-detail':
        return firstCarId ? `/dashboard/bil/${firstCarId}` : null;
      default:
        return null;
    }
  }, [firstCarId]);
  
  // Check if we're on correct route for step
  const isOnCorrectRoute = useCallback((stepIndex: number): boolean => {
    const step = GUIDE_STEPS[stepIndex];
    if (!step) return false;
    
    switch (step.routeType) {
      case 'dashboard':
        return location.pathname === '/dashboard';
      case 'my-cars':
        return location.pathname === '/dashboard/mine-biler';
      case 'car-detail':
        return location.pathname.startsWith('/dashboard/bil/');
      default:
        return true;
    }
  }, [location.pathname]);
  
  // Start guide
  const startGuide = useCallback(() => {
    setCurrentStepIndex(0);
    setIsGuideRunning(true);
    
    // Navigate to first step route if needed
    const route = getRouteForStep(0);
    if (route && location.pathname !== route) {
      navigate(route);
    }
  }, [navigate, location.pathname, getRouteForStep]);
  
  // Stop guide
  const stopGuide = useCallback(() => {
    setIsGuideRunning(false);
  }, []);
  
  // Navigate to step
  const navigateToStep = useCallback(async (stepIndex: number) => {
    const step = GUIDE_STEPS[stepIndex];
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
  }, [getRouteForStep, isOnCorrectRoute, navigate, firstCarId]);
  
  // Next step
  const nextStep = useCallback(() => {
    if (currentStepIndex < GUIDE_STEPS.length - 1) {
      navigateToStep(currentStepIndex + 1);
    } else {
      // Complete guide
      completeGuide();
    }
  }, [currentStepIndex, navigateToStep]);
  
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
  }, [user]);
  
  const value: GuideContextType = {
    isGuideRunning,
    currentStepIndex,
    shouldShowGuide,
    isLoading,
    firstCarId,
    startGuide,
    stopGuide,
    nextStep,
    prevStep,
    skipStep,
    completeGuide,
    dismissGuide,
    navigateToStep,
  };
  
  return (
    <GuideContext.Provider value={value}>
      {children}
    </GuideContext.Provider>
  );
}
