import { supabase } from "./supabase.js";

const PUBLIC_BUCKET = "hub-public";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function safeName(file) {
  return String(file?.name || "image")
    .replace(/[^\w.\-]+/g, "_")
    .slice(-100);
}

function validateImage(file) {
  if (!file || !file.size) {
    throw new Error("Please choose an image.");
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error(
      `"${file.name}" is not a supported image. Use JPG, PNG or WEBP.`,
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(`"${file.name}" is too large. Maximum image size is 10MB.`);
  }
}

async function currentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;

  if (!user) {
    throw new Error("Please sign in before uploading files.");
  }

  return user;
}

/**
 * Upload one public image.
 *
 * Returns:
 * {
 *   path,
 *   publicUrl,
 *   fileName,
 *   mimeType,
 *   fileSize
 * }
 */
export async function uploadPublic(file, folder = "general") {
  validateImage(file);

  const user = await currentUser();

  const path =
    `${user.id}/${folder}/` + `${crypto.randomUUID()}-${safeName(file)}`;

  const { error } = await supabase.storage
    .from(PUBLIC_BUCKET)
    .upload(path, file, {
      upsert: false,
      cacheControl: "3600",
      contentType: file.type,
    });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(path);

  return {
    path,
    publicUrl,
    fileName: file.name,
    mimeType: file.type,
    fileSize: file.size,
  };
}

/**
 * Upload up to three images.
 *
 * Returns an array of public URL strings.
 */
export async function uploadPublicMany(files, folder = "general", maximum = 3) {
  const selected = Array.from(files || [])
    .filter((file) => file && file.size)
    .slice(0, maximum);

  if (!selected.length) {
    return [];
  }

  if (selected.length > maximum) {
    throw new Error(`You can upload a maximum of ${maximum} images.`);
  }

  const uploaded = [];

  try {
    for (const file of selected) {
      const result = await uploadPublic(file, folder);

      uploaded.push(result);
    }

    return uploaded.map((item) => item.publicUrl);
  } catch (error) {
    /*
     * Roll back files already uploaded if a later upload fails.
     */
    const paths = uploaded.map((item) => item.path);

    if (paths.length) {
      await supabase.storage
        .from(PUBLIC_BUCKET)
        .remove(paths)
        .catch(() => {});
    }

    throw error;
  }
}

/**
 * Delete public files belonging to the current user.
 */
export async function deletePublicFiles(paths = []) {
  const user = await currentUser();

  const safePaths = Array.from(paths)
    .filter(Boolean)
    .filter((path) => String(path).startsWith(`${user.id}/`));

  if (!safePaths.length) {
    return;
  }

  const { error } = await supabase.storage
    .from(PUBLIC_BUCKET)
    .remove(safePaths);

  if (error) {
    throw error;
  }
}

/**
 * Convert a public Supabase storage URL back into
 * its storage path.
 */
export function publicUrlToPath(url) {
  try {
    const parsed = new URL(url);

    const marker = `/storage/v1/object/public/${PUBLIC_BUCKET}/`;

    const index = parsed.pathname.indexOf(marker);

    if (index === -1) {
      return null;
    }

    return decodeURIComponent(parsed.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}
