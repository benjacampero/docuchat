import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageNumber: string }> }
) {
  const { id, pageNumber } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = parseInt(pageNumber, 10);
  if (isNaN(page) || page < 1) {
    return NextResponse.json({ error: "Invalid page number" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  // Get document to find the PDF file path
  const { data: doc } = await adminSupabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .single();

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Check if a pre-rendered image exists in storage
  const imagePath = `${id}/page-${page}.png`;
  const { data: imageData } = await adminSupabase.storage
    .from("page-images")
    .download(imagePath);

  if (imageData) {
    const buffer = Buffer.from(await imageData.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // Return a simple placeholder PNG
  // Pre-rendering PDFs on Vercel serverless is not feasible without additional dependencies
  const placeholderPng = createPlaceholderPng();
  return new NextResponse(placeholderPng, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function createPlaceholderPng(): Buffer {
  // Minimal 1x1 white PNG
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
    0x00, 0x00, 0x03, 0x00, 0x01, 0xf5, 0x5a, 0xf6, 0x0f, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
}
