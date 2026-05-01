import { Tabs } from 'expo-router';
import React from 'react';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

// استيراد الـ Provider والـ Hook من ملفك
import { ThemeProviderCustom, useThemeCustom } from '../../context/ThemeContext'; 

export default function TabLayout() {
  return (
    // الخطوة 1: نغلف كل التبويبات بالمزود
    <ThemeProviderCustom>
      <TabsConfig />
    </ThemeProviderCustom>
  );
}

// الخطوة 2: مكون منفصل داخل نفس الملف ليتمكن من استخدام الـ Hook
function TabsConfig() {
  const { isDark } = useThemeCustom();
  const theme = isDark ? 'dark' : 'light';

  return (
    <Tabs
      screenOptions={{
        // نستخدم الثيم الخاص بنا هنا
        tabBarActiveTintColor: Colors[theme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: isDark ? '#121212' : '#FFFFFF',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
        }}
      />
      {/* تأكدي من إضافة صفحة الـ Profile والـ Fototerapi هنا لتظهر في الشريط السفلي */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="fototerapi"
        options={{
          title: 'Fototerapi',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="lightbulb.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}