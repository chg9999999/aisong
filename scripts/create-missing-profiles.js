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

// 为缺失的用户创建资料
async function createMissingProfiles() {
  console.log('开始检查缺失的用户资料...');
  
  try {
    // 1. 获取所有用户
    console.log('获取用户列表...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      throw usersError;
    }
    
    if (!users || users.users.length === 0) {
      console.log('没有找到任何用户。');
      return;
    }
    
    console.log(`找到 ${users.users.length} 个用户。`);
    
    // 2. 获取所有现有的profiles
    console.log('获取现有资料列表...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      throw profilesError;
    }
    
    const profileIds = profiles ? profiles.map(p => p.id) : [];
    console.log(`找到 ${profileIds.length} 个现有资料。`);
    
    // 3. 找出没有资料的用户
    const usersWithoutProfiles = users.users.filter(user => 
      !profileIds.includes(user.id)
    );
    
    console.log(`找到 ${usersWithoutProfiles.length} 个没有资料的用户。`);
    
    if (usersWithoutProfiles.length === 0) {
      console.log('所有用户都有对应的资料记录，无需创建。');
      return;
    }
    
    // 4. 为缺失的用户创建资料
    console.log('开始创建缺失的资料...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of usersWithoutProfiles) {
      const username = user.email ? user.email.split('@')[0] : `user_${user.id.substring(0, 8)}`;
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: username,
          email: user.email,
          avatar_url: user.user_metadata?.avatar_url || null,
          full_name: user.user_metadata?.full_name || null,
          last_login: user.last_sign_in_at
        });
      
      if (insertError) {
        console.error(`为用户 ${user.id} 创建资料失败:`, insertError.message);
        errorCount++;
      } else {
        console.log(`为用户 ${user.id} (${user.email || 'unknown'}) 创建了资料。`);
        successCount++;
      }
    }
    
    console.log('\n创建资料完成:');
    console.log(`- 成功: ${successCount}`);
    console.log(`- 失败: ${errorCount}`);
    
  } catch (error) {
    console.error('创建缺失资料时出错:', error);
  }
}

// 执行脚本
createMissingProfiles(); 