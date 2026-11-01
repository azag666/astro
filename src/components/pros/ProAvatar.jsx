// Foto da especialista; sem foto, inicial/glifo num círculo com gradiente
export default function ProAvatar({ pro, size = 'h-14 w-14 text-2xl' }) {
  if (pro.foto) return <img src={pro.foto} alt={pro.name} className={`shrink-0 rounded-full object-cover ring-2 ring-gold-400/40 ${size}`} />
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-full font-serif text-white ${size}`} style={{ background: `linear-gradient(135deg, ${pro.from}, ${pro.to})` }}>
      {pro.glyph}
    </span>
  )
}
