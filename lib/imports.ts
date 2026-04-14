import * as XLSX from "xlsx";

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function readRows(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [] as Record<string, unknown>[];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

function pick(row: Record<string, unknown>, aliases: string[]) {
  const entries = Object.entries(row);
  for (const [key, value] of entries) {
    const normalized = normalizeKey(key);
    if (aliases.some((alias) => normalized === normalizeKey(alias))) {
      return typeof value === "string" ? value.trim() : String(value ?? "").trim();
    }
  }
  return "";
}

export function parseOfficerImport(buffer: Buffer) {
  const rows = readRows(buffer);
  return rows.map((row, index) => ({
    rowNumber: index + 2,
    badgeId: pick(row, ["badgeId", "badge", "badge_id"]),
    nuid: pick(row, ["nuid", "nuidNumber", "nuid_id"]),
    fullName: pick(row, ["fullName", "name", "officerName", "full_name"]),
    photoData: pick(row, ["photoData", "photo", "photoUrl", "photoURL", "image"]),
  }));
}

export function parseEquipmentImport(buffer: Buffer) {
  const rows = readRows(buffer);
  return rows.map((row, index) => ({
    rowNumber: index + 2,
    qrCode: pick(row, ["qrCode", "qr", "qr_code"]),
    label: pick(row, ["label", "equipmentLabel", "name"]),
    category: pick(row, ["category", "type"]),
    description: pick(row, ["description", "notes"]),
    isActive: (() => {
      const value = pick(row, ["isActive", "active", "enabled"]).toLowerCase();
      if (!value) return true;
      return ["true", "1", "yes", "y", "active"].includes(value);
    })(),
  }));
}
