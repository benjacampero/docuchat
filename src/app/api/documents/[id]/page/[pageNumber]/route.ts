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

  // If no pre-rendered image, return the PDF info so client can render
  // The client-side component will handle rendering with pdfjs-dist
  return NextResponse.json({
    document_id: id,
    page_number: page,
    pdf_url: `/api/documents/${id}/pdf`,
  });
}
