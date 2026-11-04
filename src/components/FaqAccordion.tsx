import { useState } from 'preact/hooks';
import faqData from '../data/faq.json';

interface Props {
  limit?: number;
}

export default function FaqAccordion({ limit }: Props) {
  const [openIndices, setOpenIndices] = useState<number[]>([0]); // First item open by default

  const list = limit ? faqData.slice(0, limit) : faqData;

  const toggle = (idx: number) => {
    setOpenIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div class="space-y-4 max-w-3xl mx-auto">
      {list.map((item, index) => {
        const isOpen = openIndices.includes(index);
        const headingId = `faq-heading-${index}`;
        const panelId = `faq-panel-${index}`;

        return (
          <div
            key={index}
            class={`border rounded-squircle-sm transition-all duration-200 overflow-hidden ${
              isOpen
                ? 'bg-cream/40 dark:bg-charcoal-100 border-lemon dark:border-lemon/50 shadow-sm'
                : 'bg-white dark:bg-charcoal-50 border-charcoal/10 dark:border-cream/10 hover:border-charcoal/20'
            }`}
          >
            <h3>
              <button
                type="button"
                id={headingId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                class="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-sans font-bold text-base sm:text-lg text-charcoal dark:text-cream cursor-pointer focus:outline-none focus:ring-2 focus:ring-lemon min-h-[48px]"
              >
                <span>{item.question}</span>
                <span
                  class={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-charcoal/20 dark:border-cream/20 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 bg-lemon text-charcoal' : 'text-muted'
                  }`}
                  aria-hidden="true"
                >
                  <svg class="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={headingId}
              hidden={!isOpen}
              class={`px-6 pb-6 text-sm sm:text-base text-muted dark:text-cream/80 leading-relaxed ${
                isOpen ? 'block' : 'hidden'
              }`}
            >
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

