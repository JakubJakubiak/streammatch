import { useEffect, useState } from 'react'

import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { DeleteAccount } from './pages/DeleteAccount'
import { Home } from './pages/Home'
import { Privacy } from './pages/Privacy'
import { Terms } from './pages/Terms'

const PAGES = {
  '#/privacy': Privacy,
  '#/terms': Terms,
  '#/delete-account': DeleteAccount,
} as const

const isPage = (hash: string): hash is keyof typeof PAGES => hash in PAGES

/** Hash routing keeps the site a single static file that any host can serve. */
function useHash() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const update = () => setHash(window.location.hash)
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  return hash
}

export default function App() {
  const hash = useHash()
  const Page = isPage(hash) ? PAGES[hash] : Home

  useEffect(() => {
    if (isPage(hash)) window.scrollTo(0, 0)
  }, [hash])

  return (
    <div className="min-h-screen overflow-x-clip">
      <Header />
      <main>
        <Page />
      </main>
      <Footer />
    </div>
  )
}
