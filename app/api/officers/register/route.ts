import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { officerRegistrationSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = officerRegistrationSchema.parse(body);

    const officer = await prisma.officer.upsert({
      where: { badgeId: parsed.badgeId },
      update: {
        nuid: parsed.nuid,
        fullName: parsed.fullName,
        photoData: parsed.photoData ?? null,
      },
      create: {
        badgeId: parsed.badgeId,
        nuid: parsed.nuid,
        fullName: parsed.fullName,
        photoData: parsed.photoData ?? null,
      },
    });

    return NextResponse.json({ officer });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to register officer." },
      { status: 400 }
    );
  }
}
