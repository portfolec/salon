interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  dark?: boolean
}

export default function Logo({ size = 'md', dark = false }: LogoProps) {
  const scales = { sm: 0.85, md: 1.1, lg: 1.45 }
  const s = scales[size]
  const color = dark ? '#ffffff' : '#1a1a1a'
  const accentColor = '#8b6b4a'

  return (
    <svg
      width={Math.round(132 * s)}
      height={Math.round(76 * s)}
      viewBox="0 0 132 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Стильный Акцент - Центр красоты"
    >
      <text
        x="66"
        y="30"
        textAnchor="middle"
        fontFamily="Playfair Display, serif"
        fontSize="34"
        fontWeight="600"
        letterSpacing="-1"
        fill={color}
      >
        СА
      </text>
      <line x1="18" y1="38" x2="114" y2="38" stroke={accentColor} strokeWidth="1" opacity="0.7" />
      <text
        x="66"
        y="52"
        textAnchor="middle"
        fontFamily="Outfit, sans-serif"
        fontSize="8.5"
        fontWeight="500"
        letterSpacing="2.5"
        fill={color}
      >
        СТИЛЬНЫЙ АКЦЕНТ
      </text>
      <text
        x="66"
        y="66"
        textAnchor="middle"
        fontFamily="Playfair Display, Georgia, serif"
        fontStyle="italic"
        fontSize="11"
        fontWeight="400"
        fill={accentColor}
        letterSpacing="0.5"
      >
        Центр красоты
      </text>
    </svg>
  )
}
