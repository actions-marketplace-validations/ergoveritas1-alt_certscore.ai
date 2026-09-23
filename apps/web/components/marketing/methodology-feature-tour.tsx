"use client";

import { useId, useRef, useState } from "react";

type FeatureSlide = {
  label: string;
  title: string;
  description: string;
  takeaway: string;
  image: string;
  alt: string;
  crop: string;
};

const slides: FeatureSlide[] = [
  {
    label: "Report overview",
    title: "Know where to look first.",
    description: "Start with the signal snapshot, inventory, and priority review. Follow a finding back to the retained evidence that supports it.",
    takeaway: "A clear starting point for your next privacy review.",
    image: "overview", crop: "24 12 1232 435",
    alt: "Actual ErgoVeritas sample report showing the executive overview, consent platform, controls, and resource inventory."
  },
  {
    label: "CMP & controls",
    title: "See the choices a visitor sees.",
    description: "Identify the observed consent-management platform (CMP) and inspect Accept, Reject, and Options controls on the first layer. Control visibility and successful consent registration are reported separately.",
    takeaway: "Go beyond whether a cookie banner exists.",
    image: "consent", crop: "42 20 440 180",
    alt: "Report screenshot identifying OneTrust and showing observed Accept, Reject, and Options controls."
  },
  {
    label: "After Accept / Reject",
    title: "Look beyond the click.",
    description: "When eligible controls and evidence are available, inspect separate after-Accept and after-Reject observations. Compare requests and storage activity, with explicit confirmation and coverage limits.",
    takeaway: "Understand what happened after each available choice.",
    image: "consent", crop: "42 211 440 431",
    alt: "Actual after-Accept comparison baseline and after-Reject request and storage evidence from the ErgoVeritas sample."
  },
  {
    label: "Cookies, services & requests",
    title: "Follow the activity behind the page.",
    description: "Explore cookies, browser storage, services, vendors, and network requests. Review purpose classifications, first-seen timing, first- or third-party relationships, and available policy-disclosure context.",
    takeaway: "Turn a list of technologies into evidence you can investigate.",
    image: "inventory", crop: "24 111 1232 482",
    alt: "Services and Resources report inventory with Google Analytics, a cookie, and a retained network request on ergoveritas.com."
  },
  {
    label: "GPC response",
    title: "See what changes with GPC.",
    description: "Compare the passive baseline with a separate Global Privacy Control observation. Review retained signal-delivery evidence and changes in cookies, trackers, advertising, and consent behavior where coverage supports comparison.",
    takeaway: "A completed GPC observation does not, by itself, establish that the signal was honored.",
    image: "gpc", crop: "696 55 560 537",
    alt: "GPC report comparison showing delivery evidence and baseline-versus-GPC cookie and tracker counts."
  },
  {
    label: "TLS & transport",
    title: "Check how the page communicates.",
    description: "Review HTTPS delivery, SSL/TLS certificate observations, HTTP-to-HTTPS redirects, mixed content, and observed form transport. See which checks were supported by the scan.",
    takeaway: "Transport evidence alongside the privacy signals.",
    image: "transport", crop: "42 310 440 182",
    alt: "Transport security report showing HTTPS, SSL/TLS certificate, redirect, mixed-content, and form-transport checks."
  },
  {
    label: "Forms & fields",
    title: "See what your forms ask for.",
    description: "Inspect observed forms, field labels, types, required states, and checkbox settings. Open masked form screenshots when capture and safety review succeed. CertScore.ai does not fill or submit forms.",
    takeaway: "Concrete details for your data-collection review.",
    image: "forms", crop: "24 166 1232 383",
    alt: "Forms and fields inventory for the owned ErgoVeritas contact form, with four fields, one checkbox, and an available form snapshot."
  }
];

function Capture({ slide, enlarged = false }: { slide: FeatureSlide; enlarged?: boolean }) {
  const clipId = useId();
  const [x, y, width, height] = slide.crop.split(" ").map(Number);
  return (
    <svg role="img" aria-label={slide.alt} viewBox={slide.crop} className={enlarged ? "max-h-[75vh] w-full" : "h-full w-full"}>
      <defs><clipPath id={clipId}><rect x={x} y={y} width={width} height={height} /></clipPath></defs>
      <image key={slide.image} href={`/methodology/${slide.image}.png`} width="1280" height="720" clipPath={`url(#${clipId})`} />
    </svg>
  );
}

