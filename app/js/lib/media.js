import { supabase } from "./supabase.js";

const BUCKET = "hub-public";

function safeName(file) {
  return String(file?.name || "file")
    .replace(/[^\w.\-]+/g, "_")
    .slice(-100);
}

function validateFile(file) {
  if (!file || !file.size) {
    throw new Error("Please choose a file.");
  }

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {
    throw new Error("File is too large. Maximum size is 10MB.");
  }
}

export async function uploadPublic(file, folder) {
  validateFile(file);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    throw new Error("Please sign in first.");
  }

  const path =
    `${user.id}/${folder}/` + `${crypto.randomUUID()}-${safeName(file)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    cacheControl: "3600",
    contentType: file.type || undefined,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return {
    path,
    publicUrl,
    fileName: file.name,
    mimeType: file.type || null,
    fileSize: file.size,
  };
}

export async function uploadMultiple(files, module, recordId, maximum = 3) {
  const selected = Array.from(files || [])
    .filter((file) => file && file.size)
    .slice(0, maximum);

  if (!selected.length) {
    return [];
  }

  if (selected.length > maximum) {
    throw new Error(`You can upload a maximum of ${maximum} images.`);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;

  if (!user) {
    throw new Error("Please sign in first.");
  }

  const results = [];

  for (let index = 0; index < selected.length; index++) {
    const file = selected[index];

    validateFile(file);

    if (!file.type.startsWith("image/")) {
      throw new Error(`"${file.name}" is not an image.`);
    }

    const uploaded = await uploadPublic(file, module);

    const { data, error } = await supabase
      .from("media_assets")
      .insert({
        owner_id: user.id,
        module,
        record_id: recordId,
        storage_path: uploaded.path,
        public_url: uploaded.publicUrl,
        file_name: uploaded.fileName,
        mime_type: uploaded.mimeType,
        file_size: uploaded.fileSize,
        sort_order: index,
      })
      .select()
      .single();

    if (error) {
      // Remove uploaded file if DB registration fails.
      await supabase.storage.from(BUCKET).remove([uploaded.path]);

      throw error;
    }

    results.push(data);
  }

  return results;
}

export async function getMedia(module, recordId) {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("module", module)
    .eq("record_id", recordId)
    .order("sort_order", {
      ascending: true,
    });

  if (error) throw error;

  return data || [];
}

export async function deleteMedia(media) {
  if (!media?.storage_path) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Please sign in first.");
  }

  if (media.owner_id !== user.id) {
    throw new Error("You are not allowed to delete this file.");
  }

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([media.storage_path]);

  if (storageError) {
    console.error("Storage deletion failed:", storageError);
  }

  const { error } = await supabase
    .from("media_assets")
    .delete()
    .eq("id", media.id)
    .eq("owner_id", user.id);

  if (error) throw error;
}
