import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { GarageLayout } from '@/components/ui/garage/GarageLayout';
import { EnamelCard } from '@/components/ui/garage/EnamelCard';
import { BigActionButton } from '@/components/ui/garage/BigActionButton';
import { SectionHeader } from '@/components/ui/garage/SectionHeader';
import { ShoppingBag, Save, Loader2, Clock, ChevronLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useOwnerProfile } from '@/hooks/useOwnerProfile';
import { useCreateMarketplaceItem, useMarketplaceCategories } from '@/hooks/useMarketplace';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function OpprettAnnonse() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: ownerProfile, isLoading: profileLoading } = useOwnerProfile(user?.id);
  const { data: categories } = useMarketplaceCategories();
  const createItem = useCreateMarketplaceItem();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceNote, setPriceNote] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?returnUrl=/dashboard/opprett-annonse');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  if (!ownerProfile?.approved_at) {
    return (
      <GarageLayout title="Opprett annonse" subtitle="Markedsplass">
        <EnamelCard>
          <div className="p-6 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-medium mb-2">
              {ownerProfile ? 'Profil venter på godkjenning' : 'Du trenger en Entusiastprofil'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {ownerProfile
                ? 'Du kan opprette annonser når admin har godkjent profilen din.'
                : 'Opprett en Entusiastprofil først for å legge ut annonser.'}
            </p>
            <Link to="/dashboard">
              <BigActionButton variant="secondary" icon={<ChevronLeft className="w-4 h-4" />}>
                Tilbake til Dashboard
              </BigActionButton>
            </Link>
          </div>
        </EnamelCard>
      </GarageLayout>
    );
  }

  const handleSubmit = async () => {
    if (!title.trim() || !ownerProfile) return;

    await createItem.mutateAsync({
      owner_id: ownerProfile.id,
      title: title.trim(),
      description: description.trim() || null,
      price: price ? parseFloat(price) : null,
      price_note: priceNote.trim() || null,
      category_id: categoryId || null,
      location: location.trim() || ownerProfile.location || null,
      status: 'submitted',
    });

    navigate('/dashboard/mine-annonser');
  };

  return (
    <GarageLayout title="Opprett annonse" subtitle="Markedsplass" description="Fyll ut informasjon om det du ønsker å selge.">
      <Link to="/dashboard/mine-annonser" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6">
        <ChevronLeft className="h-4 w-4" /> Tilbake til dine annonser
      </Link>

      <SectionHeader title="Ny annonse" icon={<ShoppingBag className="h-5 w-5" />} />

      <EnamelCard className="mt-4">
        <div className="p-4 sm:p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tittel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="f.eks. Simca 1000 forgasser – Weber 32"
              className="max-w-lg"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivelse</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv det du selger – stand, tilstand, hva som er inkludert..."
              className="min-h-[120px] resize-y"
            />
          </div>

          {/* Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Pris (kr)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="f.eks. 1500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-note">Prisnotat</Label>
              <Input
                id="price-note"
                value={priceNote}
                onChange={(e) => setPriceNote(e.target.value)}
                placeholder="f.eks. Kan diskuteres, Byttes"
              />
            </div>
          </div>

          {/* Category */}
          {categories && categories.length > 0 && (
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Sted</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={ownerProfile.location || 'f.eks. Oslo'}
              className="max-w-md"
            />
          </div>

          {/* Submit */}
          <BigActionButton
            onClick={handleSubmit}
            disabled={!title.trim() || createItem.isPending}
            icon={createItem.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            className="w-full sm:w-auto"
          >
            {createItem.isPending ? 'Oppretter...' : 'Send inn annonse'}
          </BigActionButton>
        </div>
      </EnamelCard>
    </GarageLayout>
  );
}
