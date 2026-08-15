import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("poster") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No poster image file provided." }, { status: 400 });
    }

    // 1. File Type Validation
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { message: "Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP." },
        { status: 400 }
      );
    }

    // 2. File Size Validation (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { message: "Image poster exceeds 5MB size limit. Please choose a smaller image." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Centralized Cloudinary Upload under 'mcc/announcements' folder
    const result = await uploadToCloudinary(buffer, "mcc/announcements", "image");

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ [POSTER UPLOAD ROUTE ERROR]:", error);
    return NextResponse.json(
      { message: "Unable to upload the image. Please try again.", error: error.message },
      { status: 500 }
    );
  }
}
