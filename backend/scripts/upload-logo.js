import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabase } from "../src/data/supabase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, "../../frontend/src/assets/imgs/logopng.png");

async function uploadLogoToBucket() {
  try {
    if (!fs.existsSync(filePath)) {
      console.error("File not found at:", filePath);
      process.exit(1);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const BUCKET = "brand-images";

    console.log("Checking bucket:", BUCKET);
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket(BUCKET);
    if (!bucket) {
      console.log("Bucket not found, creating bucket:", BUCKET);
      const { error: createError } = await supabase.storage.createBucket(BUCKET, {
        public: true,
      });
      if (createError && !createError.message?.toLowerCase().includes("already exists")) {
        throw createError;
      }
    }

    const destinationPath = "site/logopng.png";
    console.log(`Uploading ${filePath} to ${BUCKET}/${destinationPath}...`);

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(destinationPath, fileBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(destinationPath);

    console.log("Upload successful!");
    console.log("Public URL:", publicUrlData.publicUrl);
  } catch (err) {
    console.error("Upload failed:", err.message);
    process.exit(1);
  }
}

uploadLogoToBucket();
