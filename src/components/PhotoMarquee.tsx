'use client'

const FOTOS: string[] = [
  "https://res.cloudinary.com/drfs4s18a/image/upload/w_440,h_600,c_fill,g_auto,q_auto,f_auto/alunas/aluna1.jpg",
  "https://res.cloudinary.com/drfs4s18a/image/upload/w_440,h_600,c_fill,g_auto,q_auto,f_auto/alunas/aluna2.jpg",
  "https://res.cloudinary.com/drfs4s18a/image/upload/w_440,h_600,c_fill,g_auto,q_auto,f_auto/alunas/aluna3.jpg",
  "https://res.cloudinary.com/drfs4s18a/image/upload/w_440,h_600,c_fill,g_auto,q_auto,f_auto/alunas/aluna4.jpg",
  "https://res.cloudinary.com/drfs4s18a/image/upload/w_440,h_600,c_fill,g_auto,q_auto,f_auto/alunas/aluna5.jpg",
  "https://res.cloudinary.com/drfs4s18a/image/upload/w_440,h_600,c_fill,g_auto,q_auto,f_auto/alunas/aluna6.jpg",
  "https://res.cloudinary.com/drfs4s18a/image/upload/w_440,h_600,c_fill,g_auto,q_auto,f_auto/alunas/aluna7.jpg",
  "https://res.cloudinary.com/drfs4s18a/image/upload/w_440,h_600,c_fill,g_auto,q_auto,f_auto/alunas/aluna8.jpg",
]

const PLACEHOLDER_COUNT = 10

export function PhotoMarquee() {
  const hasPhotos = FOTOS.length > 0
  const items = hasPhotos
    ? [...FOTOS, ...FOTOS]
    : Array.from({ length: PLACEHOLDER_COUNT * 2 }, (_, i) => i)

  return (
    <div style={{ overflow: 'hidden', padding: '16px 0' }}>
      <div className="marquee-track">
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              width: '220px',
              height: '300px',
              borderRadius: '16px',
              marginRight: '12px',
              flexShrink: 0,
              overflow: 'hidden',
              position: 'relative',
              background: '#111111',
            }}
          >
            {hasPhotos ? (
              <>
                <img
                  src={item as string}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                  loading="lazy"
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 30%, transparent 65%, rgba(0,0,0,0.45) 100%)',
                  }}
                />
                <div style={{ position: 'absolute', bottom: '12px', left: '14px' }}>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: '700',
                    letterSpacing: '0.15em',
                    color: 'rgba(245,200,66,0.75)',
                    textTransform: 'uppercase',
                  }}>
                    Aluna RV ✦
                  </span>
                </div>
              </>
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(245,200,66,0.07)',
                  borderRadius: '16px',
                }}
              >
                <div style={{ fontSize: '26px', opacity: 0.2, marginBottom: '8px' }}>✦</div>
                <div style={{
                  color: 'rgba(245,200,66,0.2)',
                  fontSize: '9px',
                  fontWeight: '700',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}>
                  Aluna RV
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
