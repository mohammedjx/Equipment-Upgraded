"use client";

import { Scanner } from "@yudiel/react-qr-scanner";

export default function QrScanner({ onScan }: { onScan: (value: string) => void }) {
  return (
    <div className="scannerBox">
      <div className="small muted" style={{ marginBottom: 8 }}>
        Camera QR scanner
      </div>
      <Scanner
        onScan={(result) => {
          const raw = result?.[0]?.rawValue?.trim();
          if (raw) onScan(raw);
        }}
        onError={(error) => {
          console.error("QR scanner error", error);
        }}
        formats={["qr_code"]}
        constraints={{ facingMode: "environment" }}
      />
    </div>
  );
}
