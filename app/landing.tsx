import {
  ArrowRight,
  Check,
  FileImage,
  FileText,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { TOOL_INFO, type ToolId } from '@/lib/workflow';

const groups: { title: string; detail: string; tools: ToolId[] }[] = [
  {
    title: 'Photos & signatures',
    detail: 'Prepare exact-size images for forms, exams and applications.',
    tools: ['photo', 'signature', 'compress', 'sheet'],
  },
  {
    title: 'PDF tools',
    detail: 'Combine, extract, rotate or clean up documents in a few steps.',
    tools: ['pdf', 'merge', 'extract', 'rotatePdf', 'removePages'],
  },
];
const examples: Record<ToolId, string> = {
  photo: 'Resize and crop passport photos',
  signature: 'Prepare a clean signature image',
  compress: 'Fit images under a KB limit',
  sheet: 'Print several photos on one sheet',
  pdf: 'Turn images into a PDF',
  merge: 'Combine multiple PDFs',
  extract: 'Save selected PDF pages',
  rotatePdf: 'Turn sideways PDF pages',
  removePages: 'Delete unwanted PDF pages',
};
export default function Landing() {
  return (
    <>
      <main className="landing">
        <section className="landing-hero">
          <div>
            <p className="eyebrow">PRIVATE FILE TOOLS FOR EVERYDAY FORMS</p>
            <h1>Get your documents ready to submit.</h1>
            <p className="landing-lead">
              Resize photos, prepare signatures and organize PDFs with clear
              steps and an instant download.
            </p>
            <a className="landing-primary" href="/workspace">
              Start with a free tool <ArrowRight size={18} />
            </a>
          </div>
          <div className="landing-trust">
            <ShieldCheck size={28} />
            <strong>Made for simple, safe file work</strong>
            <span>
              Free tools run in your browser. Your original files stay
              unchanged.
            </span>
          </div>
        </section>
        <section className="landing-tools">
          <div className="section-heading">
            <div>
              <p className="eyebrow">CHOOSE A JOB</p>
              <h2>What do you need to do?</h2>
            </div>
            <a href="/workspace">
              Open workspace <ArrowRight size={16} />
            </a>
          </div>
          {groups.map((group) => (
            <div className="landing-group" key={group.title}>
              <div className="group-heading">
                <h3>{group.title}</h3>
                <p>{group.detail}</p>
              </div>
              <div className="landing-grid">
                {group.tools.map((id) => (
                  <a className="feature-card" href={`/tools/${id}`} key={id}>
                    <span className="feature-icon">
                      {id === 'photo' ||
                      id === 'signature' ||
                      id === 'compress' ||
                      id === 'sheet' ? (
                        <FileImage size={22} />
                      ) : (
                        <FileText size={22} />
                      )}
                    </span>
                    <span>
                      <strong>{TOOL_INFO[id].title}</strong>
                      <small>{examples[id]}</small>
                      <em>
                        {id === 'photo' ||
                        id === 'signature' ||
                        id === 'compress' ||
                        id === 'sheet'
                          ? 'Free browser tool'
                          : 'Free browser tool'}
                      </em>
                    </span>
                    <ArrowRight size={18} />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>
        <section className="landing-benefits">
          <div>
            <Sparkles size={22} />
            <strong>Simple by design</strong>
            <span>No confusing settings until you need them.</span>
          </div>
          <div>
            <Check size={22} />
            <strong>Preview before download</strong>
            <span>Check the result before submitting it.</span>
          </div>
          <div>
            <ShieldCheck size={22} />
            <strong>Privacy first</strong>
            <span>Files stay in your browser for current tools.</span>
          </div>
        </section>
      </main>
    </>
  );
}
