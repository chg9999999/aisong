require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 检查环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('错误: 缺少Supabase环境变量');
  process.exit(1);
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 要检查的表
const tables = ['profiles', 'music_tracks', 'favorites'];

async function checkTables() {
  console.log('检查Supabase数据表...');
  
  // 用于存储结果的对象
  const results = {};
  
  try {
    // 检查每个表是否存在
    for (const table of tables) {
      console.log(`检查表 ${table}...`);
      
      // 尝试查询表结构
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        // 如果有错误，检查是否是表不存在的错误
        if (error.message.includes('does not exist')) {
          results[table] = false;
          console.log(`- ${table}: ❌ 不存在`);
        } else {
          // 其他错误
          console.error(`检查表 ${table} 时出错:`, error.message);
          results[table] = null; // 表示未知状态
        }
      } else {
        // 表存在
        results[table] = true;
        console.log(`- ${table}: ✅ 已存在`);
      }
    }
    
    // 输出结果
    console.log('\n结论:');
    const missingTables = tables.filter(table => results[table] === false);
    
    if (missingTables.length === 0) {
      console.log('✅ 所有必要的表已存在');
    } else {
      console.log(`❌ 缺少 ${missingTables.length} 个表: ${missingTables.join(', ')}`);
      console.log('\n请参考以下SQL创建缺失的表:');
      
      // 输出创建表的SQL
      if (missingTables.includes('profiles')) {
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
);

-- 触发器：新用户注册自动创建profile
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();
`);
      }
      
      if (missingTables.includes('music_tracks')) {
        console.log(`
CREATE TABLE music_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  image_url TEXT,
  duration INTEGER,
  task_id TEXT,
  source_type TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  is_public BOOLEAN DEFAULT TRUE,
  commercial_use BOOLEAN DEFAULT FALSE,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiration_date TIMESTAMP WITH TIME ZONE
);

-- 索引
CREATE INDEX idx_music_tracks_user_id ON music_tracks(user_id);
CREATE INDEX idx_music_tracks_task_id ON music_tracks(task_id);
CREATE INDEX idx_music_tracks_source_type ON music_tracks(source_type);
`);
      }
      
      if (missingTables.includes('favorites')) {
        console.log(`
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  track_id UUID REFERENCES music_tracks(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);
`);
      }
      
      console.log('\n请在Supabase控制台中执行这些SQL语句来创建缺失的表。');
      console.log('链接: https://app.supabase.com/project/_/database/tables');
    }
    
  } catch (error) {
    console.error('执行表检查时出错:', error);
  }
}

// 执行检查
checkTables(); 