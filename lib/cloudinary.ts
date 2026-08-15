import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Initialize Cloudinary Server SDK using environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  type: "IMAGE" | "VIDEO";
}

/**
 * Centralized Server-Side Cloudinary Upload Utility.
 * Uploads media buffer to specified Cloudinary folder (e.g. 'mcc/announcements', 'mcc/feed').
 * Never exposes API Secrets to the client.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string = "mcc/other",
  resourceType: "image" | "video" = "image"
): Promise<CloudinaryUploadResult> {
  const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (isCloudinaryConfigured) {
    try {
      const result = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: resourceType,
            },
            (error, res) => {
              if (error || !res) {
                return reject(error || new Error("Cloudinary upload failed with empty response."));
              }
              resolve({ secure_url: res.secure_url, public_id: res.public_id });
            }
          );
          uploadStream.end(buffer);
        }
      );

      console.log(`✅ [CLOUDINARY SERVER UPLOAD SUCCESS]: ${result.secure_url} (Folder: ${folder})`);
      return {
        url: result.secure_url,
        publicId: result.public_id,
        type: resourceType === "video" ? "VIDEO" : "IMAGE",
      };
    } catch (err) {
      console.error("❌ [CLOUDINARY UPLOAD FAILED]:", err);
      throw new Error("Unable to upload media to Cloudinary. Please try again.");
    }
  }

  // Fallback local storage if Cloudinary environment variables are missing
  const folderSlug = folder.replace(/[^a-zA-Z0-9_-]/g, "_");
  const uploadDir = path.resolve(process.cwd(), "public", "uploads", folderSlug);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = resourceType === "video" ? "mp4" : "jpg";
  const filename = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const filePath = path.join(uploadDir, filename);

  fs.writeFileSync(filePath, buffer);

  const localUrl = `/uploads/${folderSlug}/${filename}`;
  console.log(`⚠️ [FALLBACK LOCAL STORAGE UPLOAD SUCCESS]: ${localUrl}`);

  return {
    url: localUrl,
    publicId: filename,
    type: resourceType === "video" ? "VIDEO" : "IMAGE",
  };
}

/**
 * Deletes a media asset from Cloudinary using its publicId.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "video" = "image"
): Promise<void> {
  if (!publicId || publicId.startsWith("media_")) return;

  try {
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`🗑️ [CLOUDINARY ASSET DELETED]: ${publicId}`);
    }
  } catch (err) {
    console.warn(`⚠️ Failed to delete Cloudinary asset (${publicId}):`, err);
  }
}
