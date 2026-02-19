/**
 * Preload critical app icons and small assets so they render instantly.
 * Called once at app startup from main.tsx.
 */
import simcaBadge from "@/assets/simca-badge.png";
import simcaBadgeLogo from "@/assets/simca-badge-logo.png";
import simcaNorgeBadge from "@/assets/simca-norge-badge.png";
import simcaSwallow from "@/assets/simca-swallow.png";
import simcaChromeSwallow from "@/assets/simca-chrome-swallow.png";
import toolboxBlue from "@/assets/toolbox-blue.png";
import minSideBadge from "@/assets/min-side-badge.png";
import simcaRallye from "@/assets/simca-rallye-yellow.png";
import checkeredFlag from "@/assets/checkered-flag.png";

const CRITICAL_ASSETS = [
  simcaBadge,
  simcaBadgeLogo,
  simcaNorgeBadge,
  simcaSwallow,
  simcaChromeSwallow,
  toolboxBlue,
  minSideBadge,
  simcaRallye,
  checkeredFlag,
];

export function preloadCriticalAssets() {
  CRITICAL_ASSETS.forEach((src) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    document.head.appendChild(link);
  });
}
