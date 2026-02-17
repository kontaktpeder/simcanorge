import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ShoppingBag, MapPin, User, ChevronRight, ChevronLeft } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { useMarketplaceItemBySlug } from '@/hooks/useMarketplace';

export default function AnnonseDetalj() {
  const { slug } = useParams<{ slug: string }>();
  const { data: item, isLoading } = useMarketplaceItemBySlug(slug);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Laster annonse...</div>
        </div>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout>
        <Helmet><title>Annonse ikke funnet | Simca Norge</title></Helmet>
        <PageHeader title="Annonse ikke funnet" subtitle="Denne annonsen finnes ikke eller er ikke publisert." />
        <div className="container py-12 text-center">
          <Link to="/markedsplass" className="text-primary hover:underline inline-flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> Tilbake til markedsplassen
          </Link>
        </div>
      </Layout>
    );
  }

  const images = [...(item.marketplace_images || [])].sort(
    (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
  );
  const owner = item.owners as any;
  const category = item.marketplace_categories as any;

  return (
    <Layout>
      <Helmet>
        <title>{item.title} | Markedsplass – Simca Norge</title>
        <meta name="description" content={item.description?.slice(0, 160) || `${item.title} til salgs på Simca Norge`} />
      </Helmet>

      <section className="container py-8 sm:py-12">
        <Link to="/markedsplass" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-6">
          <ChevronLeft className="h-4 w-4" /> Markedsplass
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            {images.length > 0 ? (
              <div className="grid gap-2">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                  <img src={images[0].image_url} alt={item.title} className="w-full h-full object-cover" />
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.slice(1, 5).map((img: any) => (
                      <div key={img.id} className="aspect-square rounded-lg overflow-hidden bg-muted">
                        <img src={img.image_url} alt={img.alt_text || item.title} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-xl bg-muted flex items-center justify-center">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}

            {/* Title & price */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl sm:text-3xl font-bold">{item.title}</h1>
              {item.price && (
                <p className="text-2xl font-bold text-primary mt-2">{Number(item.price).toLocaleString('nb-NO')} kr</p>
              )}
              {item.price_note && (
                <p className="text-sm text-muted-foreground mt-1">{item.price_note}</p>
              )}
              {category && <Badge variant="secondary" className="mt-3">{category.name}</Badge>}
              {item.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                  <MapPin className="h-3.5 w-3.5" /> {item.location}
                </p>
              )}
            </motion.div>

            {/* Description */}
            {item.description && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="text-lg font-semibold mb-2">Beskrivelse</h2>
                <div className="prose prose-gray max-w-none text-foreground/90 whitespace-pre-line">
                  {item.description}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Seller card */}
          <div className="space-y-4">
            {owner && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl border p-5 sm:p-6"
              >
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Selger</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{owner.display_name}</p>
                    {owner.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {owner.location}
                      </p>
                    )}
                  </div>
                </div>
                {owner.slug && (
                  <Link
                    to={`/profil/${owner.slug}`}
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Se profil <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
