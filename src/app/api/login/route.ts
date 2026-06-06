import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { user_id, role, password } = body;

    if (!user_id || !role || !password) {
      return NextResponse.json(
        { error: "User ID, role, and password are required" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from("app_users")
      .select("*")
      .eq("user_id", user_id)
      .eq("role", role)
      .eq("active", true)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid login details" },
        { status: 401 }
      );
    }

    const submittedHash = hashPassword(password);

    if (submittedHash !== user.password_hash) {
      return NextResponse.json(
        { error: "Invalid login details" },
        { status: 401 }
      );
    }

    const sessionPayload = {
      user_id: user.user_id,
      display_name: user.display_name,
      role: user.role,
    };

    const sessionValue = Buffer.from(JSON.stringify(sessionPayload)).toString(
      "base64url"
    );

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
    });

    response.cookies.set("storepulse_session", sessionValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}