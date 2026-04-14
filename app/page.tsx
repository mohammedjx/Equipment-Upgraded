"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { formatDateTime } from "@/lib/utils";

const QrScanner = dynamic(() => import("@/components/QrScanner"), { ssr: false });

type Officer = {
  badgeId: string;
  nuid: string;
  fullName: string;
  photoData?: string | null;
};

type Shift = {
  shiftId: string;
  startedAt: string;
  endedAt?: string | null;
  noEquipment: boolean;
};

type EquipmentEvent = {
  id: string;
  type: "CHECK_OUT" | "CHECK_IN";
  eventAt: string;
  equipment: {
    label: string;
    qrCode: string;
    category?: string | null;
  };
};

type AuditShift = Shift & {
  officer: Officer;
  equipmentEvents: EquipmentEvent[];
};

export default function HomePage() {
  const badgeInputRef = useRef<HTMLInputElement | null>(null);

  const [badgeId, setBadgeId] = useState("");
  const [currentOfficer, setCurrentOfficer] = useState<Officer | null>(null);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [status, setStatus] = useState<string>("Ready.");
  const [scanCode, setScanCode] = useState("");
  const [scanAction, setScanAction] = useState<"CHECK_OUT" | "CHECK_IN">("CHECK_OUT");
  const [scanHistory, setScanHistory] = useState<EquipmentEvent[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  const [officerForm, setOfficerForm] = useState({
    badgeId: "",
    nuid: "",
    fullName: "",
    photoData: "",
  });

  const [equipmentForm, setEquipmentForm] = useState({
    qrCode: "",
    label: "",
    category: "",
    description: "",
  });

  const [auditShiftId, setAuditShiftId] = useState("");
  const [auditDay, setAuditDay] = useState("");
  const [auditMonth, setAuditMonth] = useState("");
  const [auditResults, setAuditResults] = useState<AuditShift[]>([]);

  async function api<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data as T;
  }

  async function startShift() {
    try {
      const data = await api<{ officer: Officer; shift: Shift; warning?: string }>("/api/shifts/start", {
        method: "POST",
        body: JSON.stringify({ badgeId }),
      });
      setCurrentOfficer(data.officer);
      setCurrentShift(data.shift);
      setStatus(data.warning || `Shift ${data.shift.shiftId} started for ${data.officer.fullName}.`);
      setScanHistory([]);
    } catch (error: any) {
      setCurrentOfficer(null);
      setCurrentShift(null);
      setStatus(error.message);
      setOfficerForm((prev) => ({ ...prev, badgeId }));
    }
  }

  async function fetchOfficerByBadge() {
    if (!badgeId.trim()) return;
    try {
      const data = await api<{ officer: Officer }>(`/api/officers/${encodeURIComponent(badgeId)}`);
      setCurrentOfficer(data.officer);
      setStatus(`Officer found: ${data.officer.fullName}. Start the shift when ready.`);
    } catch (error: any) {
      setCurrentOfficer(null);
      setStatus(error.message);
      setOfficerForm((prev) => ({ ...prev, badgeId }));
    }
  }

  async function markNoEquipment() {
    if (!currentShift) return;
    try {
      const data = await api<{ message: string }>("/api/shifts/no-equipment", {
        method: "POST",
        body: JSON.stringify({ shiftId: currentShift.shiftId }),
      });
      setCurrentShift({ ...currentShift, noEquipment: true });
      setStatus(data.message);
    } catch (error: any) {
      setStatus(error.message);
    }
  }

  async function endShift() {
    if (!currentShift) return;
    try {
      const data = await api<{ shift: AuditShift; message: string }>("/api/shifts/end", {
        method: "POST",
        body: JSON.stringify({ shiftId: currentShift.shiftId }),
      });
      setCurrentShift(data.shift);
      setScanHistory(data.shift.equipmentEvents);
      setStatus(data.message);
    } catch (error: any) {
      setStatus(error.message);
    }
  }

  async function submitEquipmentScan(code?: string) {
    if (!currentShift) {
      setStatus("Start a shift first.");
      return;
    }

    const qrCode = (code ?? scanCode).trim();
    if (!qrCode) {
      setStatus("Scan or enter a QR code first.");
      return;
    }

    try {
      const data = await api<{ event: EquipmentEvent; message: string }>("/api/equipment/scan", {
        method: "POST",
        body: JSON.stringify({
          shiftId: currentShift.shiftId,
          qrCode,
          action: scanAction,
        }),
      });
      setScanHistory((prev) => [data.event, ...prev]);
      setScanCode("");
      setStatus(data.message);
    } catch (error: any) {
      setStatus(error.message);
    }
  }

  async function registerOfficer() {
    try {
      const data = await api<{ officer: Officer }>("/api/officers/register", {
        method: "POST",
        body: JSON.stringify(officerForm),
      });
      setStatus(`Officer ${data.officer.fullName} registered successfully.`);
      setCurrentOfficer(data.officer);
      setBadgeId(data.officer.badgeId);
    } catch (error: any) {
      setStatus(error.message);
    }
  }

  async function registerEquipment() {
    try {
      const data = await api<{ equipment: { label: string; qrCode: string } }>("/api/equipment/register", {
        method: "POST",
        body: JSON.stringify(equipmentForm),
      });
      setStatus(`Equipment ${data.equipment.label} registered with QR ${data.equipment.qrCode}.`);
      setEquipmentForm({ qrCode: "", label: "", category: "", description: "" });
    } catch (error: any) {
      setStatus(error.message);
    }
  }

  async function runAudit() {
    const params = new URLSearchParams();
    if (auditShiftId.trim()) params.set("shiftId", auditShiftId.trim());
    else if (auditDay.trim()) params.set("day", auditDay.trim());
    else if (auditMonth.trim()) params.set("month", auditMonth.trim());

    try {
      const data = await api<{ shifts: AuditShift[] }>(`/api/audit?${params.toString()}`);
      setAuditResults(data.shifts);
      setStatus(`Audit returned ${data.shifts.length} shift record(s).`);
    } catch (error: any) {
      setStatus(error.message);
    }
  }

  function onPhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setOfficerForm((prev) => ({ ...prev, photoData: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  }

  const activeItems = useMemo(() => {
    const map = new Map<string, EquipmentEvent>();
    const ordered = [...scanHistory].sort((a, b) => +new Date(a.eventAt) - +new Date(b.eventAt));
    for (const item of ordered) {
      if (item.type === "CHECK_OUT") map.set(item.equipment.qrCode, item);
      if (item.type === "CHECK_IN") map.delete(item.equipment.qrCode);
    }
    return [...map.values()].reverse();
  }, [scanHistory]);

  return (
    <main className="container">
      <div className="header headerRow">
        <div>
          <h1>Officer Equipment Checkout</h1>
          <p>Web app for badge-based shift start and QR-based equipment checkout/check-in.</p>
        </div>
        <div className="actions">
          <a className="button secondary" href="/login">Admin dashboard</a>
        </div>
      </div>

      <div className="grid">
        <section className="card">
          <h2 className="sectionTitle">1. Badge scan / Start shift</h2>
          <div className="field">
            <label>Badge ID</label>
            <input
              ref={badgeInputRef}
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value)}
              placeholder="Scan or enter badge ID"
              onKeyDown={(e) => {
                if (e.key === "Enter") startShift();
              }}
            />
          </div>
          <div className="actions">
            <button className="button" onClick={startShift}>Start shift</button>
            <button className="button secondary" onClick={fetchOfficerByBadge}>Lookup officer</button>
          </div>
          <div className="status small">{status}</div>
        </section>

        <section className="card">
          <h2 className="sectionTitle">2. Officer profile</h2>
          {currentOfficer ? (
            <div className="profile">
              {currentOfficer.photoData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentOfficer.photoData} alt={currentOfficer.fullName} />
              ) : (
                <div className="placeholder">No photo</div>
              )}
              <div>
                <p><strong>Name:</strong> {currentOfficer.fullName}</p>
                <p><strong>NUID:</strong> {currentOfficer.nuid}</p>
                <p><strong>Badge:</strong> {currentOfficer.badgeId}</p>
                <p><strong>Shift start:</strong> {formatDateTime(currentShift?.startedAt)}</p>
                <p><strong>Shift ID:</strong> {currentShift?.shiftId || "—"}</p>
                <p><strong>Shift status:</strong> <span className="badge">{currentShift?.endedAt ? "Closed" : currentShift ? "Open" : "Not started"}</span></p>
                <div className="actions">
                  <button className="button secondary" onClick={markNoEquipment} disabled={!currentShift}>No equipment</button>
                  <button className="button danger" onClick={endShift} disabled={!currentShift || !!currentShift.endedAt}>End shift</button>
                </div>
              </div>
            </div>
          ) : (
            <p className="muted">No officer loaded yet.</p>
          )}
        </section>

        <section className="card">
          <h2 className="sectionTitle">3. Equipment QR scanning</h2>
          <div className="field">
            <label>Action</label>
            <select value={scanAction} onChange={(e) => setScanAction(e.target.value as "CHECK_OUT" | "CHECK_IN") }>
              <option value="CHECK_OUT">Check out</option>
              <option value="CHECK_IN">Check in</option>
            </select>
          </div>
          <div className="field">
            <label>QR Code</label>
            <input
              value={scanCode}
              onChange={(e) => setScanCode(e.target.value)}
              placeholder="Scan or enter equipment QR"
              onKeyDown={(e) => {
                if (e.key === "Enter") submitEquipmentScan();
              }}
            />
          </div>
          <div className="actions">
            <button className="button success" onClick={() => submitEquipmentScan()}>
              Log scan
            </button>
            <button className="button secondary" onClick={() => setShowScanner((v) => !v)}>
              {showScanner ? "Hide camera" : "Use camera QR scanner"}
            </button>
          </div>
          {showScanner ? <QrScanner onScan={(value) => { setScanCode(value); submitEquipmentScan(value); }} /> : null}
          <div style={{ marginTop: 14 }}>
            <div className="small muted" style={{ marginBottom: 8 }}>Currently checked out on this shift</div>
            {activeItems.length === 0 ? <div className="muted">None</div> : (
              <ul>
                {activeItems.map((item) => (
                  <li key={item.id}>{item.equipment.label} ({item.equipment.qrCode})</li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="card">
          <h2 className="sectionTitle">4. Scan history for active shift</h2>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Equipment</th>
                  <th>QR</th>
                </tr>
              </thead>
              <tbody>
                {scanHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">No equipment events logged yet.</td>
                  </tr>
                ) : scanHistory.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDateTime(event.eventAt)}</td>
                    <td>{event.type}</td>
                    <td>{event.equipment.label}</td>
                    <td>{event.equipment.qrCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <h2 className="sectionTitle">5. Officer registration</h2>
          <div className="field">
            <label>Badge ID</label>
            <input value={officerForm.badgeId} onChange={(e) => setOfficerForm({ ...officerForm, badgeId: e.target.value })} />
          </div>
          <div className="field">
            <label>NUID</label>
            <input value={officerForm.nuid} onChange={(e) => setOfficerForm({ ...officerForm, nuid: e.target.value })} />
          </div>
          <div className="field">
            <label>Full name</label>
            <input value={officerForm.fullName} onChange={(e) => setOfficerForm({ ...officerForm, fullName: e.target.value })} />
          </div>
          <div className="field">
            <label>Photo upload</label>
            <input type="file" accept="image/*" onChange={onPhotoSelected} />
          </div>
          <button className="button" onClick={registerOfficer}>Save officer</button>
        </section>

        <section className="card">
          <h2 className="sectionTitle">6. Equipment registration</h2>
          <div className="field">
            <label>QR code</label>
            <input value={equipmentForm.qrCode} onChange={(e) => setEquipmentForm({ ...equipmentForm, qrCode: e.target.value })} />
          </div>
          <div className="field">
            <label>Label</label>
            <input value={equipmentForm.label} onChange={(e) => setEquipmentForm({ ...equipmentForm, label: e.target.value })} />
          </div>
          <div className="field">
            <label>Category</label>
            <input value={equipmentForm.category} onChange={(e) => setEquipmentForm({ ...equipmentForm, category: e.target.value })} />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={equipmentForm.description} onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })} />
          </div>
          <button className="button" onClick={registerEquipment}>Save equipment</button>
        </section>

        <section className="card" style={{ gridColumn: "1 / -1" }}>
          <h2 className="sectionTitle">7. Audit reporting</h2>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <div className="field">
              <label>Shift ID</label>
              <input value={auditShiftId} onChange={(e) => { setAuditShiftId(e.target.value); setAuditDay(""); setAuditMonth(""); }} placeholder="SHIFT-..." />
            </div>
            <div className="field">
              <label>Day</label>
              <input type="date" value={auditDay} onChange={(e) => { setAuditDay(e.target.value); setAuditShiftId(""); setAuditMonth(""); }} />
            </div>
            <div className="field">
              <label>Month</label>
              <input type="month" value={auditMonth} onChange={(e) => { setAuditMonth(e.target.value); setAuditShiftId(""); setAuditDay(""); }} />
            </div>
          </div>
          <div className="actions">
            <button className="button" onClick={runAudit}>Run audit</button>
            <button className="button secondary" onClick={() => { setAuditResults([]); setAuditDay(""); setAuditMonth(""); setAuditShiftId(""); }}>Clear</button>
          </div>

          <div style={{ marginTop: 16 }}>
            {auditResults.length === 0 ? (
              <p className="muted">No audit records loaded.</p>
            ) : auditResults.map((shift) => (
              <div key={shift.shiftId} className="card" style={{ marginBottom: 14, background: "#0b1220" }}>
                <h3>{shift.shiftId}</h3>
                <p><strong>Officer:</strong> {shift.officer.fullName} ({shift.officer.badgeId})</p>
                <p><strong>NUID:</strong> {shift.officer.nuid}</p>
                <p><strong>Started:</strong> {formatDateTime(shift.startedAt)}</p>
                <p><strong>Ended:</strong> {formatDateTime(shift.endedAt)}</p>
                <p><strong>No equipment:</strong> {shift.noEquipment ? "Yes" : "No"}</p>
                <div className="tableWrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Action</th>
                        <th>Equipment</th>
                        <th>QR</th>
                        <th>Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shift.equipmentEvents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="muted">No equipment events.</td>
                        </tr>
                      ) : shift.equipmentEvents.map((event) => (
                        <tr key={event.id}>
                          <td>{formatDateTime(event.eventAt)}</td>
                          <td>{event.type}</td>
                          <td>{event.equipment.label}</td>
                          <td>{event.equipment.qrCode}</td>
                          <td>{event.equipment.category || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
