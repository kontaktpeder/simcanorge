import { forwardRef, ImgHTMLAttributes, useCallback, useState } from "react";

type SafeAssetImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** Optional fallback image URL (e.g. /favicon.png) if main src fails */
  fallbackSrc?: string;
};

/**
 * Image that hides itself (or shows fallback) on load error.
 * Use for bundled assets that sometimes fail on mobile Chrome.
 */
export const SafeAssetImage = forwardRef<HTMLImageElement, SafeAssetImageProps>(
  function SafeAssetImage(
    { src, alt, fallbackSrc, onError, className, style, ...rest },
    ref
  ) {
    const [failed, setFailed] = useState(false);
    const [useFallback, setUseFallback] = useState(false);

    const handleError = useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        onError?.(e);
        if (fallbackSrc && !useFallback) {
          e.currentTarget.onerror = null;
          e.currentTarget.src = fallbackSrc;
          setUseFallback(true);
        } else {
          setFailed(true);
        }
      },
      [fallbackSrc, useFallback, onError]
    );

    if (failed) return null;

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={className}
        style={style}
        onError={handleError}
        {...rest}
      />
    );
  }
);
