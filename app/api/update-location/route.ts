import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const supabase = supabaseServer();
    const { pet_slug, lat, lng } = await req.json();

    if (!pet_slug || !lat || !lng) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const locationString = `${lat},${lng}`;

    const { error } = await supabase
      .from("pets")
      .update({
        last_location: locationString,
        last_location_at: new Date().toISOString()
      })
      .eq("slug", pet_slug);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
