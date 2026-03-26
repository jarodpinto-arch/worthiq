import Image from "next/image";

const LOGO_SRC = "/brand/worthiq-logo.png";

type WorthIQLogoProps = {
  /** Tailwind width classes, e.g. `w-10 lg:w-32` */
  className?: string;
  priority?: boolean;
};

export function WorthIQLogo({
  className = "w-36",
  priority,
}: WorthIQLogoProps) {
  return (
    <Image
      src={LOGO_SRC}
      alt="WorthIQ"
      width={1024}
      height={1024}
      className={`h-auto max-w-full ${className}`.trim()}
      priority={priority}
    />
  );
}
