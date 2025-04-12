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

// 测试数据
const testData = {
  profiles: { id: '00000000-0000-0000-0000-000000000000' },
  music_tracks: { user_id: '00000000-0000-0000-0000-000000000000' },
  favorites: { user_id: '00000000-0000-0000-0000-000000000000' }
};

async function checkRLSStatus() {
  console.log('简单检查Supabase RLS状态...');
  
  const results = {};
  
  try {
    // 尝试通过匿名访问查询各表
    for (const table of tables) {
      console.log(`\n检查表 '${table}' 的访问控制:`);
      
      // 尝试SELECT操作
      console.log(`- 测试SELECT操作...`);
      const { data: selectData, error: selectError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (selectError && selectError.code === 'PGRST301') {
        // PGRST301错误通常表示RLS阻止了查询
        console.log(`  ✅ SELECT操作受到RLS保护`);
        results[`${table}_select`] = 'protected';
      } else if (selectError) {
        console.log(`  ❓ SELECT操作出错: ${selectError.message}`);
        results[`${table}_select`] = 'error';
      } else {
        console.log(`  ⚠️ SELECT操作允许匿名访问`);
        results[`${table}_select`] = 'public';
      }
      
      // 尝试INSERT操作
      console.log(`- 测试INSERT操作...`);
      
      // 准备测试数据
      let testInsertData = { ...testData[table] };
      if (table === 'profiles') {
        testInsertData = { ...testInsertData, username: 'test_user' };
      } else if (table === 'music_tracks') {
        testInsertData = { ...testInsertData, title: 'Test Track', audio_url: 'https://example.com/audio.mp3' };
      } else if (table === 'favorites') {
        testInsertData = { ...testInsertData, track_id: '00000000-0000-0000-0000-000000000000' };
      }
      
      const { error: insertError } = await supabase
        .from(table)
        .insert(testInsertData)
        .select();
      
      if (insertError && (insertError.code === 'PGRST301' || insertError.message.includes('permission'))) {
        console.log(`  ✅ INSERT操作受到RLS保护`);
        results[`${table}_insert`] = 'protected';
      } else if (insertError) {
        // 其他错误可能是外键约束等
        console.log(`  ❓ INSERT操作出错 (可能是RLS或其他限制): ${insertError.message}`);
        results[`${table}_insert`] = 'error';
      } else {
        console.log(`  ⚠️ INSERT操作允许匿名访问`);
        results[`${table}_insert`] = 'public';
      }
    }
    
    // 汇总报告
    console.log('\n=== RLS状态汇总 ===');
    let allProtected = true;
    
    for (const table of tables) {
      const selectStatus = results[`${table}_select`];
      const insertStatus = results[`${table}_insert`];
      
      console.log(`\n表 '${table}':`);
      console.log(`- SELECT: ${getStatusEmoji(selectStatus)} ${getStatusDescription(selectStatus)}`);
      console.log(`- INSERT: ${getStatusEmoji(insertStatus)} ${getStatusDescription(insertStatus)}`);
      
      if (selectStatus !== 'protected' || insertStatus !== 'protected') {
        allProtected = false;
      }
    }
    
    console.log('\n总体安全性评估:');
    if (allProtected) {
      console.log('✅ RLS安全保护已启用');
    } else {
      console.log('⚠️ RLS保护可能不完整，建议在Supabase控制台中检查和配置');
      console.log('链接: https://app.supabase.com/project/_/auth/policies');
      printRecommendedPolicies();
    }
    
  } catch (error) {
    console.error('检查RLS状态时出错:', error);
    console.log('\n请在Supabase控制台手动检查RLS状态。');
    console.log('链接: https://app.supabase.com/project/_/auth/policies');
    printRecommendedPolicies();
  }
}

// 获取状态表情符号
function getStatusEmoji(status) {
  switch (status) {
    case 'protected': return '✅';
    case 'public': return '⚠️';
    case 'error': return '❓';
    default: return '❓';
  }
}

// 获取状态描述
function getStatusDescription(status) {
  switch (status) {
    case 'protected': return '受RLS保护';
    case 'public': return '公开访问（无RLS限制）';
    case 'error': return '测试出错（可能有其他限制）';
    default: return '未知状态';
  }
}

// 打印推荐的RLS策略
function printRecommendedPolicies() {
  console.log('\n以下是推荐的RLS策略SQL:');
  
  console.log(`
-- profiles表安全策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any profile"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- music_tracks表安全策略
ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public tracks"
  ON music_tracks FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert own tracks"
  ON music_tracks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracks"
  ON music_tracks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracks"
  ON music_tracks FOR DELETE
  USING (auth.uid() = user_id);

-- favorites表安全策略
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);
`);
}

// 执行检查
checkRLSStatus(); 