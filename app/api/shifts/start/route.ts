import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shiftStartSchema } from "@/lib/validators";
import { createShiftCode } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = shiftStartSchema.parse(body);

    const officer = await prisma.officer.findUnique({ where: { badgeId: parsed.badgeId } });
    if (!officer) {
      return NextResponse.json({ error: "Officer not found. Register the officer first." }, { status: 404 });
    }

    const openShift = await prisma.shift.findFirst({
      where: {
        officerId: officer.id,
        endedAt: null,
      },
      orderBy: { startedAt: "desc" },
    });

    if (openShift) {
      return NextResponse.json({
        shift: openShift,
        officer,
        warning: "Officer already has an open shift.",
      });
    }

    const shift = await prisma.shift.create({
      data: {
        shiftId: createShiftCode(),
        officerId: officer.id,
        startedAt: new Date(),
      },
    });

    return NextResponse.json({ shift, officer });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed to start shift." }, { status: 400 });
  }
}
