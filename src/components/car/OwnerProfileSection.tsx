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
import { getOwnerAvatarPath, blobToWebPFile } from '@/lib/imageCompression';
import { supabase } from '@/integrations/supabase/client';
import { AvatarCropModal } from '@/components/avatar/AvatarCropModal';

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
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [favoriteBrands, setFavoriteBrands] = useState<string[]>([]);
  const [visiblePublic, setVisiblePublic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username ?? '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setContactEmail((profile as any).contact_email || '');
      setContactPhone((profile as any).contact_phone || '');
      setFavoriteBrands(profile.favorite_brands || []);
      setVisiblePublic(profile.visible_public);
    } else if (user?.email && !isLoading) {
      setDisplayName(user.email.split('@')[0] || 'Bileier');
    }
  }, [profile, user, isLoading]);

  useEffect(() => {
    if (profile) {
      const changed = 
        displayName !== (profile.display_name || '') ||
        username !== (profile.username ?? '') ||
        bio !== (profile.bio || '') ||
        location !== (profile.location || '') ||
        contactEmail !== ((profile as any).contact_email || '') ||
        contactPhone !== ((profile as any).contact_phone || '') ||
        JSON.stringify(favoriteBrands) !== JSON.stringify(profile.favorite_brands || []) ||
        visiblePublic !== profile.visible_public;
      setHasChanges(changed);
    } else {
      setHasChanges(displayName.length > 0);
    }
  }, [displayName, username, bio, location, favoriteBrands, visiblePublic, profile]);

  const toggleBrand = (brand: string) => {
    setFavoriteBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile || !file.type.startsWith('image/')) return;
    setAvatarCropFile(file);
    setShowCropModal(true);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!profile) return;
    setIsUploadingAvatar(true);
    setShowCropModal(false);
    try {
      const file = blobToWebPFile(croppedBlob);
      const path = getOwnerAvatarPath(profile.id);
      const { error: uploadErr } = await supabase.storage
        .from('simca-images')
        .upload(path, file, { contentType: 'image/webp', upsert: true });
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
      setAvatarCropFile(null);
    }
  };

  const isValidUsername = (val: string) => {
    if (!val.trim()) return true;
    return /^[a-z0-9][a-z0-9_-]*[a-z0-9]$|^[a-z0-9]$/.test(val.trim());
  };

  const handleSave = async () => {
    if (!displayName.trim()) return;
    if (!contactEmail.trim()) return;

    if (username.trim() && !isValidUsername(username)) {
      return;
    }

    const contactFields = {
      contact_email: contactEmail.trim(),
      contact_phone: contactPhone.trim() || null,
    };

    if (profile) {
      await updateProfile.mutateAsync({
        id: profile.id,
        updates: {
          display_name: displayName.trim(),
          username: username.trim() || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
          favorite_brands: favoriteBrands.length > 0 ? favoriteBrands : null,
          visible_public: visiblePublic,
          ...contactFields,
        } as any,
      });
    } else {
      await createProfile.mutateAsync({
        user_id: userId,
        display_name: displayName.trim(),
        username: username.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        favorite_brands: favoriteBrands.length > 0 ? favoriteBrands : null,
        visible_public: visiblePublic,
        ...contactFields,
      } as any);
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
      <div className="border-2 border-foreground/15 bg-card/90 backdrop-blur-sm">
        <div className="p-6 sm:p-8 space-y-8">
          {/* Approval status */}
          {profile && !profile.approved_at && (
            <div className="p-5 border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
              <div className="flex items-start gap-4">
                <Clock className="h-6 w-6 mt-0.5 shrink-0 text-amber-600" />
                <p className="text-base text-amber-800 dark:text-amber-300">
                  Entusiastprofilen din er sendt til godkjenning. Du kan opprette annonser på markedsplassen når profilen er godkjent av admin.
                </p>
              </div>
            </div>
          )}

          {/* Info text */}
          <div className="flex items-start gap-4 p-5 border-2 border-foreground/10 bg-muted/30">
            <Info className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-base text-muted-foreground">
              Entusiastprofilen din er redaksjonelt innhold som vises på bilene dine og på din offentlige profilside. 
              Dette er ikke kontoinnstillinger.
            </p>
          </div>

          {/* Avatar */}
          {profile && (
            <div className="space-y-3">
              <label className="font-display text-base uppercase tracking-wider block">Profilbilde</label>
              <div className="flex items-center gap-5">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.display_name} />}
                    <AvatarFallback className="text-xl">{profile.display_name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute -bottom-1 -right-1 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-base text-muted-foreground">Last opp profilbilde (kvadratisk anbefales)</p>
              </div>
            </div>
          )}

          {/* Display Name */}
          <div className="space-y-3" data-guide="owner-display-name">
            <label htmlFor="display-name" className="font-display text-base uppercase tracking-wider block">
              Visningsnavn <span className="text-destructive">*</span>
            </label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ditt navn eller kallenavn"
              className="max-w-md text-base h-12"
            />
          </div>

          {/* Username */}
          <div className="space-y-3">
            <label htmlFor="username" className="font-display text-base uppercase tracking-wider block">
              Brukernavn (valgfritt)
            </label>
            <Input
              id="username"
              value={username}
              onChange={(e) => {
                const v = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
                setUsername(v);
              }}
              placeholder="f.eks. peder-august"
              className="max-w-md font-mono text-base h-12"
              maxLength={30}
            />
            <p className="text-sm text-muted-foreground">
              Brukes i profil-URL. Kun små bokstaver, tall, bindestrek og understrek.
            </p>
            {profile?.slug && visiblePublic && (
              <p className="font-mono text-sm text-primary">/profil/{profile.slug}</p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-3" data-guide="owner-bio">
            <label htmlFor="bio" className="font-display text-base uppercase tracking-wider block">Om meg</label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Fortell hvorfor du eier en Simca, Talbot eller Matra. Hva betyr disse bilene for deg, og hvordan startet interessen?"
              className="min-h-[140px] resize-y text-base"
              maxLength={800}
            />
            <p className="text-sm text-muted-foreground">
              {bio.length}/800 tegn
            </p>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <label htmlFor="location" className="font-display text-base uppercase tracking-wider flex items-center gap-2 block">
              <MapPin className="h-5 w-5" />
              Bosted
            </label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="f.eks. Grimstad, Norge"
              className="max-w-md text-base h-12"
            />
          </div>

          {/* Contact Email */}
          <div className="space-y-3">
            <label htmlFor="contact-email" className="font-display text-base uppercase tracking-wider block">
              E-post for kontakt <span className="text-destructive">*</span>
            </label>
            <Input
              id="contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="din@epost.no"
              className="max-w-md text-base h-12"
              required
            />
            <p className="text-sm text-muted-foreground">
              Brukes slik at kjøpere kan ta kontakt med deg om annonser.
            </p>
          </div>

          {/* Contact Phone */}
          <div className="space-y-3">
            <label htmlFor="contact-phone" className="font-display text-base uppercase tracking-wider block">
              Telefon (valgfritt)
            </label>
            <Input
              id="contact-phone"
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="f.eks. 912 34 567"
              className="max-w-md text-base h-12"
            />
            <p className="text-sm text-muted-foreground">
              Valgfritt. Vises på annonsen slik at kjøpere kan ringe eller sende SMS.
            </p>
          </div>

          {/* Favorite Brands */}
          <div className="space-y-4">
            <label className="font-display text-base uppercase tracking-wider flex items-center gap-2 block">
              <Heart className="h-5 w-5" />
              Favorittmerker
            </label>
            <div className="flex flex-wrap gap-3">
              {BRAND_OPTIONS.filter(brand => !['Peugeot', 'Citroën', 'Annet'].includes(brand)).map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className={`px-5 py-3 border-2 font-display text-sm uppercase tracking-wider transition-all min-h-[48px] select-none ${
                    favoriteBrands.includes(brand)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-foreground/20 hover:border-foreground/40'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-5 border-2 border-foreground/10 bg-card" data-guide="owner-visibility">
            <div className="flex items-center gap-4">
              {visiblePublic ? (
                <Eye className="h-6 w-6 text-green-600" />
              ) : (
                <EyeOff className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <p className="font-display text-base uppercase tracking-wider">Vis entusiastprofil offentlig</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {visiblePublic 
                    ? 'Entusiastprofilen din vises på bilene dine og på din offentlige profilside'
                    : 'Entusiastprofilen din er skjult for andre'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={visiblePublic}
              onCheckedChange={setVisiblePublic}
            />
          </div>

          {/* Save Button */}
          <div data-guide="owner-save">
            <button
              onClick={handleSave}
              disabled={!displayName.trim() || !contactEmail.trim() || isSaving || !hasChanges}
              className="px-8 py-4 font-display text-base uppercase tracking-wider text-white transition-all min-h-[56px] flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
              style={{ background: 'hsl(2, 85%, 40%)' }}
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {isSaving ? 'Lagrer...' : profile ? 'Lagre endringer' : 'Opprett entusiastprofil'}
            </button>
          </div>
        </div>
      </div>

      <AvatarCropModal
        open={showCropModal}
        onClose={() => { setShowCropModal(false); setAvatarCropFile(null); }}
        imageFile={avatarCropFile}
        onCropComplete={handleCropComplete}
        isLoading={isUploadingAvatar}
      />
    </motion.div>
  );
}
