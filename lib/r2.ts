import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2桶名称
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'ai-music';

// 创建R2客户端
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// 上传文件到R2
export async function uploadToR2(
  key: string,
  file: Buffer,
  contentType: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await r2Client.send(command);
    
    // 生成预签名URL
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    // 生成有效期较长的URL (7天)，这样不会频繁过期
    const signedUrl = await getSignedUrl(r2Client, getCommand, { 
      expiresIn: 3600 * 24 * 7 
    });
    
    return signedUrl;
  } catch (error) {
    console.error("上传文件到R2失败:", error);
    throw error;
  }
}

// 从URL下载文件
export async function downloadFromUrl(url: string): Promise<Buffer> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error("从URL下载文件失败:", error);
    throw error;
  }
}

// 生成R2文件的预签名URL
export async function getSignedFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    
    return await getSignedUrl(r2Client, command, { expiresIn });
  } catch (error) {
    console.error("生成预签名URL失败:", error);
    throw error;
  }
}

// 生成R2文件URL
export function getR2FileUrl(key: string): string {
  // 使用公共访问URL
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) {
    throw new Error("缺少R2公共访问URL环境变量");
  }
  
  // 确保URL格式正确
  const baseUrl = publicUrl.endsWith('/') ? publicUrl.slice(0, -1) : publicUrl;
  
  // 组合完整URL
  return `${baseUrl}/${key}`;
} 