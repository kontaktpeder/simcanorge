import { Link } from 'react-router-dom';
import { ArrowLeft, Star, StarOff, Eye, EyeOff, Trash2, ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/car';

interface CarProfileHeaderProps {
  car: {
    id: string;
    title: string;
    featured: boolean;
    approved_at: string | null;
    source: 'manual' | 'submission';
  };
  status: 'submitted' | 'draft' | 'published' | 'archived';
  onApprove: () => Promise<void>;
  onToggleFeatured: () => Promise<void>;
  onTogglePublish: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function CarProfileHeader({
  car,
  status,
  onApprove,
  onToggleFeatured,
  onTogglePublish,
  onDelete,
}: CarProfileHeaderProps) {
  return (
    <div className="mb-6">
      <Link 
        to="/admin/biler" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Tilbake
      </Link>

      <div className="space-y-4">
        {/* Title row */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-xl md:text-3xl leading-tight">{car.title}</h1>
            {car.featured && <Star className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 fill-yellow-500 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={status} />
            {car.source === 'submission' && (
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">Innsending</span>
            )}
            {car.approved_at && (
              <span className="inline-flex items-center gap-1 text-green-600 text-xs px-2 py-0.5 bg-green-50 rounded">
                <Check className="w-3 h-3" />
                Godkjent
              </span>
            )}
          </div>
        </div>

        {/* Action buttons - responsive grid */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          {/* Approve button - only show if not approved */}
          {!car.approved_at && (
            <Button
              variant="default"
              size="sm"
              onClick={onApprove}
              className="bg-green-600 hover:bg-green-700 col-span-2 sm:col-span-1"
            >
              <ShieldCheck className="w-4 h-4 mr-1" />
              Godkjenn
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFeatured}
            className="text-xs"
          >
            {car.featured ? <StarOff className="w-4 h-4 mr-1" /> : <Star className="w-4 h-4 mr-1" />}
            <span className="hidden sm:inline">{car.featured ? 'Fjern utvalgt' : 'Gjør utvalgt'}</span>
            <span className="sm:hidden">{car.featured ? 'Fjern' : 'Utvalgt'}</span>
          </Button>
          
          <Button
            variant={status === 'published' ? 'outline' : 'default'}
            size="sm"
            onClick={onTogglePublish}
            disabled={!car.approved_at}
            title={!car.approved_at ? 'Godkjenn bilen først' : undefined}
            className="text-xs"
          >
            {status === 'published' ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
            {status === 'published' ? 'Avpubliser' : 'Publiser'}
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="text-xs"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Slett
          </Button>
        </div>
      </div>
    </div>
  );
}
