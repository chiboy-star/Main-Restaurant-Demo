import { useState, useEffect } from 'preact/hooks';
import QRCode from 'qrcode';

export default function QrGenerator() {
  const [tableCount, setTableCount] = useState(12);
  const [qrCodes, setQrCodes] = useState<{ tableNo: number; dataUrl: string; menuUrl: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://zesti-demo.pages.dev';

  useEffect(() => {
    async function generateCodes() {
      setLoading(true);
      const generated: { tableNo: number; dataUrl: string; menuUrl: string }[] = [];

      for (let i = 1; i <= tableCount; i++) {
        const menuUrl = `${baseUrl}/menu?t=${i}&utm_source=qr&utm_medium=table_stand&utm_campaign=dine_in`;
        try {
          const dataUrl = await QRCode.toDataURL(menuUrl, {
            width: 320,
            margin: 2,
            color: {
              dark: '#1B1B1F',
              light: '#FFFFFF'
            }
          });
          generated.push({ tableNo: i, dataUrl, menuUrl });
        } catch (e) {
          console.error(e);
        }
      }
      setQrCodes(generated);
      setLoading(false);
    }

    generateCodes();
  }, [tableCount, baseUrl]);

  const handlePrint = () => {
    window.print();
  };

  const downloadSinglePng = (tableNo: number, dataUrl: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `zesti-table-${tableNo}-qr.png`;
    a.click();
  };

  return (
    <div class="space-y-8">
      {/* Control Bar (Hidden on print) */}
      <div class="no-print p-6 rounded-squircle bg-white dark:bg-charcoal-100 border border-charcoal/10 dark:border-cream/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 class="font-display text-2xl font-bold text-charcoal dark:text-cream">
            Table QR Menu Generator
          </h2>
          <p class="text-xs text-muted dark:text-cream/70 mt-1">
            Generates high-resolution QR codes with <code>?t=N</code> and UTM tracking. Printable A4 sheet.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-xs font-bold text-charcoal dark:text-cream">
            <span>Tables:</span>
            <input
              type="number"
              min="1"
              max="50"
              value={tableCount}
              onInput={(e) => setTableCount(parseInt((e.target as HTMLInputElement).value, 10) || 1)}
              class="w-16 px-2 py-1.5 rounded bg-charcoal/5 dark:bg-charcoal-50 border border-charcoal/20 text-center font-mono font-bold"
            />
          </label>

          <button
            type="button"
            onClick={handlePrint}
            class="px-5 py-2.5 rounded-full bg-lemon text-charcoal font-bold text-xs uppercase tracking-wider hover:bg-yellow-300 shadow cursor-pointer min-h-[40px] flex items-center gap-2"
          >
            <span>🖨️</span>
            <span>Print A4 Cards</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div class="text-center py-12 text-sm text-muted">Generating QR codes...</div>
      ) : (
        /* Printable Grid of Table Stand Cards */
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-2 print:gap-4">
          {qrCodes.map(({ tableNo, dataUrl, menuUrl }) => (
            <div
              key={tableNo}
              class="bg-white text-charcoal p-6 rounded-squircle border-2 border-charcoal/20 shadow-md flex flex-col items-center text-center justify-between relative print:shadow-none print:border-dashed print:border-black print:page-break"
            >
              <div class="w-full pb-3 border-b border-charcoal/10 flex items-center justify-between">
                <span class="font-display font-extrabold text-lg text-charcoal">ZESTI</span>
                <span class="px-2 py-0.5 rounded-full bg-lemon text-charcoal font-bold text-[10px] uppercase font-mono">
                  Scan to Order
                </span>
              </div>

              {/* QR Image */}
              <div class="my-4 p-2 bg-white rounded-lg border border-charcoal/10 shadow-inner">
                <img
                  src={dataUrl}
                  alt={`QR code for Table ${tableNo}`}
                  width="200"
                  height="200"
                  class="w-40 h-40 object-contain"
                />
              </div>

              {/* Table Number */}
              <div class="w-full pt-2">
                <div class="font-display font-black text-2xl text-charcoal tracking-tight">
                  TABLE #{tableNo}
                </div>
                <p class="text-[10px] text-muted font-sans mt-0.5">
                  Point camera to open live 2-tap menu
                </p>
              </div>

              {/* Download PNG Button (Hidden on Print) */}
              <button
                type="button"
                onClick={() => downloadSinglePng(tableNo, dataUrl)}
                class="no-print mt-3 text-[11px] font-bold text-lavender-deep hover:underline cursor-pointer"
              >
                Download PNG ⬇
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

