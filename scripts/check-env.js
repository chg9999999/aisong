require('dotenv').config({ path: '.env.local' });

// 检查关键环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('关键环境变量:');
console.log(`- NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '已设置' : '未设置'}`);
console.log(`- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '已设置' : '未设置'}`);
console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '已设置' : '未设置'}`);

if (serviceRoleKey === 'YOUR_SERVICE_ROLE_KEY') {
  console.log('警告: 请替换SUPABASE_SERVICE_ROLE_KEY为实际的服务角色密钥');
}

console.log('\n环境变量检查完成'); 