/** A screenshot inside a phone-shaped frame. */
export function Phone({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[2.4rem] border border-white/10 bg-surface p-1.5 shadow-2xl shadow-brand/20 ${className}`}
    >
      <img src={src} alt={alt} loading="lazy" className="block w-full rounded-[2rem]" />
    </div>
  )
}