export function MethodologyFeatureTour() {
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const slide = slides[active]!;

  return (
    <section id="feature-tour" aria-labelledby="feature-tour-heading" className="scroll-mt-24 border-b border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Inside your report</p>
            <h2 id="feature-tour-heading" className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">See the detail. Find your next step.</h2>
          </div>
          <a href="#free-scan" className="inline-flex min-h-11 shrink-0 items-center gap-2 font-semibold text-sky-700 underline-offset-4 hover:underline">Try it on your website <span aria-hidden="true">↑</span></a>
        </div>
        <div role="group" aria-label="Choose a report feature" className="mt-8 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap">
          {slides.map((item, index) => (
            <button key={item.label} type="button" aria-pressed={active === index} aria-controls="feature-slide" onClick={() => setActive(index)} className={`min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${active === index ? "border-sky-800 bg-sky-800 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-800"}`}>
              {item.label}
            </button>
          ))}
        </div>
        <div id="feature-slide" role="region" aria-roledescription="carousel" aria-label="Report feature tour" className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)]">
          <div className="grid lg:grid-cols-[0.8fr_1.6fr]">
            <div className="flex flex-col p-6 sm:p-8">
              <div aria-live="polite" aria-atomic="true" className="lg:min-h-[275px]">
                <p className="font-mono text-xs text-sky-700">0{active + 1} / 0{slides.length}</p>
                <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-tight text-slate-950">{slide.title}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{slide.description}</p>
                <p className="mt-5 border-l-2 border-sky-400 pl-3 text-sm font-medium leading-6 text-slate-800">{slide.takeaway}</p>
              </div>
              <div className="mt-auto flex items-center gap-3 pt-6">
                <button type="button" aria-label="Previous feature" onClick={() => setActive((active + slides.length - 1) % slides.length)} className="h-11 w-11 rounded-full border border-slate-300 text-lg text-slate-700 hover:bg-sky-50 focus-visible:outline-sky-700">←</button>
                <button type="button" aria-label="Next feature" onClick={() => setActive((active + 1) % slides.length)} className="h-11 w-11 rounded-full border border-slate-300 text-lg text-slate-700 hover:bg-sky-50 focus-visible:outline-sky-700">→</button>
                <span className="text-xs text-slate-500">Explore the report</span>
              </div>
            </div>
            <figure className="order-first flex min-w-0 flex-col justify-center border-b border-slate-200 bg-[linear-gradient(145deg,#e8f3fb,#f8fafc_60%,#edf8f4)] p-4 sm:p-7 lg:order-last lg:border-b-0 lg:border-l">
              <button type="button" aria-label={`Enlarge ${slide.label} screenshot`} onClick={() => dialog.current?.showModal()} className="group relative flex h-[270px] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-700 sm:h-[370px]">
                <Capture slide={slide} />
                <span className="absolute bottom-2 right-2 rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-xs font-medium text-sky-800 shadow-sm group-hover:bg-sky-50">Enlarge ↗</span>
              </button>
              <figcaption className="mt-3 text-xs leading-5 text-slate-600">Actual report capture · owned ergoveritas.com test page. Illustrates this scan’s evidence, not your website’s results.</figcaption>
            </figure>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-500">Coverage depends on the page, available controls, and retained evidence. Unavailable or inconclusive observations remain explicit.</p>
      </div>
      <dialog ref={dialog} aria-labelledby="feature-image-title" className="m-auto w-[calc(100%-2rem)] max-w-6xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl backdrop:bg-slate-950/75 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="feature-image-title" className="font-semibold text-slate-950">{slide.label} · report screenshot</h2>
          <button autoFocus type="button" onClick={() => dialog.current?.close()} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-50">Close</button>
        </div>
        <Capture slide={slide} enlarged />
      </dialog>
    </section>
  );
}
