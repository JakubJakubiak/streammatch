import type { ReactNode } from 'react'

import { site } from '../site'

/** Shared layout for the policy pages. */
export function Legal({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <a href="#/" className="text-sm font-medium text-brand hover:underline">← Back to home</a>
      <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {site.lastUpdated}</p>
      <div className="mt-10 space-y-8 leading-7 text-zinc-300 [&_a]:text-brand [&_a]:underline [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </article>
  )
}
