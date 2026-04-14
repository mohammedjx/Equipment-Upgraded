import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function currentItemsForShift(events: Array<{ type: "CHECK_OUT" | "CHECK_IN"; equipment: { id: string; label: string; qrCode: string } }>) {
  const map = new Map<string, { id: string; label: string; qrCode: string }>();
  for (const event of events) {
    if (event.type === "CHECK_OUT") map.set(event.equipment.id, event.equipment);
    if (event.type === "CHECK_IN") map.delete(event.equipment.id);
  }
  return [...map.values()];
}

export async function GET() {
  const [officerCount, equipmentCount, openShiftCount, eventHistory, openShifts] = await Promise.all([
    prisma.officer.count(),
    prisma.equipment.count(),
    prisma.shift.count({ where: { endedAt: null } }),
    prisma.equipmentEvent.findMany({
      take: 500,
      orderBy: { eventAt: "desc" },
      include: {
        equipment: true,
        shift: { include: { officer: true } },
      },
    }),
    prisma.shift.findMany({
      where: { endedAt: null },
      orderBy: { startedAt: "desc" },
      include: {
        officer: true,
        equipmentEvents: {
          orderBy: { eventAt: "asc" },
          include: { equipment: true },
        },
      },
    }),
  ]);

  const latestByEquipment = new Map<string, (typeof eventHistory)[number]>();
  for (const event of eventHistory) {
    if (!latestByEquipment.has(event.equipmentId)) {
      latestByEquipment.set(event.equipmentId, event);
    }
  }

  const checkedOutItems = [...latestByEquipment.values()]
    .filter((event) => event.type === "CHECK_OUT" && !event.shift.endedAt)
    .map((event) => ({
      qrCode: event.equipment.qrCode,
      label: event.equipment.label,
      category: event.equipment.category,
      shiftId: event.shift.shiftId,
      officerName: event.shift.officer.fullName,
      badgeId: event.shift.officer.badgeId,
      eventAt: event.eventAt,
    }));

  const openShiftCards = openShifts.map((shift) => ({
    shiftId: shift.shiftId,
    startedAt: shift.startedAt,
    noEquipment: shift.noEquipment,
    officer: {
      fullName: shift.officer.fullName,
      badgeId: shift.officer.badgeId,
      nuid: shift.officer.nuid,
    },
    activeEquipment: currentItemsForShift(shift.equipmentEvents),
  }));

  return NextResponse.json({
    stats: {
      officerCount,
      equipmentCount,
      openShiftCount,
      activeCheckoutCount: checkedOutItems.length,
    },
    checkedOutItems,
    openShifts: openShiftCards,
    recentEvents: eventHistory.slice(0, 20),
  });
}
