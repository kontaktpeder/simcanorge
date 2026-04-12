import { useCallback, useRef } from "react";

interface LicensePlateInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function LicensePlateInput({ value, onChange }: LicensePlateInputProps) {
  const digitsRef = useRef<HTMLInputElement>(null);
  const lettersRef = useRef<HTMLInputElement>(null);

  // Parse value into letters (max 2) and digits (max 5)
  const normalized = value.replace(/[\s\-]/g, "").toUpperCase();
  const letters = normalized.replace(/[^A-ZÆØÅ]/g, "").slice(0, 2);
  const digits = normalized.replace(/[^0-9]/g, "").slice(0, 5);

  const handleLettersChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^a-zA-ZæøåÆØÅ]/g, "").toUpperCase().slice(0, 2);
    onChange(raw + digits);
    if (raw.length === 2) {
      digitsRef.current?.focus();
    }
  }, [digits, onChange]);

  const handleDigitsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 5);
    onChange(letters + raw);
  }, [letters, onChange]);

  const handleDigitsKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && digits.length === 0) {
      lettersRef.current?.focus();
    }
  }, [digits]);

  return (
    <div className="w-full max-w-[380px]">
      {/* Outer plate border - thick black rounded frame */}
      <div
        className="relative flex items-stretch rounded-[6px] overflow-hidden"
        style={{
          border: "3px solid #111",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.05)",
          background: "#fff",
          height: "60px",
        }}
      >
        {/* Blue EU/Norwegian stripe */}
        <div
          className="flex flex-col items-center justify-center shrink-0"
          style={{
            width: "32px",
            background: "linear-gradient(180deg, #003893 0%, #002d75 100%)",
          }}
        >
          {/* Norwegian flag mini */}
          <div className="flex flex-col items-center gap-[2px]">
            <svg width="16" height="12" viewBox="0 0 22 16" className="drop-shadow-sm">
              {/* Red background */}
              <rect width="22" height="16" fill="#EF2B2D" rx="1" />
              {/* White cross */}
              <rect x="6" y="0" width="4" height="16" fill="#fff" />
              <rect x="0" y="6" width="22" height="4" fill="#fff" />
              {/* Blue cross */}
              <rect x="7" y="0" width="2" height="16" fill="#002868" />
              <rect x="0" y="7" width="22" height="2" fill="#002868" />
            </svg>
            <span
              className="font-bold leading-none"
              style={{ fontSize: "9px", color: "#fff", letterSpacing: "0.5px" }}
            >
              N
            </span>
          </div>
        </div>

        {/* Letters input */}
        <input
          ref={lettersRef}
          type="text"
          value={letters}
          onChange={handleLettersChange}
          placeholder="AB"
          maxLength={2}
          className="border-none outline-none focus:ring-0 bg-transparent uppercase"
          style={{
            width: "80px",
            height: "100%",
            textAlign: "center",
            fontSize: "32px",
            fontWeight: 900,
            fontFamily: "'DIN Alternate', 'Bahnschrift', 'Arial Black', sans-serif",
            letterSpacing: "0.12em",
            color: "#111",
            caretColor: "#333",
          }}
          autoComplete="off"
        />

        {/* Digits input */}
        <input
          ref={digitsRef}
          type="text"
          inputMode="numeric"
          value={digits}
          onChange={handleDigitsChange}
          onKeyDown={handleDigitsKeyDown}
          placeholder="12345"
          maxLength={5}
          className="border-none outline-none focus:ring-0 bg-transparent flex-1"
          style={{
            height: "100%",
            textAlign: "center",
            fontSize: "32px",
            fontWeight: 900,
            fontFamily: "'DIN Alternate', 'Bahnschrift', 'Arial Black', sans-serif",
            letterSpacing: "0.15em",
            color: "#111",
            caretColor: "#333",
          }}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
