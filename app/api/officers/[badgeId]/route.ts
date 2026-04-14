import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, context: { params: Promise<{ badgeId: string }> }) {
  const { badgeId } = await context.params;

  const officer = await prisma.officer.findUnique({
    where: { badgeId },
  });

  if (!officer) {
    return NextResponse.json({ error: "Officer not found." }, { status: 404 });
  }

  return NextResponse.json({ officer });
}
