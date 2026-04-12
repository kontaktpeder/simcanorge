import { useCallback, useRef } from "react";

interface LicensePlateInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function LicensePlateInput({ value, onChange }: LicensePlateInputProps) {
  const digitsRef = useRef<HTMLInputElement>(null);
  const lettersRef = useRef<HTMLInputElement>(null);

  const normalized = value.replace(/[\s\-]/g, "").toUpperCase();
  const letters = normalized.replace(/[^A-ZÆØÅ]/g, "").slice(0, 2);
  const digits = normalized.replace(/[^0-9]/g, "").slice(0, 5);

  const handleLettersChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^a-zA-ZæøåÆØÅ]/g, "").toUpperCase().slice(0, 2);
    onChange(raw + digits);
    if (raw.length === 2) digitsRef.current?.focus();
  }, [digits, onChange]);

  const handleDigitsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 5);
    onChange(letters + raw);
  }, [letters, onChange]);

  const handleDigitsKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && digits.length === 0) lettersRef.current?.focus();
  }, [digits]);

  const plateFont = "'DIN Alternate', 'Bahnschrift', 'Arial Black', sans-serif";

  return (
    <div
      className="inline-flex items-stretch rounded-md overflow-hidden"
      style={{
        border: "3px solid #1a1a1a",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        background: "#fff",
        height: "56px",
        width: "340px",
        maxWidth: "100%",
      }}
    >
      {/* Blue stripe */}
      <div
        className="flex flex-col items-center justify-center shrink-0"
        style={{ width: "30px", background: "linear-gradient(180deg, #003893 0%, #002a6b 100%)" }}
      >
        <svg width="14" height="10" viewBox="0 0 22 16" className="mb-[1px]">
          <rect width="22" height="16" fill="#EF2B2D" rx="1" />
          <rect x="6" y="0" width="4" height="16" fill="#fff" />
          <rect x="0" y="6" width="22" height="4" fill="#fff" />
          <rect x="7" y="0" width="2" height="16" fill="#002868" />
          <rect x="0" y="7" width="22" height="2" fill="#002868" />
        </svg>
        <span style={{ fontSize: "8px", color: "#fff", fontWeight: 700, lineHeight: 1 }}>N</span>
      </div>

      {/* Letters */}
      <input
        ref={lettersRef}
        type="text"
        value={letters}
        onChange={handleLettersChange}
        placeholder="AB"
        maxLength={2}
        className="border-none outline-none focus:ring-0 bg-transparent uppercase"
        style={{
          width: "70px",
          height: "100%",
          textAlign: "center",
          fontSize: "28px",
          fontWeight: 900,
          fontFamily: plateFont,
          letterSpacing: "0.1em",
          color: "#1a1a1a",
        }}
        autoComplete="off"
      />

      {/* Subtle separator space */}
      <div style={{ width: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "1px", height: "60%", background: "rgba(0,0,0,0.1)" }} />
      </div>

      {/* Digits */}
      <input
        ref={digitsRef}
        type="text"
        inputMode="numeric"
        value={digits}
        onChange={handleDigitsChange}
        onKeyDown={handleDigitsKeyDown}
        placeholder="12345"
        maxLength={5}
        className="border-none outline-none focus:ring-0 bg-transparent"
        style={{
          flex: 1,
          minWidth: 0,
          height: "100%",
          textAlign: "center",
          fontSize: "28px",
          fontWeight: 900,
          fontFamily: plateFont,
          letterSpacing: "0.12em",
          color: "#1a1a1a",
        }}
        autoComplete="off"
      />
    </div>
  );
}
