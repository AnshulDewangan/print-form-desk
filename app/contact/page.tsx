import InfoPage from '../info-page';

export const metadata = { title: 'Contact · Print & Form Desk' };

export default function ContactPage() {
  return (
    <InfoPage eyebrow="Support" title="Contact & Support">
      <p>
        For support, keep the message short and include the tool name, browser,
        and what you expected to download.
      </p>
      <h2>Common issues</h2>
      <ul>
        <li>
          Payment completed but access not active: open Plans & billing and use
          Refresh access.
        </li>
        <li>
          Download not saving: try a normal browser download folder and check
          pop-up/download permissions.
        </li>
        <li>
          Portal rejected a file: compare width, height, format and KB limit
          against the official instruction.
        </li>
      </ul>
      <h2>Safe support rule</h2>
      <p>
        Do not share OTPs, passwords, UPI PINs, full card numbers or identity
        documents unless a trusted official support channel specifically
        requires them.
      </p>
      <section className="support-contact">
        <h2>Get in touch</h2>
        <p>
          Email{' '}
          <a href="mailto:printandform@gmail.com">printandform@gmail.com</a> for
          tool issues, account questions, payment problems or privacy requests.
        </p>
        <a
          className="support-email"
          href="mailto:printandform@gmail.com?subject=Print%20%26%20Form%20Desk%20support"
        >
          Email support
        </a>
        <p>
          Your email app will open. Nothing is sent until you send the message.
        </p>
      </section>
      <h2>Find an answer</h2>
      <div className="support-faq">
        <details>
          <summary>Which files can I use?</summary>
          <p>
            Photo tools accept JPG, PNG and WebP images up to 20 MB each, with
            up to 30 images in a workspace. PDF tools accept up to 300 pages per
            job within a 60 MB workspace. Merge supports up to 12 PDFs; the
            other PDF tools work on the selected PDF.
          </p>
        </details>
        <details>
          <summary>Why is my PDF rejected?</summary>
          <p>
            Password-protected, damaged and interactive-form PDFs are not
            supported by the current tools. Use an unprotected, flattened copy
            you are authorized to process. Keep the original if signatures or
            form fields matter.
          </p>
        </details>
        <details>
          <summary>How do I enter page numbers?</summary>
          <p>
            Use commas and ranges, such as 1, 3, 5-8. Extract saves those pages
            in that order. Remove deletes them; at least one page must remain.
            Rotate changes the selected pages, or all pages when the field is
            empty.
          </p>
        </details>
        <details>
          <summary>My photo was rejected by an application portal.</summary>
          <p>
            Check the portal’s required width, height, file format and maximum
            KB separately. Use Photo resizer for dimensions and Reduce file size
            for the upload limit. Preview the face or signature before
            downloading; no tool can guarantee acceptance by a third-party
            portal.
          </p>
        </details>
        <details>
          <summary>Why do printed photos come out the wrong size?</summary>
          <p>
            Download the print PDF and select Actual size or 100% in the print
            dialog. Turn off Fit to page. Match the paper size to A4 or 4 × 6 as
            selected in the tool.
          </p>
        </details>
        <details>
          <summary>Where are my files and saved sizes stored?</summary>
          <p>
            Current file tools process files on your device. Reloading or
            closing the tab clears the working files. Saved sizes remain in this
            browser; paid account templates store names and settings, not your
            documents.
          </p>
        </details>
        <details>
          <summary>Do I need an account?</summary>
          <p>
            The nine main tools work without signing in. An account is needed
            for paid application packs and account templates. Review Pricing for
            the difference between free tools and paid passes.
          </p>
        </details>
        <details>
          <summary>I paid but cannot access my pass.</summary>
          <p>
            Sign in with the same account used for checkout, open Plans &
            billing and select Refresh access. If access is still missing, email
            your plan name, payment time and payment ID. Do not pay again just
            to try to restore access.
          </p>
        </details>
      </div>
      <h2>Help us reproduce an issue</h2>
      <ol>
        <li>Name the tool and describe the result you expected.</li>
        <li>Include your browser and device, plus the exact error message.</li>
        <li>
          For a file issue, include its format, approximate size and page count.
          Start without attaching personal documents.
        </li>
      </ol>
    </InfoPage>
  );
}
