import { Link } from "react-router-dom";
import { Send, Wrench, ArrowRight } from "lucide-react";
export function CTASection() {
  return <section className="relative overflow-hidden py-8 md:py-12 bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-500">
      {/* Bold diagonal stripes */}
      <div className="absolute inset-0 opacity-20" style={{
      backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 20px,
            rgba(0,0,0,0.3) 20px,
            rgba(0,0,0,0.3) 40px
          )`
    }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Send inn bil CTA */}
          <div className="bg-card rounded-xl p-5 md:p-6 shadow-lg border border-foreground/10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Send className="w-5 h-5 md:w-6 md:h-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base md:text-lg mb-1">
                  HAR DU EN BIL Å DELE?
                </h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  Del historien om din klassiker med bilentusiaster i Norge.
                </p>
                <Link to="/send-inn" className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                  Send inn din bil
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Deler CTA */}
          <div className="bg-card rounded-xl p-5 md:p-6 shadow-lg border border-foreground/10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base md:text-lg mb-1">
                  TRENGER DU DELER?
                </h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  Bla i vårt utvalg av deler og annonser.
                </p>
                <Link to="/markedsplass" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                  Markedsplass
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}