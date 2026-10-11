import { site } from '../site'

export function Logo() {
  return (
    <a href="#/" className="flex items-center gap-2.5 font-extrabold tracking-tight text-white">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-blush">
        <svg viewBox="0 0 24 24" className="size-5 fill-white" aria-hidden="true">
          <path d="M12 21s-8-5-8-11a4.6 4.600 0 0 1 8-3 4.600 4.600 0 0 1 8 3c0 6-8 11-8 11z" />
        </svg>
      </span>
      <span className="text-lg">{site.name}</span>
    </a>
  )
}
