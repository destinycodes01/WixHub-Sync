import { useState } from 'react';
import { User } from 'firebase/auth';
import { Code, Copy, CheckCircle2 } from 'lucide-react';

interface FormIntegrationProps {
  user: User;
}

export default function FormIntegration({ user }: FormIntegrationProps) {
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${window.location.origin}/api/sync/wix-to-hubspot`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-neutral-card rounded-xl shadow-sm border border-neutral-border overflow-hidden">
      <div className="p-6 border-b border-neutral-border">
        <h2 className="text-lg font-semibold text-neutral-text">Form Integration</h2>
        <p className="text-sm text-neutral-subtext mt-1">Capture leads from your Wix forms directly into HubSpot.</p>
      </div>
      
      <div className="p-6 space-y-8">
        {/* Option 1: Webhook */}
        <div>
          <h3 className="text-md font-medium text-neutral-text mb-3 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-blue-main/10 text-brand-blue-main text-sm font-bold">1</span>
            Use Wix Automations (Recommended)
          </h3>
          <p className="text-sm text-neutral-subtext mb-4 ml-8">
            Set up a Wix Automation to send form submissions to this webhook URL. We will automatically map the fields based on your configuration and create/update the contact in HubSpot.
          </p>
          <div className="ml-8 flex items-center gap-3">
            <div className="flex-1 bg-neutral-bg border border-neutral-border rounded-lg px-4 py-3 font-mono text-sm text-neutral-text truncate">
              {webhookUrl}
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white bg-brand-blue-main rounded-lg hover:bg-brand-blue-light transition-colors shadow-sm"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
        </div>

        <hr className="border-neutral-border" />

        {/* Option 2: Embed Code */}
        <div>
          <h3 className="text-md font-medium text-neutral-text mb-3 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-blue-main/10 text-brand-blue-main text-sm font-bold">2</span>
            Embed HubSpot Form
          </h3>
          <p className="text-sm text-neutral-subtext mb-4 ml-8">
            Alternatively, you can embed a HubSpot form directly on your Wix site using an HTML iframe. This bypasses Wix forms entirely.
          </p>
          <div className="ml-8 bg-gray-900 rounded-lg p-4 relative group">
            <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
{`<!-- Add this code to an HTML element in Wix -->
<script charset="utf-8" type="text/javascript" src="//js.hsforms.net/forms/embed/v2.js"></script>
<script>
  hbspt.forms.create({
    region: "na1",
    portalId: "YOUR_PORTAL_ID",
    formId: "YOUR_FORM_ID"
  });
</script>`}
            </pre>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-md text-gray-300 transition-colors">
                <Code className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
