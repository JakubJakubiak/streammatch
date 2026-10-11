import { site } from '../site'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-sm leading-6 text-muted">
            For adults 18 and over. {site.name} is an independent app and is not affiliated with,
            sponsored or endorsed by Twitch Interactive, Inc.
          </p>
        </div>
        <nav className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm text-muted">
          <a href="#/privacy" className="hover:text-white">Privacy Policy</a>
          <a href="#/terms" className="hover:text-white">Terms of Use</a>
          <a href="#/delete-account" className="hover:text-white">Delete your account</a>
          <a href={`mailto:${site.contactEmail}`} className="hover:text-white">Contact</a>
        </nav>
      </div>
      <p className="border-t border-white/5 py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} {site.name}
      </p>
    </footer>
  )
}
