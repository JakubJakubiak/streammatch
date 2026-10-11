import { Legal } from '../components/Legal'
import { site } from '../site'

export function Privacy() {
  return (
    <Legal title="Privacy Policy">
      <section>
        <p>
          This policy explains what {site.name} collects, why, and what you can do about it.
          Questions: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
        </p>
      </section>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>From Twitch, when you sign in:</strong> your Twitch user id, username, display
            name, avatar, channel description, broadcaster type, follower count and whether you are
            currently live (with the game, stream title and viewer count). We do not request your
            email address and cannot act on your Twitch account.
          </li>
          <li>
            <strong>What you add:</strong> your bio, interests, what you are looking for, and your
            discovery settings.
          </li>
          <li>
            <strong>Approximate location, only if you turn it on:</strong> rounded to about one
            kilometre before it is stored. Other people see a distance, never coordinates.
          </li>
          <li>
            <strong>Activity in the app:</strong> who you liked or skipped, your matches, the
            messages you send, and any blocks or reports you make.
          </li>
          <li>
            <strong>Purchases:</strong> whether you have Premium and until when. Payments are
            handled by Apple or Google; we never see your card details.
          </li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To show your profile to other members and theirs to you.</li>
          <li>To find people near you and order the deck.</li>
          <li>To deliver matches and messages.</li>
          <li>To keep the service safe, including reviewing reports.</li>
          <li>To unlock Premium features you paid for.</li>
        </ul>
        <p className="mt-3">We do not sell your personal data.</p>
      </section>

      <section>
        <h2>Who processes it for us</h2>
        <ul>
          <li><strong>Convex</strong> — database and backend hosting.</li>
          <li><strong>Twitch</strong> — sign-in and public channel data.</li>
          <li><strong>RevenueCat, Apple and Google</strong> — subscription status and payments.</li>
        </ul>
      </section>

      <section>
        <h2>Your choices</h2>
        <ul>
          <li>Edit your bio, interests and settings any time in the Profile tab.</li>
          <li>Turn location sharing off, which removes your stored position.</li>
          <li>Hide your profile from new people with "Show me in Discover".</li>
          <li>
            Delete your account in the app (Profile → Delete account). See{' '}
            <a href="#/delete-account">Delete your account</a> for details.
          </li>
          <li>Ask us for a copy of your data, or for a correction, by email.</li>
        </ul>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>
          We keep your data while your account exists. Deleting your account removes your profile,
          likes, matches, messages, blocks and sessions immediately. Reports you were involved in
          may be kept for safety purposes.
        </p>
      </section>

      <section>
        <h2>Age</h2>
        <p>{site.name} is for adults aged 18 and over. We remove accounts of anyone under 18.</p>
      </section>
    </Legal>
  )
}
