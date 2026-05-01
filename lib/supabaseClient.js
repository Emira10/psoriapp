import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// الإعدادات الجديدة الخاصة بمشروعك المشترك
const supabaseUrl = 'https://ohnfupxbomdwrgajobbp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obmZ1cHhib21kd3JnYWpvYmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTU3MDgsImV4cCI6MjA5MjY3MTcwOH0.hL5QqUhsfJCDZ4LNHfFwpjU25LP82UqW1b9cr_M9tks';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// دالة device_id بتبقى كما هي لأنها معتمدة على ذاكرة الجهاز
export const getDeviceId = async () => {
  try {
    let id = await AsyncStorage.getItem('device_id');
    if (!id) {
      id = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      await AsyncStorage.setItem('device_id', id);
    }
    return id;
  } catch {
    return 'default_device';
  }
};