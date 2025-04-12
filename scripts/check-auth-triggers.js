require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 检查环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('错误: 缺少Supabase环境变量');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.warn('警告: 缺少SUPABASE_SERVICE_ROLE_KEY环境变量，无法执行管理员操作');
  console.warn('请在Supabase控制台获取服务角色密钥并添加到.env.local');
  console.warn('https://app.supabase.com/project/_/settings/api');
  process.exit(1);
}

// 创建Supabase客户端（使用服务角色密钥以获取管理员权限）
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkTriggers() {
  console.log('检查Supabase认证触发器...');
  
  try {
    // 首先检查profiles表是否存在
    console.log('检查profiles表...');
    const { error: tableError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (tableError) {
      if (tableError.message.includes('does not exist')) {
        console.log('❌ profiles表不存在，请先创建表');
        console.log(`
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  email TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
        return;
      } else {
        console.error('检查profiles表时出错:', tableError.message);
        return;
      }
    }
    
    console.log('✅ profiles表存在');
    
    // 检查触发器函数是否存在
    console.log('\n检查create_profile_for_user函数...');
    const { data: functions, error: funcError } = await supabase.rpc('check_function_exists', {
      function_name: 'create_profile_for_user'
    }).single();
    
    if (funcError) {
      console.error('检查函数时出错:', funcError.message);
      console.log('将执行以下RPC查询以创建辅助函数:');
      console.log(`
CREATE OR REPLACE FUNCTION check_function_exists(function_name TEXT)
RETURNS TABLE(exists BOOLEAN) AS $$
BEGIN
  RETURN QUERY SELECT COUNT(*) > 0 FROM pg_proc WHERE proname = function_name;
END;
$$ LANGUAGE plpgsql;`);
      return;
    }
    
    const functionExists = functions && functions.exists;
    
    if (!functionExists) {
      console.log('❌ create_profile_for_user函数不存在');
      console.log('请在Supabase控制台中执行以下SQL创建函数:');
      console.log(`
CREATE FUNCTION create_profile_for_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, email, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`);
    } else {
      console.log('✅ create_profile_for_user函数已存在');
    }
    
    // 检查触发器是否存在
    console.log('\n检查on_auth_user_created触发器...');
    const { data: triggers, error: triggerError } = await supabase.rpc('check_trigger_exists', {
      trigger_name: 'on_auth_user_created'
    }).single();
    
    if (triggerError) {
      console.error('检查触发器时出错:', triggerError.message);
      console.log('将执行以下RPC查询以创建辅助函数:');
      console.log(`
CREATE OR REPLACE FUNCTION check_trigger_exists(trigger_name TEXT)
RETURNS TABLE(exists BOOLEAN) AS $$
BEGIN
  RETURN QUERY SELECT COUNT(*) > 0 FROM pg_trigger WHERE tgname = trigger_name;
END;
$$ LANGUAGE plpgsql;`);
      return;
    }
    
    const triggerExists = triggers && triggers.exists;
    
    if (!triggerExists) {
      console.log('❌ on_auth_user_created触发器不存在');
      console.log('请在Supabase控制台中执行以下SQL创建触发器:');
      console.log(`
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();`);
    } else {
      console.log('✅ on_auth_user_created触发器已存在');
    }
    
    // 提供最终建议
    console.log('\n总结:');
    if (!functionExists || !triggerExists) {
      console.log('⚠️ 自动创建用户资料的触发器设置不完整');
      console.log('请在Supabase控制台中执行上述SQL语句');
    } else {
      console.log('✅ 触发器配置正确，用户注册时应自动创建资料');
      console.log('如果仍然出现问题，请检查RLS策略和其他权限设置');
    }
    
  } catch (error) {
    console.error('执行检查时出错:', error);
  }
}

// 执行检查
checkTriggers(); 