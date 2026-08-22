import { productImageFallback } from "../../../lib/imageFallback";
import type { ProductImage } from "../../../types/catalog";

export function ProductImageGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const primaryImage = images[0];

  return (
    <section aria-label={`${productName} images`} className="space-y-3">
      <div className="aspect-[4/5] overflow-hidden rounded border border-ink/10 bg-mist">
        <img
          src={primaryImage?.url ?? productImageFallback}
          alt={primaryImage?.altText ?? productName}
          className="h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.src = productImageFallback;
          }}
        />
      </div>
      {images.length > 1 ? (
        <div className="grid grid-cols-4 gap-3">
          {images.slice(0, 4).map((image) => (
            <img
              key={image.id}
              src={image.url}
              alt={image.altText}
              className="aspect-square rounded border border-ink/10 object-cover"
              onError={(event) => {
                event.currentTarget.src = productImageFallback;
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
