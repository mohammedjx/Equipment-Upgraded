import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { endShiftSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = endShiftSchema.parse(body);

    const shift = await prisma.shift.update({
      where: { shiftId: parsed.shiftId },
      data: { endedAt: new Date() },
      include: {
        officer: true,
        equipmentEvents: {
          include: { equipment: true },
          orderBy: { eventAt: "asc" },
        },
      },
    });

    return NextResponse.json({ shift, message: "Shift ended successfully." });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed to end shift." }, { status: 400 });
  }
}
