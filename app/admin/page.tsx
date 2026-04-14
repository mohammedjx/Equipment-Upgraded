"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatDateTime } from "@/lib/utils";

type DashboardData = {
  stats: {
    officerCount: number;
    equipmentCount: number;
    openShiftCount: number;
    activeCheckoutCount: number;
  };
  checkedOutItems: Array<{
    qrCode: string;
    label: string;
    category?: string | null;
    shiftId: string;
    officerName: string;
    badgeId: string;
    eventAt: string;
  }>;
  openShifts: Array<{
    shiftId: string;
    startedAt: string;
    noEquipment: boolean;
    officer: {
      fullName: string;
      badgeId: string;
      nuid: string;
    };
    activeEquipment: Array<{
      id: string;
      label: string;
      qrCode: string;
    }>;
  }>;
  recentEvents: Array<{
    id: string;
    type: "CHECK_OUT" | "CHECK_IN";
    eventAt: string;
    equipment: { label: string; qrCode: string };
    shift: { shiftId: string; officer: { fullName: string; badgeId: string } };
  }>;
};

type AuditShift = {
  shiftId: string;
  startedAt: string;
  endedAt?: string | null;
  noEquipment: boolean;
  officer: {
    badgeId: string;
    nuid: string;
    fullName: string;
  };
  equipmentEvents: Array<{
    id: string;
    type: "CHECK_OUT" | "CHECK_IN";
    eventAt: string;
    equipment: { label: string; qrCode: string; category?: string | null };
  }>;
};

