import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { endOfDay, monthRange, startOfDay } from "@/lib/utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const shiftId = searchParams.get("shiftId")?.trim() || "";
  const day = searchParams.get("day")?.trim() || "";
  const month = searchParams.get("month")?.trim() || "";

  const where: any = {};

  if (shiftId) {
    where.shiftId = shiftId;
  } else if (day) {
    where.startedAt = {
      gte: startOfDay(day),
      lte: endOfDay(day),
    };
  } else if (month) {
    const range = monthRange(month);
    where.startedAt = {
      gte: range.start,
      lte: range.end,
    };
  }

  const shifts = await prisma.shift.findMany({
    where,
    include: {
      officer: true,
      equipmentEvents: {
        include: { equipment: true },
        orderBy: { eventAt: "asc" },
      },
    },
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ shifts });
}
