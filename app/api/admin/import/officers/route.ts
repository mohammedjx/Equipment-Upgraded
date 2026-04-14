import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseOfficerImport } from "@/lib/imports";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a CSV or Excel file first." }, { status: 400 });
    }

    const rows = parseOfficerImport(Buffer.from(await file.arrayBuffer()));
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      if (!row.badgeId || !row.nuid || row.fullName.length < 2) {
        skipped += 1;
        errors.push(`Row ${row.rowNumber}: badgeId, nuid, and fullName are required.`);
        continue;
      }

      try {
        await prisma.officer.upsert({
          where: { badgeId: row.badgeId },
          update: {
            nuid: row.nuid,
            fullName: row.fullName,
            photoData: row.photoData || null,
          },
          create: {
            badgeId: row.badgeId,
            nuid: row.nuid,
            fullName: row.fullName,
            photoData: row.photoData || null,
          },
        });
        imported += 1;
      } catch (error: any) {
        skipped += 1;
        errors.push(`Row ${row.rowNumber}: ${error?.message || "Unable to import officer."}`);
      }
    }

    return NextResponse.json({ imported, skipped, errors: errors.slice(0, 10) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Import failed." }, { status: 400 });
  }
}
