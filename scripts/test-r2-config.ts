import { uploadToR2, getR2FileUrl } from '../lib/r2';
import fs from 'fs';
import path from 'path';

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
    
    // 生成并打印URL
    const publicUrl = getR2FileUrl(key);
    console.log('公共访问URL:', publicUrl);
    
    // 清理测试文件
    fs.unlinkSync(testFilePath);
    console.log('测试完成，已清理临时文件');
    
    // 测试访问文件
    console.log('测试访问文件...');
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
    
  } catch (error) {
    console.error('测试R2配置失败:', error);
  }
}

// 运行测试
testR2Config(); 