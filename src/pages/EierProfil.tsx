import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { User, MapPin, Heart, Car, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { useOwnerProfileBySlug, useOwnerCars } from '@/hooks/useOwnerProfile';

export default function EierProfil() {
  const { slug } = useParams<{ slug: string }>();
  const { data: owner, isLoading: ownerLoading } = useOwnerProfileBySlug(slug);
  const { data: cars, isLoading: carsLoading } = useOwnerCars(owner?.user_id);

  const isLoading = ownerLoading || carsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Laster eierprofil...</div>
        </div>
      </Layout>
    );
  }

  if (!owner) {
    return (
      <Layout>
        <Helmet>
          <title>Eier ikke funnet | Simca Norge</title>
        </Helmet>
        <PageHeader 
          title="Eier ikke funnet" 
          subtitle="Denne eierprofilen finnes ikke eller er ikke offentlig."
        />
        <div className="container py-12 text-center">
          <Link 
            to="/biler" 
            className="text-primary hover:underline inline-flex items-center gap-2"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Tilbake til bilregisteret
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>{owner.display_name} | Simca Norge</title>
        <meta 
          name="description" 
          content={owner.bio?.slice(0, 160) || `Eierprofil for ${owner.display_name} på Simca Norge`}
        />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-12 sm:py-16 md:py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            {/* Avatar placeholder */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <User className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
            </div>
            
            {/* Name */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              {owner.display_name}
            </h1>
            
            {/* Location */}
            {owner.location && (
              <p className="text-muted-foreground flex items-center justify-center gap-2 mb-4">
                <MapPin className="h-4 w-4" />
                {owner.location}
              </p>
            )}
            
            {/* Favorite Brands */}
            {owner.favorite_brands && owner.favorite_brands.length > 0 && (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Heart className="h-4 w-4 text-red-500" />
                {owner.favorite_brands.map((brand) => (
                  <Badge key={brand} variant="secondary">
                    {brand}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Bio Section */}
      {owner.bio && (
        <section className="py-10 sm:py-12 md:py-16">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="max-w-2xl mx-auto"
            >
              <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Om {owner.display_name}
              </h2>
              <div className="prose prose-gray max-w-none">
                <blockquote className="text-base sm:text-lg leading-relaxed italic border-l-4 border-primary/30 pl-4 py-2 not-italic text-foreground/90">
                  {owner.bio}
                </blockquote>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Cars Section */}
      <section className="py-10 sm:py-12 md:py-16 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
              <Car className="h-6 w-6 text-primary" />
              Biler fra {owner.display_name}
            </h2>

            {cars && cars.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {cars.map((car, index) => {
                  const sortedImages = [...(car.car_images || [])].sort(
                    (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
                  );
                  const mainImage = sortedImages[0];

                  return (
                    <motion.div
                      key={car.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                    >
                      <Link
                        to={`/biler/${car.slug}`}
                        className="group block bg-card rounded-xl border shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
                      >
                        {/* Image */}
                        <div className="aspect-[4/3] bg-muted overflow-hidden">
                          {mainImage ? (
                            <img
                              src={mainImage.image_url}
                              alt={car.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Car className="h-12 w-12 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="p-4">
                          <h3 className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors line-clamp-1">
                            {car.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {[car.brand, car.model, car.year].filter(Boolean).join(' • ')}
                          </p>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border">
                <Car className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Ingen publiserte biler ennå
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Back link */}
      <section className="py-8 sm:py-12">
        <div className="container text-center">
          <Link 
            to="/biler" 
            className="text-primary hover:underline inline-flex items-center gap-2"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Tilbake til bilregisteret
          </Link>
        </div>
      </section>
    </Layout>
  );
}
