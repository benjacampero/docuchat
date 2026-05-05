import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processDocument } from "@/lib/pdf/pipeline";

export const maxDuration = 300; // 5 minutes max for serverless

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { document_id } = await request.json();

  if (!document_id) {
    return NextResponse.json({ error: "document_id is required" }, { status: 400 });
  }

  // Mark as processing immediately
  await supabase
    .from("documents")
    .update({ status: "processing", error_message: null })
    .eq("id", document_id);

  // Run processing without awaiting — let it run in background
  // The pipeline handles its own error states in the DB
  processDocument(document_id, supabase).catch(() => {
    // Error already saved to DB by processDocument
  });

  return NextResponse.json({ success: true, message: "Processing started" });
}
