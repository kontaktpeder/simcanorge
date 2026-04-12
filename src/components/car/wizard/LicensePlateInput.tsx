import { useCallback } from "react";

interface LicensePlateInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function LicensePlateInput({ value, onChange }: LicensePlateInputProps) {
  // Parse value into letters (max 2) and digits (max 5)
  const normalized = value.replace(/[\s\-]/g, "").toUpperCase();
  const letters = normalized.replace(/[^A-ZÆØÅ]/g, "").slice(0, 2);
  const digits = normalized.replace(/[^0-9]/g, "").slice(0, 5);

  const handleLettersChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^a-zA-ZæøåÆØÅ]/g, "").toUpperCase().slice(0, 2);
    onChange(raw + digits);
    // Auto-focus digits field when 2 letters typed
    if (raw.length === 2) {
      const next = e.target.closest(".license-plate-container")?.querySelector<HTMLInputElement>("[data-plate-digits]");
      next?.focus();
    }
  }, [digits, onChange]);

  const handleDigitsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 5);
    onChange(letters + raw);
  }, [letters, onChange]);

  const handleDigitsKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && digits.length === 0) {
      const prev = (e.target as HTMLElement).closest(".license-plate-container")?.querySelector<HTMLInputElement>("[data-plate-letters]");
      prev?.focus();
    }
  }, [digits]);

  return (
    <div className="license-plate-container flex items-stretch w-full max-w-[280px]">
      {/* Plate frame */}
      <div className="flex items-stretch border-2 border-[#1a1a1a] rounded-lg overflow-hidden bg-white shadow-sm w-full">
        {/* Blue stripe (Norwegian flag side) */}
        <div className="w-8 bg-[#003399] flex flex-col items-center justify-center gap-0.5 shrink-0">
          <span className="text-[8px] font-bold text-white leading-none">N</span>
          <div className="w-3 h-2 rounded-sm overflow-hidden flex flex-col">
            <div className="flex-1 bg-[#EF2B2D]" />
            <div className="flex-[0.3] bg-white" />
            <div className="flex-[0.3] bg-[#002868]" />
            <div className="flex-[0.3] bg-white" />
            <div className="flex-1 bg-[#EF2B2D]" />
          </div>
        </div>

        {/* Letters section */}
        <input
          data-plate-letters
          type="text"
          value={letters}
          onChange={handleLettersChange}
          placeholder="AB"
          maxLength={2}
          className="w-[72px] h-14 text-center text-2xl font-black tracking-[0.2em] bg-white text-[#1a1a1a] border-none outline-none focus:ring-0 uppercase placeholder:text-gray-300 placeholder:tracking-[0.2em]"
          style={{ fontFamily: "'DIN Alternate', 'Arial Black', 'Impact', sans-serif" }}
          autoComplete="off"
        />

        {/* Separator */}
        <div className="w-px bg-[#1a1a1a]/20 self-stretch my-2" />

        {/* Digits section */}
        <input
          data-plate-digits
          type="text"
          inputMode="numeric"
          value={digits}
          onChange={handleDigitsChange}
          onKeyDown={handleDigitsKeyDown}
          placeholder="12345"
          maxLength={5}
          className="flex-1 h-14 text-center text-2xl font-black tracking-[0.25em] bg-white text-[#1a1a1a] border-none outline-none focus:ring-0 placeholder:text-gray-300 placeholder:tracking-[0.25em]"
          style={{ fontFamily: "'DIN Alternate', 'Arial Black', 'Impact', sans-serif" }}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
