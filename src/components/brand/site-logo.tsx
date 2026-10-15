import brandLogo from '@/assets/img/Native Flavour Logo-01.png'

export default function SiteLogo({ size = 48 }: { size?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: 8,
        background: '#FFFFFF',
        border: '1px solid rgba(47,74,58,0.22)',
        flexShrink: 0,
        overflow: 'hidden',
        padding: Math.max(4, Math.round(size * 0.08)),
      }}
    >
      <img
        src={brandLogo}
        alt="Native Flavours"
        width={size}
        height={size}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
      />
    </span>
  )
}
