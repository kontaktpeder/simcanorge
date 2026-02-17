import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, Heart, Eye, EyeOff, Save, Loader2, Info, Clock, Camera } from 'lucide-react';
import { EnamelCard, SectionHeader, BigActionButton } from '@/components/ui/garage';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useOwnerProfile, useCreateOwnerProfile, useUpdateOwnerProfile } from '@/hooks/useOwnerProfile';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { compressImage, getOwnerAvatarPath } from '@/lib/imageCompression';
import { supabase } from '@/integrations/supabase/client';

interface OwnerProfileSectionProps {
  userId: string;
}

const BRAND_OPTIONS = ['Simca', 'Talbot', 'Matra', 'Peugeot', 'Citroën', 'Annet'];

export function OwnerProfileSection({ userId }: OwnerProfileSectionProps) {
  const { user } = useAuth();
  const { data: profile, isLoading } = useOwnerProfile(userId);
  const createProfile = useCreateOwnerProfile();
  const updateProfile = useUpdateOwnerProfile();
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [favoriteBrands, setFavoriteBrands] = useState<string[]>([]);
  const [visiblePublic, setVisiblePublic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setFavoriteBrands(profile.favorite_brands || []);
      setVisiblePublic(profile.visible_public);
    } else if (user?.email && !isLoading) {
      // Default name from email
      setDisplayName(user.email.split('@')[0] || 'Bileier');
    }
  }, [profile, user, isLoading]);

  useEffect(() => {
    if (profile) {
      const changed = 
        displayName !== (profile.display_name || '') ||
        bio !== (profile.bio || '') ||
        location !== (profile.location || '') ||
        JSON.stringify(favoriteBrands) !== JSON.stringify(profile.favorite_brands || []) ||
        visiblePublic !== profile.visible_public;
      setHasChanges(changed);
    } else {
      setHasChanges(displayName.length > 0);
    }
  }, [displayName, bio, location, favoriteBrands, visiblePublic, profile]);

  const toggleBrand = (brand: string) => {
    setFavoriteBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile || !file.type.startsWith('image/')) return;

    setIsUploadingAvatar(true);
    try {
      const { file: compressed } = await compressImage(file);
      const path = getOwnerAvatarPath(profile.id);

      const { error: uploadErr } = await supabase.storage
        .from('simca-images')
        .upload(path, compressed, { contentType: 'image/webp', upsert: true });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from('simca-images').getPublicUrl(path);
      await updateProfile.mutateAsync({
        id: profile.id,
        updates: { avatar_url: `${data.publicUrl}?t=${Date.now()}` },
      });
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) return;

    if (profile) {
      await updateProfile.mutateAsync({
        id: profile.id,
        updates: {
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          location: location.trim() || null,
          favorite_brands: favoriteBrands.length > 0 ? favoriteBrands : null,
          visible_public: visiblePublic,
        },
      });
    } else {
      await createProfile.mutateAsync({
        user_id: userId,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        location: location.trim() || null,
        favorite_brands: favoriteBrands.length > 0 ? favoriteBrands : null,
        visible_public: visiblePublic,
      });
    }
    setIsEditing(false);
  };

  const isSaving = createProfile.isPending || updateProfile.isPending;

  if (isLoading) {
    return (
      <EnamelCard className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </EnamelCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <SectionHeader 
        title="Om meg som bileier" 
        icon={<User className="h-5 w-5" />}
      />
      
      <EnamelCard className="mt-4">
        <div className="p-4 sm:p-6 space-y-6">
          {/* Approval status */}
          {profile && !profile.approved_at && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm">
              <Clock className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
              <p className="text-amber-800 dark:text-amber-300">
                Profilen din er sendt til godkjenning. Du kan opprette annonser på markedsplassen når profilen er godkjent av admin.
              </p>
            </div>
          )}

          {/* Info text */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              Eierprofilen din er redaksjonelt innhold som vises på bilene dine og på din offentlige profilside. 
              Dette er ikke kontoinnstillinger.
            </p>
          </div>

          {/* Avatar */}
          {profile && (
            <div className="space-y-2">
              <Label>Profilbilde</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name} />}
                    <AvatarFallback className="text-lg">{profile.display_name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90"
                  >
                    {isUploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Last opp profilbilde (kvadratisk anbefales)</p>
              </div>
            </div>
          )}

          {/* Display Name */}
          <div className="space-y-2" data-guide="owner-display-name">
            <Label htmlFor="display-name">Visningsnavn *</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ditt navn eller kallenavn"
              className="max-w-md"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2" data-guide="owner-bio">
            <Label htmlFor="bio">Om meg som bileier</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Fortell hvorfor du eier en Simca, Talbot eller Matra. Hva betyr disse bilene for deg, og hvordan startet interessen?"
              className="min-h-[120px] resize-y"
              maxLength={800}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/800 tegn
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Bosted
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="f.eks. Grimstad, Norge"
              className="max-w-md"
            />
          </div>

          {/* Favorite Brands */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Favorittmerker
            </Label>
            <div className="flex flex-wrap gap-2">
              {BRAND_OPTIONS.filter(brand => !['Peugeot', 'Citroën', 'Annet'].includes(brand)).map((brand) => (
                <Badge
                  key={brand}
                  variant={favoriteBrands.includes(brand) ? "default" : "outline"}
                  className="cursor-pointer transition-colors hover:bg-primary/80 select-none"
                  onClick={() => toggleBrand(brand)}
                >
                  {brand}
                </Badge>
              ))}
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-card" data-guide="owner-visibility">
            <div className="flex items-center gap-3">
              {visiblePublic ? (
                <Eye className="h-5 w-5 text-green-600" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-sm">Vis eierprofil offentlig</p>
                <p className="text-xs text-muted-foreground">
                  {visiblePublic 
                    ? 'Profilen din vises på bilene dine og på din offentlige eierside'
                    : 'Profilen din er skjult for andre'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={visiblePublic}
              onCheckedChange={setVisiblePublic}
            />
          </div>

          {/* Public URL preview */}
          {profile?.slug && visiblePublic && (
            <div className="p-3 rounded-lg bg-muted/30 text-sm">
              <p className="text-muted-foreground">Din offentlige profilside:</p>
              <p className="font-mono text-xs text-primary">/profil/{profile.slug}</p>
            </div>
          )}

          {/* Save Button */}
          <div data-guide="owner-save">
            <BigActionButton
              onClick={handleSave}
              disabled={!displayName.trim() || isSaving || !hasChanges}
              icon={isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              className="w-full sm:w-auto"
            >
              {isSaving ? 'Lagrer...' : profile ? 'Lagre endringer' : 'Opprett eierprofil'}
            </BigActionButton>
          </div>
        </div>
      </EnamelCard>
    </motion.div>
  );
}
