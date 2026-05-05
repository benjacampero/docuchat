import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from "@/lib/constants";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: documents, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Documents GET]", error.message);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }

  return NextResponse.json({ documents });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const title = formData.get("title") as string;

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds 50MB limit" }, { status: 400 });
  }

  // Use the authenticated server client for DB operations (passes RLS)
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .insert({
      title: title || file.name.replace(".pdf", ""),
      file_name: file.name,
      file_path: "",
      file_size: file.size,
      status: "pending",
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (docError) {
    console.error("[Documents POST]", docError.message);
    return NextResponse.json({ error: "Failed to create document record" }, { status: 500 });
  }

  // Upload file to storage using the same authenticated client
  const filePath = `${doc.id}/${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(filePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error("[Documents Upload]", uploadError.message);
    await supabase.from("documents").delete().eq("id", doc.id);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }

  // Update document with file path
  await supabase
    .from("documents")
    .update({ file_path: filePath })
    .eq("id", doc.id);

  return NextResponse.json({ document: { ...doc, file_path: filePath } }, { status: 201 });
}
