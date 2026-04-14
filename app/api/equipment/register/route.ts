import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { equipmentRegistrationSchema } from "@/lib/validators";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = equipmentRegistrationSchema.parse(body);

    const equipment = await prisma.equipment.upsert({
      where: { qrCode: parsed.qrCode },
      update: {
        label: parsed.label,
        category: parsed.category || null,
        description: parsed.description || null,
      },
      create: {
        qrCode: parsed.qrCode,
        label: parsed.label,
        category: parsed.category || null,
        description: parsed.description || null,
      },
    });

    return NextResponse.json({ equipment });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Failed to register equipment." }, { status: 400 });
  }
}
