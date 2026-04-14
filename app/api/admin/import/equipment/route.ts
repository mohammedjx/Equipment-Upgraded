import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseEquipmentImport } from "@/lib/imports";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a CSV or Excel file first." }, { status: 400 });
    }

    const rows = parseEquipmentImport(Buffer.from(await file.arrayBuffer()));
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      if (!row.qrCode || !row.label) {
        skipped += 1;
        errors.push(`Row ${row.rowNumber}: qrCode and label are required.`);
        continue;
      }

      try {
        await prisma.equipment.upsert({
          where: { qrCode: row.qrCode },
          update: {
            label: row.label,
            category: row.category || null,
            description: row.description || null,
            isActive: row.isActive,
          },
          create: {
            qrCode: row.qrCode,
            label: row.label,
            category: row.category || null,
            description: row.description || null,
            isActive: row.isActive,
          },
        });
        imported += 1;
      } catch (error: any) {
        skipped += 1;
        errors.push(`Row ${row.rowNumber}: ${error?.message || "Unable to import equipment."}`);
      }
    }

    return NextResponse.json({ imported, skipped, errors: errors.slice(0, 10) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Import failed." }, { status: 400 });
  }
}
