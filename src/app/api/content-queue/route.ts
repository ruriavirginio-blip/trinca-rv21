import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const supabaseUrl = cleanText(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseServiceRoleKey = cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({
      configured: false,
      pendingApproval: 0,
      message: "Supabase server credentials nao configuradas.",
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  const { count, error } = await supabase
    .from("content_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "aguardando_aprovacao");

  if (error) {
    const message = error.message || "";

    if (message.includes("content_queue") || message.includes("schema cache")) {
      return NextResponse.json({
        configured: false,
        pendingApproval: 0,
        message: "Tabela content_queue ainda nao existe no Supabase.",
      });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    configured: true,
    pendingApproval: count || 0,
  });
}
