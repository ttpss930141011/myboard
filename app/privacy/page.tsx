import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - MyBoard',
  description: 'Privacy Policy for MyBoard collaborative whiteboard platform',
}

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Welcome to MyBoard. We respect your privacy and are committed to protecting your personal data.
            This privacy policy will inform you about how we look after your personal data when you visit
            our website and tell you about your privacy rights and how the law protects you.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <p>We may collect, use, store and transfer different kinds of personal data about you:</p>
          <ul className="list-disc pl-6 mt-2">
            <li><strong>Identity Data:</strong> includes first name, last name, username or similar identifier</li>
            <li><strong>Contact Data:</strong> includes email address</li>
            <li><strong>Technical Data:</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location</li>
            <li><strong>Profile Data:</strong> includes your username, preferences, feedback and survey responses</li>
            <li><strong>Usage Data:</strong> includes information about how you use our website and services</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>To register you as a new user</li>
            <li>To provide and maintain our Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information so that we can improve our Service</li>
            <li>To monitor the usage of our Service</li>
            <li>To detect, prevent and address technical issues</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
          <p>
            We have put in place appropriate security measures to prevent your personal data from being
            accidentally lost, used or accessed in an unauthorised way, altered or disclosed. We use
            industry-standard encryption to protect your data in transit and at rest.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
          <p>
            We may share your information with third-party service providers to monitor and analyze
            the use of our Service or to provide authentication services:
          </p>
          <ul className="list-disc pl-6 mt-2">
            <li><strong>Google OAuth:</strong> For authentication services</li>
            <li><strong>GitHub OAuth:</strong> For authentication services</li>
            <li><strong>Resend:</strong> For email authentication services</li>
          </ul>
          <p className="mt-2">
            These third-party providers have their own privacy policies addressing how they use such information.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
          <p>
            We will only retain your personal data for as long as reasonably necessary to fulfil the purposes
            we collected it for, including for the purposes of satisfying any legal, regulatory, tax,
            accounting or reporting requirements.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
          <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Request access to your personal data</li>
            <li>Request correction of your personal data</li>
            <li>Request erasure of your personal data</li>
            <li>Object to processing of your personal data</li>
            <li>Request restriction of processing your personal data</li>
            <li>Request transfer of your personal data</li>
            <li>Right to withdraw consent</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Cookies</h2>
          <p>
            We use cookies and similar tracking technologies to track the activity on our Service and store
            certain information. You can instruct your browser to refuse all cookies or to indicate when
            a cookie is being sent. However, if you do not accept cookies, you may not be able to use
            some portions of our Service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Children&apos;s Privacy</h2>
          <p>
            Our Service does not address anyone under the age of 13. We do not knowingly collect personally
            identifiable information from anyone under the age of 13. If you are a parent or guardian and
            you are aware that your child has provided us with Personal Data, please contact us.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting
            the new Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date at the top of this
            Privacy Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul className="list-none mt-2">
            <li>Email: privacy@myboard.com</li>
            <li>Website: myboard.com</li>
          </ul>
        </section>
      </div>
    </div>
  )
}