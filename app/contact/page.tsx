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
      <p>Support email can be added here before public launch.</p>
    </InfoPage>
  );
}
