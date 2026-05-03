import { useState } from "react";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { HeroSearch } from "@/components/layout/HeroSearch";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

export function ExploreTopBar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="sticky top-14 md:top-16 z-20 border-b"
        style={{
          background: "rgba(7,11,16,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-[800px] mx-auto px-4 py-3 flex items-center justify-between">
          <span
            className="text-[15px] uppercase tracking-[0.18em] font-bold text-white"
            style={chakra}
          >
            Utforsk
          </span>
          <button
            onClick={() => setOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors"
            aria-label="Søk"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-xl p-0 border-white/10 bg-[#0c1219]"
          style={{ backdropFilter: "blur(8px)" }}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-[12px] uppercase tracking-[0.2em] font-bold text-white/60"
                style={chakra}
              >
                Søk
              </span>
              <button
                onClick={() => setOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <HeroSearch />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
