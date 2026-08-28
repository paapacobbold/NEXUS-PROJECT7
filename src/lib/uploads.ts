import { getSupabaseClient } from './supabase';

/**
 * File uploads to Supabase Storage.
 *
 * Pickers (expo-image-picker, expo-document-picker) hand back a local `file://`
 * URI that only exists on that device — storing it in the database, as the app
 * did for avatars, produces a broken image everywhere else. Everything that
 * leaves the device goes through here.
 *
 * Object paths are always `<user-id>/<filename>`; the storage policies in
 * migration 02 key write access off that first folder segment.
 */

export type UploadBucket = 'avatars' | 'resources' | 'recordings';

export type UploadResult = {
  /** Path within the bucket — store this, not the signed URL. */
  path: string;
  /** Public URL for `avatars`; a time-limited signed URL for private buckets. */
  url: string;
};

/** Reads a local file URI into bytes. RN has no Node Buffer, so go via fetch. */
async function readLocalFile(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Could not read the selected file (${response.status}).`);
  }
  return response.arrayBuffer();
}

function extensionFor(uri: string, fallback: string): string {
  const match = /\.([a-zA-Z0-9]+)(?:\?|#|$)/.exec(uri);
  return (match?.[1] ?? fallback).toLowerCase();
}

/**
 * Uploads a picked file and returns a URL safe to persist.
 *
 * Throws with a message suitable for showing the user — callers should catch
 * and surface it via the toast rather than swallowing it.
 */
export async function uploadFile({
  bucket,
  userId,
  uri,
  contentType,
  fileName,
}: {
  bucket: UploadBucket;
  userId: string;
  uri: string;
  contentType?: string;
  fileName?: string;
}): Promise<UploadResult> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Not connected — sign in and try again.');
  if (!userId) throw new Error('Your session expired. Sign in and try again.');

  const bytes = await readLocalFile(uri);

  const safeName =
    fileName?.replace(/[^a-zA-Z0-9._-]/g, '_') ??
    `${Date.now()}.${extensionFor(uri, bucket === 'avatars' ? 'jpg' : 'bin')}`;
  const path = `${userId}/${safeName}`;

  const { error } = await client.storage.from(bucket).upload(path, bytes, {
    contentType: contentType ?? guessContentType(safeName),
    upsert: true,
  });

  if (error) {
    throw new Error(error.message || 'Upload failed. Check your connection and try again.');
  }

  return { path, url: await urlFor(bucket, path) };
}

/** Public URL for the avatars bucket, signed URL for the private ones. */
export async function urlFor(bucket: UploadBucket, path: string): Promise<string> {
  const client = getSupabaseClient();
  if (!client) return path;

  if (bucket === 'avatars') {
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  // Private buckets: one hour is long enough to watch a recording or open a PDF.
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error || !data) return path;
  return data.signedUrl;
}

export async function deleteFile(bucket: UploadBucket, path: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.storage.from(bucket).remove([path]);
}

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
};

function guessContentType(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}
