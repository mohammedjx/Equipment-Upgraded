import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, createAdminSessionToken, getAdminPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const adminPassword = getAdminPassword();

    if (!adminPassword) {
      return NextResponse.json(
        { error: "ADMIN_PASSWORD is not set. Add it to your environment variables first." },
        { status: 500 }
      );
    }

    if (!password || password !== adminPassword) {
      return NextResponse.json({ error: "Invalid admin password." }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: createAdminSessionToken(adminPassword),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Unable to sign in." }, { status: 400 });
  }
}
