/**
 * Dev-only overflow detector
 * Logs elements that cause horizontal scroll in the console
 * Only runs in development mode
 */

export function initOverflowDetector() {
  // Only run in development
  if (import.meta.env.PROD) return;

  const checkOverflow = () => {
    const docWidth = document.documentElement.offsetWidth;
    const windowWidth = window.innerWidth;
    
    // Check if there's horizontal overflow
    if (docWidth <= windowWidth) {
      return; // No overflow detected
    }

    console.warn(
      `🚨 Horizontal overflow detected! Document width: ${docWidth}px, Window width: ${windowWidth}px, Overflow: ${docWidth - windowWidth}px`
    );

    // Find all elements that exceed the viewport
    const allElements = document.querySelectorAll('*');
    const overflowingElements: { element: Element; right: number; overflow: number }[] = [];

    allElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      
      // Check if element extends beyond viewport on the right
      if (rect.right > windowWidth) {
        overflowingElements.push({
          element: el,
          right: rect.right,
          overflow: rect.right - windowWidth,
        });
      }
      
      // Check if element extends beyond viewport on the left (negative position)
      if (rect.left < 0 && Math.abs(rect.left) + rect.width > windowWidth) {
        // This element might be causing issues if it's wider than viewport
      }
    });

    if (overflowingElements.length > 0) {
      // Sort by overflow amount (largest first)
      overflowingElements.sort((a, b) => b.overflow - a.overflow);
      
      console.group('📏 Elements causing horizontal overflow:');
      
      // Show top 10 worst offenders
      overflowingElements.slice(0, 10).forEach(({ element, right, overflow }, index) => {
        const tagName = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : '';
        const classes = element.className && typeof element.className === 'string' 
          ? `.${element.className.split(' ').filter(Boolean).slice(0, 3).join('.')}` 
          : '';
        const identifier = `${tagName}${id}${classes}`;
        
        console.log(
          `${index + 1}. %c${identifier}%c - Right: ${Math.round(right)}px, Overflow: ${Math.round(overflow)}px`,
          'color: #ff6b6b; font-weight: bold',
          'color: inherit',
          element
        );
      });
      
      console.groupEnd();
    }
  };

  // Run check after a short delay to let animations settle
  const runCheck = () => {
    setTimeout(checkOverflow, 100);
  };

  // Check on load
  if (document.readyState === 'complete') {
    runCheck();
  } else {
    window.addEventListener('load', runCheck);
  }

  // Check on resize
  window.addEventListener('resize', () => {
    clearTimeout((window as any).__overflowCheckTimeout);
    (window as any).__overflowCheckTimeout = setTimeout(checkOverflow, 300);
  });

  // Check on route changes (for SPAs)
  const observer = new MutationObserver(() => {
    clearTimeout((window as any).__overflowMutationTimeout);
    (window as any).__overflowMutationTimeout = setTimeout(checkOverflow, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
  });

  // Expose manual check function to console
  (window as any).checkOverflow = checkOverflow;
  
  console.log(
    '%c🔍 Overflow detector active. Run %ccheckOverflow()%c in console to manually check.',
    'color: #4ecdc4',
    'color: #ffe66d; font-weight: bold',
    'color: #4ecdc4'
  );
}
