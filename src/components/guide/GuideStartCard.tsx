import { useGuide } from '@/hooks/useGuide';
import { EnamelCard } from '@/components/ui/garage/EnamelCard';
import { BigActionButton } from '@/components/ui/garage/BigActionButton';
import { HelpCircle, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export function GuideStartCard() {
  const { shouldShowGuide, startGuide, dismissGuide, isLoading } = useGuide();
  const [isVisible, setIsVisible] = useState(true);
  
  if (isLoading || !shouldShowGuide || !isVisible) return null;
  
  const handleDismiss = async () => {
    setIsVisible(false);
    await dismissGuide();
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <EnamelCard className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Lukk guide-tips"
          >
            <X className="w-4 h-4" />
          </button>
          
          {/* Decorative sparkles */}
          <div className="absolute top-4 left-4 text-primary/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="absolute bottom-4 right-16 text-primary/10">
            <Sparkles className="w-4 h-4" />
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-10">
            <div className="p-3 bg-primary/10 rounded-xl shrink-0">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-lg sm:text-xl mb-1">
                Ny her? La oss vise deg rundt! 👋
              </h3>
              <p className="text-base text-muted-foreground">
                Vi guider deg gjennom de viktigste funksjonene. Tar bare 1 minutt.
              </p>
            </div>
            
            <BigActionButton 
              onClick={startGuide}
              icon={<Sparkles className="w-5 h-5" />}
              className="shrink-0 w-full sm:w-auto"
            >
              Start guide
            </BigActionButton>
          </div>
        </EnamelCard>
      </motion.div>
    </AnimatePresence>
  );
}
