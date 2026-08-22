const fallbackSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 800" role="img" aria-label="Fashion product image unavailable"><rect width="640" height="800" fill="#eef0f2"/><path d="M210 228h220l52 118-66 32-26-58v280H250V320l-26 58-66-32 52-118z" fill="#cfd5d9"/><path d="M272 228c8 28 24 42 48 42s40-14 48-42" fill="none" stroke="#858d93" stroke-width="16" stroke-linecap="round"/><text x="320" y="700" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#596168">Image unavailable</text></svg>`
);

export const productImageFallback = `data:image/svg+xml;charset=utf-8,${fallbackSvg}`;