type ImportResult = {
  imported: number;
  skipped: number;
  errors?: string[];
};

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState("Loading dashboard...");
  const [auditShiftId, setAuditShiftId] = useState("");
  const [auditDay, setAuditDay] = useState("");
  const [auditMonth, setAuditMonth] = useState("");
  const [auditResults, setAuditResults] = useState<AuditShift[]>([]);
  const [officerFile, setOfficerFile] = useState<File | null>(null);
  const [equipmentFile, setEquipmentFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState("");

  async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed.");
    return data as T;
  }

  async function loadDashboard() {
    try {
      const data = await fetchJson<DashboardData>("/api/admin/dashboard");
      setDashboard(data);
      setStatus("Dashboard updated.");
    } catch (error: any) {
      setStatus(error.message || "Unable to load dashboard.");
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function runAudit() {
    try {
      const params = new URLSearchParams();
      if (auditShiftId.trim()) params.set("shiftId", auditShiftId.trim());
      else if (auditDay.trim()) params.set("day", auditDay.trim());
      else if (auditMonth.trim()) params.set("month", auditMonth.trim());
      const data = await fetchJson<{ shifts: AuditShift[] }>(`/api/audit?${params.toString()}`);
      setAuditResults(data.shifts);
      setStatus(`Audit returned ${data.shifts.length} result(s).`);
    } catch (error: any) {
      setStatus(error.message || "Audit failed.");
    }
  }

  async function uploadFile(url: string, file: File | null) {
    if (!file) throw new Error("Select a CSV or Excel file first.");
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(url, { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Upload failed.");
    return data as ImportResult;
  }

  async function importOfficers(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await uploadFile("/api/admin/import/officers", officerFile);
      setImportStatus(`Officer import complete: ${result.imported} imported, ${result.skipped} skipped.`);
      if (result.errors?.length) setImportStatus((prev) => `${prev} ${result.errors.join(" ")}`);
      loadDashboard();
    } catch (error: any) {
      setImportStatus(error.message || "Officer import failed.");
    }
  }

  async function importEquipment(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await uploadFile("/api/admin/import/equipment", equipmentFile);
      setImportStatus(`Equipment import complete: ${result.imported} imported, ${result.skipped} skipped.`);
      if (result.errors?.length) setImportStatus((prev) => `${prev} ${result.errors.join(" ")}`);
      loadDashboard();
    } catch (error: any) {
      setImportStatus(error.message || "Equipment import failed.");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const statCards = useMemo(
    () => [
      { label: "Officers", value: dashboard?.stats.officerCount ?? 0 },
      { label: "Equipment", value: dashboard?.stats.equipmentCount ?? 0 },
      { label: "Open shifts", value: dashboard?.stats.openShiftCount ?? 0 },
      { label: "Live checkouts", value: dashboard?.stats.activeCheckoutCount ?? 0 },
    ],
    [dashboard]
  );

  return (
    <main className="container adminPage">
      <div className="header headerRow">
        <div>
          <span className="eyebrow">Admin dashboard</span>
          <h1>Operations and audit center</h1>
          <p>Monitor live equipment status, import bulk records, and run audit lookups.</p>
        </div>
        <div className="actions">
          <a className="button secondary" href="/">
            Open shift scanner
          </a>
          <button className="button secondary" onClick={loadDashboard}>Refresh</button>
          <button className="button danger" onClick={logout}>Sign out</button>
        </div>
      </div>

      <div className="statsGrid">
        {statCards.map((card) => (
          <section className="statCard" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </section>
        ))}
      </div>

      <div className="grid">
        <section className="card">
          <h2 className="sectionTitle">Open shifts</h2>
          {!dashboard?.openShifts.length ? (
            <p className="muted">No active shifts.</p>
          ) : (
            <div className="stack">
              {dashboard.openShifts.map((shift) => (
                <div className="listCard" key={shift.shiftId}>
                  <div className="listCardTop">
                    <div>
                      <strong>{shift.officer.fullName}</strong>
                      <div className="muted small">Badge {shift.officer.badgeId} • NUID {shift.officer.nuid}</div>
                    </div>
                    <span className="badge">{shift.shiftId}</span>
                  </div>
                  <div className="muted small">Started {formatDateTime(shift.startedAt)}</div>
                  <div className="chipRow">
                    {shift.noEquipment && <span className="chip">No equipment</span>}
                    {shift.activeEquipment.map((item) => (
                      <span className="chip" key={item.id}>{item.label} ({item.qrCode})</span>
                    ))}
                    {!shift.noEquipment && shift.activeEquipment.length === 0 && <span className="chip ghost">No live checkouts</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="sectionTitle">Checked out equipment</h2>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Officer</th>
                  <th>Shift</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.checkedOutItems.length ? (
                  dashboard.checkedOutItems.map((item) => (
                    <tr key={`${item.shiftId}-${item.qrCode}`}>
                      <td>{item.label}<div className="muted small">{item.qrCode}</div></td>
                      <td>{item.officerName}<div className="muted small">Badge {item.badgeId}</div></td>
                      <td>{item.shiftId}</td>
                      <td>{formatDateTime(item.eventAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="muted">No checked-out equipment right now.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <h2 className="sectionTitle">Bulk import officers</h2>
          <p className="muted small">Accepted columns: badgeId, nuid, fullName, photoData/photoUrl. Upload CSV or XLSX.</p>
          <form onSubmit={importOfficers} className="stack">
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setOfficerFile(e.target.files?.[0] || null)} />
            <button className="button" type="submit">Import officers</button>
          </form>
        </section>

        <section className="card">
          <h2 className="sectionTitle">Bulk import equipment</h2>
          <p className="muted small">Accepted columns: qrCode, label, category, description, isActive. Upload CSV or XLSX.</p>
          <form onSubmit={importEquipment} className="stack">
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setEquipmentFile(e.target.files?.[0] || null)} />
            <button className="button" type="submit">Import equipment</button>
          </form>
          {importStatus && <div className="status small">{importStatus}</div>}
        </section>

        <section className="card">
          <h2 className="sectionTitle">Audit search</h2>
          <div className="field">
            <label>Shift ID</label>
            <input value={auditShiftId} onChange={(e) => setAuditShiftId(e.target.value)} placeholder="SHIFT-..." />
          </div>
          <div className="field">
            <label>Day</label>
            <input type="date" value={auditDay} onChange={(e) => setAuditDay(e.target.value)} />
          </div>
          <div className="field">
            <label>Month</label>
            <input type="month" value={auditMonth} onChange={(e) => setAuditMonth(e.target.value)} />
          </div>
          <div className="actions">
            <button className="button" onClick={runAudit}>Run audit</button>
            <button className="button secondary" onClick={() => { setAuditShiftId(""); setAuditDay(""); setAuditMonth(""); setAuditResults([]); }}>Clear</button>
          </div>
        </section>

        <section className="card">
          <h2 className="sectionTitle">Recent activity</h2>
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Equipment</th>
                  <th>Officer</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {dashboard?.recentEvents.length ? dashboard.recentEvents.map((event) => (
                  <tr key={event.id}>
                    <td>{event.type === "CHECK_OUT" ? "Checked out" : "Checked in"}</td>
                    <td>{event.equipment.label}<div className="muted small">{event.equipment.qrCode}</div></td>
                    <td>{event.shift.officer.fullName}<div className="muted small">{event.shift.shiftId}</div></td>
                    <td>{formatDateTime(event.eventAt)}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="muted">No activity yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {auditResults.length > 0 && (
        <section className="card auditCard">
          <h2 className="sectionTitle">Audit results</h2>
          <div className="stack">
            {auditResults.map((shift) => (
              <div key={shift.shiftId} className="listCard">
                <div className="listCardTop">
                  <strong>{shift.officer.fullName}</strong>
                  <span className="badge">{shift.shiftId}</span>
                </div>
                <div className="muted small">Badge {shift.officer.badgeId} • NUID {shift.officer.nuid}</div>
                <div className="muted small">Start {formatDateTime(shift.startedAt)} • End {formatDateTime(shift.endedAt)}</div>
                <div className="chipRow">
                  {shift.noEquipment && <span className="chip">No equipment</span>}
                  {shift.equipmentEvents.map((event) => (
                    <span className="chip" key={event.id}>{event.type === "CHECK_OUT" ? "OUT" : "IN"} · {event.equipment.label} · {formatDateTime(event.eventAt)}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="status small">{status}</div>
    </main>
  );
}
