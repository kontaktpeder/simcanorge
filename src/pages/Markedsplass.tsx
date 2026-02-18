import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, Plus, Info } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/input';
import { useMarketplaceItems, useMarketplaceCategories } from '@/hooks/useMarketplace';

export default function Markedsplass() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const { data: items, isLoading } = useMarketplaceItems({
    search: searchQuery || undefined,
    categoryId: categoryId || undefined,
  });
  const { data: categories } = useMarketplaceCategories();

  const handleOpprettAnnonseClick = () => {
    navigate('/start-annonse');
  };

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
        {/* Banner + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0" />
            Alt som legges ut må godkjennes før publisering.
          </div>
          <button
            onClick={handleOpprettAnnonseClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors w-fit"
          >
            <Plus className="h-4 w-4" />
            Opprett annonse
          </button>
        </div>

        {/* Category tabs */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setCategoryId('')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                !categoryId ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Alt
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  categoryId === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

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

        {/* Listing grid */}
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
