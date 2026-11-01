export default function Logo() {
  return (
    <a href="#" className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-8 w-8">
        <circle cx="16" cy="16" r="14" fill="none" stroke="#e2c27d" strokeOpacity=".6" />
        <circle cx="16" cy="16" r="9" fill="none" stroke="#e2c27d" />
        <circle cx="16" cy="16" r="3" fill="#f1dca8" />
        <circle cx="25" cy="9" r="1.5" fill="#c9b8ff" />
      </svg>
      <span className="font-serif text-xl font-semibold tracking-wide text-white">
        Céu <span className="text-gold-300">Natal</span>
      </span>
    </a>
  )
}
