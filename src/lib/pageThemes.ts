/**
 * Page-type–aware color themes for public pages (/s/:slug).
 * Each page_type maps to a set of accent HSL values that override
 * the CSS custom properties --page-accent and --page-accent-light.
 * Components use these variables, so theming is automatic.
 */

export interface PageTheme {
  accent: string;      // HSL values for --page-accent
  accentLight: string; // HSL values for --page-accent-light
  gradient: string;    // CSS gradient for subtle glow effects
}

const themes: Record<string, PageTheme> = {
  business: {
    accent: "37 90% 55%",
    accentLight: "45 100% 70%",
    gradient: "linear-gradient(135deg, #F5A623, #FFD166)",
  },
  collection: {
    accent: "263 70% 58%",
    accentLight: "263 85% 73%",
    gradient: "linear-gradient(135deg, #7C3AED, #A78BFA)",
  },
  dealer: {
    accent: "160 60% 45%",
    accentLight: "160 70% 60%",
    gradient: "linear-gradient(135deg, #10B981, #6EE7B7)",
  },
  museum: {
    accent: "30 85% 55%",
    accentLight: "35 90% 70%",
    gradient: "linear-gradient(135deg, #D97706, #FBBF24)",
  },
  workshop: {
    accent: "20 80% 52%",
    accentLight: "25 85% 65%",
    gradient: "linear-gradient(135deg, #EA580C, #FB923C)",
  },
  garage: {
    accent: "210 15% 55%",
    accentLight: "210 20% 70%",
    gradient: "linear-gradient(135deg, #64748B, #94A3B8)",
  },
  club: {
    accent: "210 75% 50%",
    accentLight: "210 85% 65%",
    gradient: "linear-gradient(135deg, #2563EB, #60A5FA)",
  },
};

const defaultTheme: PageTheme = themes.business;

export function getPageTheme(pageType: string): PageTheme {
  return themes[pageType] ?? defaultTheme;
}

/** Returns CSS custom property overrides as a style object */
export function getPageThemeStyle(pageType: string): React.CSSProperties {
  const t = getPageTheme(pageType);
  return {
    "--page-accent": t.accent,
    "--page-accent-light": t.accentLight,
  } as React.CSSProperties;
}
