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

async function checkAuthConfig() {
  console.log('检查Supabase认证配置...');
  
  try {
    // 检查是否可以匿名访问auth
    const { data: authSettings, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('获取认证会话失败:', authError.message);
      return;
    }
    
    console.log('\n认证状态:');
    
    if (authSettings && authSettings.session) {
      console.log('✅ 当前有活跃会话');
      console.log(`- 用户ID: ${authSettings.session.user.id}`);
      console.log(`- 邮箱: ${authSettings.session.user.email}`);
      console.log(`- 上次登录: ${new Date(authSettings.session.user.last_sign_in_at).toLocaleString()}`);
    } else {
      console.log('ℹ️ 当前无活跃会话（匿名状态）');
    }
    
    // 测试用户注册（不实际创建）
    console.log('\n测试认证端点:');
    
    // 检查电子邮件身份验证是否启用
    const fakeEmail = `test_${Date.now()}@example.com`;
    const { error: signUpError } = await supabase.auth.signUp({
      email: fakeEmail,
      password: 'Password123!',
    }, { redirectTo: null }); // 不执行重定向
    
    if (signUpError && signUpError.message.includes('disabled')) {
      console.log('❌ 电子邮件身份验证可能已禁用');
    } else if (signUpError) {
      console.log(`❓ 电子邮件注册测试错误: ${signUpError.message}`);
    } else {
      console.log('✅ 电子邮件身份验证已启用');
    }
    
    // 尝试获取OAuth配置信息
    console.log('\n可用的OAuth提供者:');
    
    // 由于无法直接获取OAuth配置，我们只能列出常见的提供者
    const providers = ['google', 'github', 'facebook', 'twitter'];
    
    for (const provider of providers) {
      // 尝试生成OAuth URL，如果配置了该提供者，应该会正常生成URL
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'http://localhost:3000/auth/callback',
          skipBrowserRedirect: true // 不真正执行重定向
        }
      });
      
      if (error) {
        console.log(`- ${provider}: ❌ 未配置或出错 (${error.message})`);
      } else if (data && data.url) {
        console.log(`- ${provider}: ✅ 已配置`);
      } else {
        console.log(`- ${provider}: ❓ 状态未知`);
      }
    }
    
    console.log('\n认证配置建议:');
    console.log('1. 确保在Supabase控制台中启用了电子邮件登录');
    console.log('2. 根据需要配置OAuth提供者（如Google登录）');
    console.log('3. 设置适当的重定向URL（例如: http://localhost:3000/auth/callback）');
    console.log('4. 在生产环境中，确保使用自定义域名作为重定向URL');
    
  } catch (error) {
    console.error('检查认证配置时出错:', error);
  }
}

// 执行检查
checkAuthConfig(); 