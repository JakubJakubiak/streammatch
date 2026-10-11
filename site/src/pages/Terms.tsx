import { Legal } from '../components/Legal'
import { site } from '../site'

export function Terms() {
  return (
    <Legal title="Terms of Use">
      <section>
        <h2>Who can use {site.name}</h2>
        <p>
          You must be at least 18 years old and have a Twitch account in good standing. One person,
          one account.
        </p>
      </section>

      <section>
        <h2>House rules</h2>
        <ul>
          <li>Be yourself. No impersonation and no fake profiles.</li>
          <li>No harassment, hate speech, threats or sexual content involving minors.</li>
          <li>No spam, scams, advertising or asking other members for money.</li>
          <li>Do not share someone else's private information.</li>
          <li>Do not scrape the service or try to locate other members.</li>
        </ul>
        <p className="mt-3">
          We may remove content or accounts that break these rules. You can block and report anyone
          from their profile.
        </p>
      </section>

      <section>
        <h2>Premium</h2>
        <ul>
          <li>The free plan includes {site.freeDailyLikes} likes per day and shows ads in the deck.</li>
          <li>Premium removes the like limit and the ads.</li>
          <li>
            Subscriptions are sold through the App Store or Google Play, renew automatically, and
            are cancelled and refunded under that store's rules.
          </li>
          <li>Deleting your account does not cancel a subscription. Cancel it in your store account.</li>
        </ul>
      </section>

      <section>
        <h2>Meeting people safely</h2>
        <p>
          We do not run background checks. Use your judgement, meet in public places, and tell
          someone where you are going.
        </p>
      </section>

      <section>
        <h2>The service</h2>
        <p>
          {site.name} is provided as is. Features can change, and we cannot promise that you will
          find a match. {site.name} is independent and is not affiliated with Twitch.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
        </p>
      </section>
    </Legal>
  )
}
