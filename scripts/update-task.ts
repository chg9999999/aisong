/**
 * 任务数据补全脚本
 * 用于手动补全指定任务ID的数据
 * 
 * 用法: ts-node scripts/update-task.ts <taskId>
 */

import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// 任务存储路径
const TASKS_DIR = path.join(process.cwd(), 'tasks');

// 确保任务目录存在
if (!fs.existsSync(TASKS_DIR)) {
  try {
    fs.mkdirSync(TASKS_DIR, { recursive: true });
    console.log('成功创建任务目录:', TASKS_DIR);
  } catch (err) {
    console.error('创建任务目录失败:', err);
  }
}

/**
 * 更新指定任务的数据
 * @param taskId 任务ID
 */
async function updateTask(taskId: string) {
  console.log(`开始更新任务: ${taskId}`);
  
  // 检查任务文件是否存在
  const taskPath = path.join(TASKS_DIR, `${taskId}.json`);
  if (!fs.existsSync(taskPath)) {
    console.error(`错误: 找不到任务 ${taskId}`);
    return;
  }
  
  try {
    // 读取当前任务数据
    const taskData = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
    console.log(`当前任务状态: ${taskData.status}`);
    
    // 请求任务状态
    const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.example.com';
    const API_KEY = process.env.API_KEY || '';
    
    console.log(`请求API: ${API_URL}/api/v1/generate/record-info?taskId=${taskId}`);
    
    const response = await fetch(`${API_URL}/api/v1/generate/record-info?taskId=${taskId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    
    if (!response.ok) {
      console.error(`API请求失败: ${response.status} ${response.statusText}`);
      return;
    }
    
    const apiData = await response.json();
    console.log(`API返回状态: ${apiData.data?.status || 'UNKNOWN'}`);
    
    // 更新任务数据
    const updatedTaskData = {
      ...taskData,
      apiTaskInfo: apiData.data,
      status: apiData.data?.status || taskData.status,
      results: apiData.data?.response?.sunoData || taskData.results || [],
      lastUpdate: new Date().toISOString()
    };
    
    // 保存更新后的任务数据
    fs.writeFileSync(taskPath, JSON.stringify(updatedTaskData, null, 2));
    console.log(`成功更新任务数据: ${taskId}`);
    console.log(`新状态: ${updatedTaskData.status}`);
    console.log(`结果数量: ${updatedTaskData.results.length}`);
    
  } catch (error) {
    console.error(`更新任务失败:`, error);
  }
}

// 从命令行参数获取任务ID
const taskId = process.argv[2];
if (!taskId) {
  console.error('错误: 缺少任务ID');
  console.log('用法: ts-node scripts/update-task.ts <taskId>');
  process.exit(1);
}

// 执行更新
updateTask(taskId).catch(err => {
  console.error('脚本执行失败:', err);
  process.exit(1);
}); 