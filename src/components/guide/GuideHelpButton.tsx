import { useGuide } from '@/hooks/useGuide';
import { useAuth } from '@/hooks/useAuth';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function GuideHelpButton() {
  const { user } = useAuth();
  const { startGuide, isGuideRunning } = useGuide();
  
  // Only show for logged in users on dashboard routes
  if (!user || isGuideRunning) return null;
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => startGuide('full')}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          aria-label="Start garasje-guide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Start garasje-guiden</p>
      </TooltipContent>
    </Tooltip>
  );
}
