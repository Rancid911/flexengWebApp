import Image from "next/image";

type BlogCoverImageProps = {
  alt: string;
  src: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

function isOptimizableBlogImage(src: string) {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}

export function BlogCoverImage({ alt, src, sizes, priority = false, className }: BlogCoverImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!isOptimizableBlogImage(src)}
      className={className}
    />
  );
}
