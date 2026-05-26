interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  dark?: boolean
}

export default function Logo({ size = 'md', dark = false }: LogoProps) {
  const scales = { sm: 0.65, md: 1.2, lg: 1.7 }
  const s = scales[size]
  const color = dark ? '#ffffff' : '#1a1a1a'
  const accentColor = '#8b6b4a'

  return (
    <svg
      width={Math.round(120 * s)}
      height={Math.round(72 * s)}
      viewBox="0 0 120 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Стильный Акцент — Центр красоты"
    >
      {/* SA monogram */}
      <text
        x="60"
        y="28"
        textAnchor="middle"
        fontFamily="Playfair Display, serif"
        fontSize="30"
        fontWeight="600"
        letterSpacing="-1"
        fill={color}
      >
        СА
      </text>
      {/* thin divider */}
      <line x1="20" y1="35" x2="100" y2="35" stroke={color} strokeWidth="0.5" opacity="0.3" />
      {/* СТИЛЬНЫЙ АКЦЕНТ */}
      <text
        x="60"
        y="47"
        textAnchor="middle"
        fontFamily="Outfit, sans-serif"
        fontSize="7"
        fontWeight="300"
        letterSpacing="3"
        fill={color}
      >
        СТИЛЬНЫЙ АКЦЕНТ
      </text>
      {/* Центр красоты — italic serif accent */}
      <text
        x="60"
        y="61"
        textAnchor="middle"
        fontFamily="Playfair Display, Georgia, serif"
        fontStyle="italic"
        fontSize="9.5"
        fontWeight="400"
        fill={accentColor}
        letterSpacing="0.5"
      >
        Центр красоты
      </text>
    </svg>
  )
}
