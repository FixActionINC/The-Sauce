import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  uploadProductImage,
  deleteProductImage,
  setPrimaryImage,
} from "@/lib/services/image.service";

// ---------------------------------------------------------------------------
// POST /api/admin/images - Upload a product image
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  const productIdStr = formData.get("productId");
  const alt = formData.get("alt");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file provided." },
      { status: 400 },
    );
  }

  if (!productIdStr || typeof productIdStr !== "string") {
    return NextResponse.json(
      { error: "productId is required." },
      { status: 400 },
    );
  }

  const productId = parseInt(productIdStr, 10);
  if (isNaN(productId)) {
    return NextResponse.json(
      { error: "Invalid productId." },
      { status: 400 },
    );
  }

  try {
    const image = await uploadProductImage(
      productId,
      file,
      typeof alt === "string" ? alt : undefined,
    );

    return NextResponse.json(image, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/admin/images - Delete a product image
// ---------------------------------------------------------------------------

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { imageId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!body.imageId || typeof body.imageId !== "number") {
    return NextResponse.json(
      { error: "imageId is required." },
      { status: 400 },
    );
  }

  try {
    await deleteProductImage(body.imageId);
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/images - Set an image as primary
// ---------------------------------------------------------------------------

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { imageId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!body.imageId || typeof body.imageId !== "number") {
    return NextResponse.json(
      { error: "imageId is required." },
      { status: 400 },
    );
  }

  try {
    await setPrimaryImage(body.imageId);
    return NextResponse.json({ updated: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
