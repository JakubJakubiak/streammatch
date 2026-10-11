import { Legal } from '../components/Legal'
import { site } from '../site'

export function DeleteAccount() {
  return (
    <Legal title="Delete your account">
      <section>
        <h2>In the app</h2>
        <ul>
          <li>Open {site.name} and go to the <strong>Profile</strong> tab.</li>
          <li>Scroll to the bottom and tap <strong>Delete account</strong>.</li>
          <li>Confirm. The deletion happens immediately and cannot be undone.</li>
        </ul>
      </section>

      <section>
        <h2>What is deleted</h2>
        <ul>
          <li>Your profile, bio, interests and stored location.</li>
          <li>Your likes and skips, and your matches.</li>
          <li>Every message in your conversations, for both people.</li>
          <li>Your blocks, your Premium record and your sign-in sessions.</li>
        </ul>
      </section>

      <section>
        <h2>What is kept</h2>
        <p>
          Reports involving your account may be kept for safety purposes. Purchase records held by
          Apple, Google and RevenueCat are governed by their own policies.
        </p>
      </section>

      <section>
        <h2>Subscriptions</h2>
        <p>
          Deleting your account does not cancel a Premium subscription. Cancel it first in your App
          Store or Google Play account settings.
        </p>
      </section>

      <section>
        <h2>Cannot open the app?</h2>
        <p>
          Email <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> with your Twitch
          username and we will delete the account for you.
        </p>
      </section>
    </Legal>
  )
}
