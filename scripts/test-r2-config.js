// 加载环境变量
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fetch = require('node-fetch');

// R2桶名称
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'ai-music';

// 创建R2客户端
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// 从URL下载文件
async function downloadFromUrl(url) {
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

// 上传文件到R2
async function uploadToR2(key, file, contentType) {
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
    const signedUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error("上传文件到R2失败:", error);
    throw error;
  }
}

// 生成R2文件URL
function getR2FileUrl(key) {
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

// 测试访问文件
async function testFileAccess(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      console.log('文件可以成功访问!');
      const text = await response.text();
      console.log('文件内容:', text);
    } else {
      console.error('无法访问文件:', response.statusText);
    }
  } catch (error) {
    console.error('测试访问文件失败:', error);
  }
}

/**
 * 这个脚本用于测试R2配置是否正确
 * 它会创建一个测试文件，上传到R2，然后打印URL
 */
async function testR2Config() {
  try {
    console.log('开始测试R2配置...');
    console.log('R2_ENDPOINT:', process.env.R2_ENDPOINT);
    console.log('R2_PUBLIC_URL:', process.env.R2_PUBLIC_URL);
    console.log('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME);
    
    // 创建临时测试文件
    const testFilePath = path.join(process.cwd(), 'test-file.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for R2 storage integration');
    
    // 读取文件内容
    const fileBuffer = fs.readFileSync(testFilePath);
    
    // 上传到R2
    const key = `test/test-file-${Date.now()}.txt`;
    console.log('上传文件到R2:', key);
    
    const url = await uploadToR2(key, fileBuffer, 'text/plain');
    console.log('文件上传成功!');
    console.log('文件URL:', url);
    
    // 清理测试文件
    fs.unlinkSync(testFilePath);
    console.log('测试完成，已清理临时文件');
    
    // 测试访问文件
    console.log('测试访问文件...');
    await testFileAccess(url);
    
  } catch (error) {
    console.error('测试R2配置失败:', error);
  }
}

// 运行测试
testR2Config(); 