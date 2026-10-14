import Image from "next/image";

/** Selected concept 4: an open flowing id monogram and wordmark. */
export function BrandLogo({ showTag = false }: { showTag?: boolean }) {
  return (
    <>
      <Image
        className="lp-logo-image"
        src="/brand/options/04-monogram.png"
        alt="IDIBAGES"
        width={2172}
        height={724}
        priority={showTag}
      />
      {showTag && <span className="lp-brand-tag">ERP</span>}
    </>
  );
}
