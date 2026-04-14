import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { noEquipmentSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = noEquipmentSchema.parse(body);

    const shift = await prisma.shift.update({
      where: { shiftId: parsed.shiftId },
      data: { noEquipment: true },
    });

    return NextResponse.json({ shift, message: "Officer marked as no equipment for this shift." });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed to update shift." }, { status: 400 });
  }
}
