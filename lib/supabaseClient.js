import { createClient } from '@supabase/supabase-js'

// الروابط المباشرة لضمان التشغيل الفوري على الويب
const supabaseUrl = 'https://paoonvobclstwdmvefwt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhaW9vbnZvYmNsc3R3ZG12ZWZ3dCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE0MTY4NDUyLCJleHAiOjIwMjk3NDQ0NTJ9.8M-f67J1r9-4k9U1Y-oR7W7-R-z-x-z-x-z-x-z-x' 
// ملاحظة: المفتاح أعلاه هو مثال، تأكدي من نسخه كاملاً من ملف الـ .env الخاص بكِ

export const supabase = createClient(supabaseUrl, supabaseAnonKey)