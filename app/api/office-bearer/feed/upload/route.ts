import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("media") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No media file provided." }, { status: 400 });
    }

    const mimeType = file.type.toLowerCase();
    const isImage = mimeType.startsWith("image/");
    const isVideo = mimeType.startsWith("video/");

    if (!isImage && !isVideo) {
      return NextResponse.json(
        { message: "Unsupported file format. Please select a valid image or video." },
        { status: 400 }
      );
    }

    // Size limit: 10MB for images, 50MB for videos
    const maxBytes = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { message: `File exceeds maximum allowed size (${isVideo ? "50MB" : "10MB"}).` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary under 'mcc/feed' folder
    const result = await uploadToCloudinary(
      buffer,
      "mcc/feed",
      isVideo ? "video" : "image"
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ [FEED MEDIA UPLOAD ROUTE ERROR]:", error);
    return NextResponse.json(
      { message: "Unable to upload media. Please try again.", error: error.message },
      { status: 500 }
    );
  }
}
