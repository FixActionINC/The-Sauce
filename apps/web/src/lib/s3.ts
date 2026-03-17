import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

let _client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: process.env.AWS_REGION || "us-west-2",
    });
  }
  return _client;
}

function getBucket(): string {
  const bucket = process.env.S3_IMAGES_BUCKET;
  if (!bucket) throw new Error("S3_IMAGES_BUCKET is not set.");
  return bucket;
}

function getCdnDomain(): string {
  const domain = process.env.CLOUDFRONT_DOMAIN;
  if (!domain) throw new Error("CLOUDFRONT_DOMAIN is not set.");
  return domain;
}

/**
 * Build the CDN URL for a given S3 key.
 */
export function getCdnUrl(key: string): string {
  return `https://${getCdnDomain()}/${key}`;
}

/**
 * Upload a file buffer to S3 under the given key.
 * Returns the CDN URL of the uploaded file.
 */
export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const client = getS3Client();
  const bucket = getBucket();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return getCdnUrl(key);
}

/**
 * Delete a file from S3 by its key.
 */
export async function deleteFromS3(key: string): Promise<void> {
  const client = getS3Client();
  const bucket = getBucket();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

/**
 * Extract the S3 key from a CDN URL.
 * Returns null if the URL doesn't match the CDN domain.
 */
export function extractS3Key(cdnUrl: string): string | null {
  try {
    const domain = getCdnDomain();
    const url = new URL(cdnUrl);
    if (url.hostname !== domain) return null;
    // Remove leading slash
    return url.pathname.slice(1);
  } catch {
    return null;
  }
}
