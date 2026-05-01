import { useEffect, useState } from "react";

/**
 * Hides UI (returns false) when the user scrolls down past `threshold`,
 * shows it again (returns true) when scrolling up or near the top.
 *
 * Used for header/bottom-nav auto-hide so chrome gets out of the way.
 */
export function useHideOnScroll(threshold = 12) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY;

      if (y < 80) {
        setVisible(true);
      } else if (delta > threshold) {
        setVisible(false);
        lastY = y;
      } else if (delta < -threshold) {
        setVisible(true);
        lastY = y;
      }

      // Track small movements without flipping state
      if (Math.abs(delta) <= threshold) {
        // no-op, but keep lastY moving slowly so we don't accumulate drift
      } else {
        lastY = y;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return visible;
}
