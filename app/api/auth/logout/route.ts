import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = NextResponse.json({ message: "Logged out successfully" });

    // Clear Admin session cookie
    res.cookies.set("mcc_admin_session", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
      expires: new Date(0),
    });

    // Clear OB session cookie
    res.cookies.set("mcc_ob_session", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
      expires: new Date(0),
    });

    return res;
  } catch (error) {
    console.error("❌ [LOGOUT API ERROR]:", error);
    return NextResponse.json({ message: "Internal server error during logout." }, { status: 500 });
  }
}
