require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 检查环境变量
if (!supabaseUrl || !serviceRoleKey) {
  console.error('错误: 缺少Supabase环境变量');
  console.error('需要设置: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 创建Supabase客户端（使用服务角色密钥以获取管理员权限）
const supabase = createClient(supabaseUrl, serviceRoleKey);

// 用于存储SQL命令的数组
const sqlCommands = [];

// 为profiles表设置RLS策略
async function setupProfilesRLS() {
  console.log('设置profiles表的RLS策略...');
  
  try {
    // 1. 启用RLS
    const enableRLS = `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`;
    sqlCommands.push(enableRLS);
    
    // 2. 创建策略 - 允许用户读取自己的资料
    const readOwnProfile = `
CREATE POLICY "Users can read their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);`;
    sqlCommands.push(readOwnProfile);
    
    // 3. 创建策略 - 允许用户更新自己的资料
    const updateOwnProfile = `
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);`;
    sqlCommands.push(updateOwnProfile);
    
    // 4. 创建策略 - 允许新用户注册时插入资料
    const insertProfile = `
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);`;
    sqlCommands.push(insertProfile);
    
    // 5. 创建策略 - 允许服务角色管理所有资料
    const serviceRolePolicy = `
CREATE POLICY "Service role can manage all profiles"
ON profiles
USING (auth.role() = 'service_role');`;
    sqlCommands.push(serviceRolePolicy);
    
    // 6. 创建策略 - 允许匿名用户在注册过程中创建资料
    const authFunctionPolicy = `
CREATE POLICY "Auth functions can create profiles"
ON profiles
FOR INSERT
WITH CHECK (true);`;
    sqlCommands.push(authFunctionPolicy);
    
    console.log('生成的RLS策略SQL命令:');
    sqlCommands.forEach((sql, index) => {
      console.log(`\n${index + 1}. ${sql}`);
    });
    
    console.log('\n请在Supabase SQL编辑器中执行这些命令来设置RLS策略。');
    console.log('链接: https://app.supabase.com/project/_/sql');
    
  } catch (error) {
    console.error('设置RLS策略时出错:', error);
  }
}

// 检查并显示现有策略
async function checkExistingPolicies() {
  console.log('\n检查现有RLS策略...');
  
  try {
    // 使用自定义RPC函数来获取现有策略
    const { data, error } = await supabase.rpc('get_table_policies', {
      table_name: 'profiles'
    });
    
    if (error) {
      if (error.message.includes('function get_table_policies() does not exist')) {
        console.log('需要创建辅助函数来查询现有策略。请在SQL编辑器中执行:');
        console.log(`
CREATE OR REPLACE FUNCTION get_table_policies(table_name TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(pol))
  INTO result
  FROM pg_policies pol
  WHERE pol.tablename = table_name;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;`);
        return;
      } else {
        throw error;
      }
    }
    
    if (!data || data.length === 0) {
      console.log('没有找到现有的RLS策略。');
    } else {
      console.log('现有RLS策略:');
      data.forEach((policy, index) => {
        console.log(`${index + 1}. ${policy.policyname} (${policy.cmd})`);
      });
    }
    
  } catch (error) {
    console.error('检查策略时出错:', error);
  }
}

// 执行脚本
async function run() {
  await setupProfilesRLS();
  await checkExistingPolicies();
  
  console.log('\n请注意: 此脚本不会自动执行SQL命令，而是生成需要手动执行的命令。');
  console.log('这样做是为了安全起见，让您可以在执行前检查命令。');
}

run(); 