import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { equipmentScanSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = equipmentScanSchema.parse(body);

    const shift = await prisma.shift.findUnique({
      where: { shiftId: parsed.shiftId },
      include: { officer: true },
    });

    if (!shift) {
      return NextResponse.json({ error: "Shift not found." }, { status: 404 });
    }

    if (shift.endedAt) {
      return NextResponse.json({ error: "This shift is already closed." }, { status: 400 });
    }

    const equipment = await prisma.equipment.findUnique({
      where: { qrCode: parsed.qrCode },
    });

    if (!equipment) {
      return NextResponse.json({ error: "Equipment not found. Register the equipment first." }, { status: 404 });
    }

    const lastEvent = await prisma.equipmentEvent.findFirst({
      where: { equipmentId: equipment.id },
      orderBy: { eventAt: "desc" },
      include: { shift: true },
    });

    if (parsed.action === "CHECK_OUT") {
      if (lastEvent && lastEvent.type === "CHECK_OUT" && !lastEvent.shift.endedAt) {
        return NextResponse.json(
          {
            error: `Equipment is already checked out on shift ${lastEvent.shift.shiftId}.`,
          },
          { status: 400 }
        );
      }
    }

    if (parsed.action === "CHECK_IN") {
      if (!lastEvent || lastEvent.type !== "CHECK_OUT") {
        return NextResponse.json({ error: "Equipment is not currently checked out." }, { status: 400 });
      }
    }

    const event = await prisma.equipmentEvent.create({
      data: {
        shiftIdRef: shift.id,
        equipmentId: equipment.id,
        type: parsed.action,
        eventAt: new Date(),
      },
      include: {
        equipment: true,
        shift: {
          include: { officer: true },
        },
      },
    });

    return NextResponse.json({
      event,
      message: `${equipment.label} ${parsed.action === "CHECK_OUT" ? "checked out" : "checked in"} successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed to log equipment event." }, { status: 400 });
  }
}
