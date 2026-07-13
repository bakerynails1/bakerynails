import Image from "next/image";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Relación de aspecto real del logo recortado (796x151).
const ASPECT_RATIO = 796 / 151;

const SIZES = {
  sm: 120,
  md: 180,
  lg: 260,
};

export function BrandLogo({ size = "md", className = "" }: BrandLogoProps) {
  const width = SIZES[size];
  const height = Math.round(width / ASPECT_RATIO);

  return (
    <Image
      src="/logo.png"
      alt="Bakery Nails"
      width={width}
      height={height}
      priority
      // el logo original trae fondo blanco (JPEG, sin transparencia);
      // multiply lo funde con cualquier fondo claro de la página.
      className={`mix-blend-multiply ${className}`}
    />
  );
}
