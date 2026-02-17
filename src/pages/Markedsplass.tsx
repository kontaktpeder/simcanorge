import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, Car } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { useMarketplaceItems } from '@/hooks/useMarketplace';

export default function Markedsplass() {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: items, isLoading } = useMarketplaceItems({ search: searchQuery || undefined });

  return (
    <Layout>
      <Helmet>
        <title>Markedsplass | Simca Norge</title>
        <meta name="description" content="Kjøp og selg deler, tilbehør og biler fra Simca-entusiaster i Norge." />
      </Helmet>

      <PageHeader
        title="Markedsplass"
        subtitle="Kjøp og selg deler, tilbehør og biler fra Simca-entusiaster"
      />

      <section className="container py-8 sm:py-12">
        {/* Search */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk i annonser..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laster annonser...</div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {items.map((item: any, index: number) => {
              const images = [...(item.marketplace_images || [])].sort(
                (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
              );
              const mainImage = images[0];

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 * index }}
                >
                  <Link
                    to={`/annonse/${item.slug}`}
                    className="group block bg-card rounded-xl border shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    <div className="aspect-[4/3] bg-muted overflow-hidden">
                      {mainImage ? (
                        <img
                          src={mainImage.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      {item.price && (
                        <p className="text-primary font-bold mt-1">
                          {Number(item.price).toLocaleString('nb-NO')} kr
                        </p>
                      )}
                      {item.price_note && !item.price && (
                        <p className="text-sm text-muted-foreground mt-1">{item.price_note}</p>
                      )}
                      {item.owners && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {item.owners.display_name}
                          {item.owners.location && ` · ${item.owners.location}`}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Ingen annonser funnet' : 'Ingen annonser publisert ennå'}
            </p>
          </div>
        )}
      </section>
    </Layout>
  );
}
