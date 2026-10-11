import { Phone } from '../components/Phone'
import { StoreButtons } from '../components/StoreButtons'
import { site } from '../site'

const FEATURES = [
  {
    title: 'Sign in with Twitch',
    text: 'No forms and no fake profiles. Your avatar, bio and channel come straight from Twitch.',
  },
  {
    title: 'Streamers near you',
    text: 'Pick a radius from 10 to 300 km and see who streams around the corner. Only the distance is shown, never your position.',
  },
  {
    title: 'See who is live',
    text: 'A live badge shows the game and viewer count, so you can drop into the stream before you say hi.',
  },
  {
    title: 'Friends, collabs or dating',
    text: 'Say what you are looking for. Shared interests are highlighted on every card.',
  },
  {
    title: 'Chat the moment you match',
    text: 'When the like is mutual, the conversation opens instantly and updates in real time.',
  },
  {
    title: 'You stay in control',
    text: 'Block and report in two taps, hide your profile, turn location off, or delete your account for good.',
  },
]

const STEPS = [
  { title: 'Connect Twitch', text: 'One tap. We never post to your channel or read your email.' },
  { title: 'Swipe the deck', text: 'Live streamers first, then people who share your interests, then whoever is closest.' },
  { title: 'Match and meet', text: 'Plan a duo queue, a raid, a collab stream — or a coffee.' },
]

const PLANS = [
  {
    name: 'Free',
    tagline: 'Everything you need to start',
    perks: [`${site.freeDailyLikes} likes every day`, 'Nearby search', 'Unlimited matches and chat', 'Occasional ads in the deck'],
    highlighted: false,
  },
  {
    name: 'Premium',
    tagline: 'For people who swipe a lot',
    perks: ['Unlimited likes', 'No ads', 'Everything in Free', 'Weekly, yearly — or pay once and keep it forever'],
    highlighted: true,
  },
]

const FAQ = [
  {
    q: 'Do I need to be a streamer?',
    a: 'No. Any Twitch account works — viewers, mods and streamers are all welcome.',
  },
  {
    q: 'What does the app get from Twitch?',
    a: 'Your public profile: user id, username, avatar, bio, follower count and whether you are live. We do not ask for your email and cannot post or chat on your behalf.',
  },
  {
    q: 'How precise is my location?',
    a: 'It is rounded to roughly one kilometre before it is stored, and other people only ever see a distance such as "12 km away". Sharing it is optional and you can turn it off in your profile.',
  },
  {
    q: 'How do I delete my account?',
    a: 'In the app: Profile, then Delete account. Your profile, matches and messages are removed immediately.',
  },
  {
    q: 'Is there an age limit?',
    a: 'Yes. StreamMatch is only for people aged 18 or over.',
  },
]

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h2>
    </div>
  )
}

export function Home() {
  return (
    <>
      <section className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-brand/30 via-blush/20 to-transparent blur-3xl"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-16 lg:grid-cols-2 lg:pt-24">
          <div className="space-y-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface px-3 py-1 text-xs font-semibold text-muted">
              <span className="size-2 animate-pulse rounded-full bg-live" />
              See who is live near you
            </p>
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl">
              Meet the people{' '}
              <span className="bg-gradient-to-r from-brand to-blush bg-clip-text text-transparent">
                behind the streams
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted">
              {site.name} is where streamers and viewers find friends, collab partners and dates.
              Sign in with Twitch, swipe, match and chat.
            </p>
            <div id="download" className="scroll-mt-24">
              <StoreButtons />
            </div>
            <p className="text-sm text-muted">Free to use · 18+ only</p>
          </div>

          <div className="relative mx-auto flex w-full max-w-md justify-center lg:max-w-none">
            <Phone
              src="./screens/nearby.png"
              alt="Nearby screen listing streamers by distance"
              className="absolute left-0 top-12 hidden w-52 -rotate-6 opacity-80 sm:block"
            />
            <Phone
              src="./screens/discover.png"
              alt="Discover screen showing a live streamer card"
              className="relative z-10 w-64"
            />
            <Phone
              src="./screens/chat.png"
              alt="Chat between two matched streamers"
              className="absolute right-0 top-12 hidden w-52 rotate-6 opacity-80 sm:block"
            />
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 border-t border-white/5 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <SectionTitle eyebrow="Features" title="Built for people who live on stream" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-white/5 bg-surface p-6 transition hover:border-brand/50"
              >
                <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                <p className="mt-2 leading-7 text-muted">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="scroll-mt-20 border-t border-white/5 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-2">
          <div className="flex justify-center gap-5">
            <Phone src="./screens/match.png" alt="It's a match screen" className="w-52 sm:w-60" />
            <Phone
              src="./screens/user-profile.png"
              alt="A streamer's profile with a Watch on Twitch button"
              className="mt-12 hidden w-52 sm:block sm:w-60"
            />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand">How it works</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              From first swipe to first raid
            </h2>
            <ol className="mt-8 space-y-7">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-blush font-bold text-white">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{step.title}</h3>
                    <p className="mt-1 leading-7 text-muted">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section id="premium" className="scroll-mt-20 border-t border-white/5 py-20">
        <div className="mx-auto max-w-4xl px-5">
          <SectionTitle eyebrow="Premium" title="Free to match. Premium to go all in." />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-3xl border p-7 ${
                  plan.highlighted
                    ? 'border-brand bg-gradient-to-b from-brand/20 to-surface'
                    : 'border-white/5 bg-surface'
                }`}
              >
                <h3 className="text-2xl font-extrabold text-white">{plan.name}</h3>
                <p className="mt-1 text-muted">{plan.tagline}</p>
                <ul className="mt-6 space-y-3">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex gap-3 text-zinc-200">
                      <span className="text-mint" aria-hidden="true">✓</span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted">
            Prices are shown in the app before you buy and depend on your country.
          </p>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 border-t border-white/5 py-20">
        <div className="mx-auto max-w-3xl px-5">
          <SectionTitle eyebrow="FAQ" title="Good to know" />
          <div className="mt-10 space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-white/5 bg-surface px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-white">
                  {item.q}
                  <span className="text-2xl leading-none text-muted transition group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-7 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
