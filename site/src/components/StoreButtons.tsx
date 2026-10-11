import { site } from '../site'

const STORES = [
  { name: 'App Store', caption: 'Download on the', url: site.appStoreUrl },
  { name: 'Google Play', caption: 'Get it on', url: site.playStoreUrl },
]

export function StoreButtons() {
  return (
    <div className="flex flex-wrap gap-3">
      {STORES.map((store) => {
        const live = store.url !== ''
        const Tag = live ? 'a' : 'div'
        return (
          <Tag
            key={store.name}
            {...(live ? { href: store.url } : { 'aria-disabled': true })}
            className={`flex min-w-44 flex-col rounded-2xl border border-white/10 bg-surface px-5 py-3 ${
              live ? 'transition hover:border-brand' : 'opacity-70'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wide text-muted">
              {live ? store.caption : 'Coming soon to'}
            </span>
            <span className="text-lg font-semibold text-white">{store.name}</span>
          </Tag>
        )
      })}
    </div>
  )
}
