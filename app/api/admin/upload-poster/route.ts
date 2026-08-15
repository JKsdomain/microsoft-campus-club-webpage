import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

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

    // 3. Upload to Cloudinary if configured
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "mcc_event_posters" },
            (error, result) => {
              if (error || !result) return reject(error || new Error("Cloudinary upload failed"));
              resolve({ secure_url: result.secure_url, public_id: result.public_id });
            }
          );
          uploadStream.end(buffer);
        }
      );

      console.log(`✅ [CLOUDINARY UPLOAD SUCCESS]: ${uploadResult.secure_url}`);
      return NextResponse.json({
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        type: "IMAGE",
      });
    }

    // 4. Fallback local storage in public/uploads/posters if Cloudinary credentials are not set
    const uploadDir = path.resolve(process.cwd(), "public", "uploads", "posters");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `poster_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/posters/${filename}`;
    console.log(`✅ [LOCAL POSTER UPLOAD SUCCESS]: ${publicUrl}`);

    return NextResponse.json({
      url: publicUrl,
      publicId: filename,
      type: "IMAGE",
    });
  } catch (error: any) {
    console.error("❌ [POSTER UPLOAD ERROR]:", error);
    return NextResponse.json(
      { message: "Unable to upload the poster. Please try again.", error: error.message },
      { status: 500 }
    );
  }
}
