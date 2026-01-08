import { useState } from 'react';
import { Plus, X, ExternalLink, Link2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface ExternalLink {
  url: string;
  type: 'facebook' | 'instagram' | 'youtube' | 'other';
  title?: string;
}

interface CarLinksSectionProps {
  carId: string;
  externalLinks: ExternalLink[] | null;
}

const LINK_TYPES = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'other', label: 'Annet' },
] as const;

export function CarLinksSection({ carId, externalLinks }: CarLinksSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newLink, setNewLink] = useState<ExternalLink>({ url: '', type: 'facebook', title: '' });
  const queryClient = useQueryClient();

  const links: ExternalLink[] = externalLinks || [];

  const addLink = async () => {
    if (!newLink.url.trim()) {
      toast.error('URL er påkrevd');
      return;
    }

    setIsSaving(true);
    try {
      const updatedLinks = [...links, { ...newLink, title: newLink.title || undefined }];
      const { error } = await supabase
        .from('cars')
        .update({ external_links: updatedLinks as unknown as Json })
        .eq('id', carId);

      if (error) throw error;

      toast.success('Lenke lagt til!');
      setNewLink({ url: '', type: 'facebook', title: '' });
      setIsAdding(false);
      queryClient.invalidateQueries({ queryKey: ['admin-car', carId] });
    } catch (error: any) {
      toast.error('Kunne ikke lagre lenke');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLink = async (index: number) => {
    try {
      const updatedLinks = links.filter((_, i) => i !== index);
      const { error } = await supabase
        .from('cars')
        .update({ external_links: updatedLinks as unknown as Json })
        .eq('id', carId);

      if (error) throw error;

      toast.success('Lenke slettet');
      queryClient.invalidateQueries({ queryKey: ['admin-car', carId] });
    } catch (error: any) {
      toast.error('Kunne ikke slette lenke');
      console.error(error);
    }
  };

  const getLinkTypeLabel = (type: ExternalLink['type']) => {
    return LINK_TYPES.find(t => t.value === type)?.label || 'Lenke';
  };

  return (
    <div className="bg-card border-2 border-foreground rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          <h3 className="font-display text-sm">EKSTERNE LENKER</h3>
        </div>
        {!isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Legg til lenke
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block">URL *</label>
            <Input
              value={newLink.url}
              onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://www.facebook.com/..."
              className="border-2 border-foreground"
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Type</label>
            <select
              value={newLink.type}
              onChange={(e) => setNewLink(prev => ({ ...prev, type: e.target.value as ExternalLink['type'] }))}
              className="w-full h-10 px-3 border-2 border-foreground bg-card rounded"
            >
              {LINK_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Tittel (valgfritt)</label>
            <Input
              value={newLink.title || ''}
              onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
              placeholder="F.eks. Facebook-side, Video av bilen..."
              className="border-2 border-foreground"
            />
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={addLink} disabled={isSaving}>
              {isSaving ? 'Lagrer...' : 'Lagre'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewLink({ url: '', type: 'facebook', title: '' });
              }}
            >
              Avbryt
            </Button>
          </div>
        </div>
      )}

      {links.length > 0 ? (
        <div className="space-y-2">
          {links.map((link, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {link.title || link.url}
                  </p>
                  {link.title && (
                    <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                  )}
                  <span className="text-xs text-muted-foreground">{getLinkTypeLabel(link.type)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-muted rounded transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => deleteLink(index)}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Ingen lenker lagt til ennå</p>
      )}
    </div>
  );
}
