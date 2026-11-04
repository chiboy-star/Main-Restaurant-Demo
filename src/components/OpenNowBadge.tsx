import { useState, useEffect } from 'preact/hooks';
import { computeOpenNow, type OpenNowResult } from '../lib/opennow';
import { getStoredSettings } from '../lib/storage';

interface Props {
  compact?: boolean;
}

export default function OpenNowBadge({ compact = false }: Props) {
  const [result, setResult] = useState<OpenNowResult>(() => computeOpenNow());

  useEffect(() => {
    const update = () => {
      const currentSettings = getStoredSettings();
      setResult(computeOpenNow(currentSettings));
    };

    update();
    const interval = setInterval(update, 60000); // Refreshes every minute
    return () => clearInterval(interval);
  }, []);

  const { isOpen, statusText, detailText } = result;

  return (
    <div
      class={`inline-flex items-center gap-2 rounded-full font-medium text-xs tracking-wide transition-colors ${
        isOpen
          ? 'bg-basil/15 text-basil dark:bg-basil/25 dark:text-emerald-400 border border-basil/30'
          : 'bg-chilli/15 text-chilli dark:bg-chilli/25 dark:text-rose-400 border border-chilli/30'
      } ${compact ? 'px-2.5 py-1' : 'px-3 py-1.5'}`}
      role="status"
      aria-live="polite"
    >
      <span
        class={`w-2 h-2 rounded-full ${
          isOpen ? 'bg-basil dark:bg-emerald-400 animate-pulse' : 'bg-chilli dark:bg-rose-400'
        }`}
        aria-hidden="true"
      />
      <span>
        <strong class="font-bold">{statusText}</strong>
        {!compact && (
          <span class="opacity-90"> · {detailText}</span>
        )}
      </span>
    </div>
  );
}

