import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput
} from 'react-native';

// --- إعدادات الباك آند (Supabase) ---
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ohnfupxbomdwrgajobbp.supabase.co'; // حذفنا rest/v1 لأن المكتبة تضيفها تلقائياً
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obmZ1cHhib21kd3JnYWpvYmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTU3MDgsImV4cCI6MjA5MjY3MTcwOH0.hL5QqUhsfJCDZ4LNHfFwpjU25LP82UqW1b9cr_M9tks';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// ----------------------------------

import { useThemeCustom } from '../../context/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

import {
  Activity,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Crown,
  Flame,
  Home,
  Lock,
  Moon,
  Pill,
  Settings,
  Trophy,
  User,
  Zap,
  Star,
  Award,
  Camera,
  CalendarCheck,
  TrendingUp,
  Ruler,
  Weight,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();

  const [view, setView] = useState('main');

  const theme = useThemeCustom?.();
  const isDark = theme?.isDark ?? false;
  const toggleTheme = theme?.toggleTheme ?? (() => {});
  const darkMode = isDark;

  const [showPermissions, setShowPermissions] = useState(false);
  const [showMissions, setShowMissions] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const [notifications, setNotifications] = useState(true);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  const [skinType, setSkinType] = useState('karma');
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('65');
  const [currentUserId, setCurrentUserId] = useState(null);

  const skinTypeToId = { kuru: 1, yagli: 2, karma: 3 };
  const idToSkinType = { 1: 'kuru', 2: 'yagli', 3: 'karma' };

  useEffect(() => {
    getCurrentUserAndLoadProfile();
  }, []);

  // ✅ الدالة المصلحة — تستخدم Supabase Auth مباشرة
  const getCurrentUserAndLoadProfile = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.log('AUTH ERROR:', error);
        Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      console.log('AUTH USER ID:', user.id);
      setCurrentUserId(user.id);
      await loadUserProfile(user.id);

    } catch (err) {
      console.log('GET USER CATCH:', err);
    }
  };

  const loadUserProfile = async (userId) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profil_kullanici')
        .select('*')
        .eq('kullanici_id', userId)
        .maybeSingle();

      if (error) {
        console.log('PROFIL LOAD ERROR:', error);
        return;
      }

      if (data) {
        setSkinType(idToSkinType[data.tip_id] || 'karma');
        setHeight(data.boy_cm ? String(data.boy_cm) : '170');
        setWeight(data.kilo_kg ? String(data.kilo_kg) : '65');
      }

    } catch (err) {
      console.log('PROFIL LOAD CATCH:', err);
    }
  };

  // ✅ الدالة المصلحة — تستخدم Supabase Auth مباشرة
  const saveUserProfile = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        Alert.alert('Hata', 'Kullanıcı oturumu bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      console.log('SAVING FOR USER:', user.id);

      const { data, error } = await supabase
        .from('profil_kullanici')
        .upsert(
          {
            kullanici_id: user.id,
            tip_id: skinTypeToId[skinType] || 3,
            boy_cm: Number(height),
            kilo_kg: Number(weight),
          },
          { onConflict: 'kullanici_id' }
        )
        .select();

      console.log('SAVE RESULT:', data, error);

      if (error) {
        Alert.alert('Hata', error.message);
        return;
      }

      Alert.alert('Başarılı', 'Profil bilgileri kaydedildi. 🎉');
      setView('main');

    } catch (err) {
      console.log('SAVE CATCH:', err);
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu.');
    }
  };

  const [currentPassword, setCurrentPassword] = useState('123456');
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({
    text: '',
    type: '',
  });

  // --- إضافة الباك آند (قاعدة البيانات) هنا ---

  // 1. حالة لتخزين الخطط والـ XP من قاعدة البيانات
  const [dbPlans, setDbPlans] = useState([]);
  const [userStats, setUserStats] = useState({ xp: 0, level: 1 });

// 1. Durum Tanımlamaları (States)
  const [xp, setXp] = useState(0); 
  const [completedMissionIds, setCompletedMissionIds] = useState([]);
  const [stats, setStats] = useState({
    loginStreak: 4,
    totalSymptomCount: 2,
    totalPhotoCount: 1,
    lastLoginDate: '2026-04-27',
    dailyLoginDone: true,
  });
  // -----------------------------------------------------------------
  // 1. TEK VE GERÇEK VERİ GETİRME FONKSİYONU
  // -----------------------------------------------------------------
  const fetchInitialData = async () => {
    try {
      // Giriş yapan kullanıcının ID'sini alıyoruz
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Profil tablosundan verileri çekiyoruz
        const { data: profile, error: profileError } = await supabase
          .from('profil_kullanici')
          .select('*')
          .eq('kullanici_id', user.id)
          .single();

        // Kullanıcılar tablosundan sadece AD bilgisini çekiyoruz
        const { data: userData } = await supabase
          .from('kullanicilar')
          .select('ad')
          .eq('kullanici_id', user.id)
          .single();

        if (profile) {
          // Veritabanında veri varsa onları set ediyoruz
          setXp(profile.toplam_puan || 0);
          setHeight(profile.boy_cm?.toString() || ''); // فارغ إذا المريض ما عبّاه
          setWeight(profile.kilo_kg?.toString() || ''); // فارغ إذا المريض ما عبّاه
          setSkinType(profile.tip_id || 'Belirtilmedi');
        }

        if (userData) {
          // İsim dinamik olarak geliyor (İmira, Selinay vb.)
          setUserName(userData.ad || 'Kullanıcı');
        }
      }
    } catch (error) {
      console.error("Veri çekme hatası:", error.message);
    }
  };

 // -----------------------------------------------------------------
  // 2. VERİ GÜNCELLEME (Kişisel Bilgileri Kaydetme)
  // -----------------------------------------------------------------
const handleSave = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      Alert.alert('Hata', 'Önce giriş yapmalısınız.');
      router.replace('/login');
      return;
    }

    const { error } = await supabase
      .from('profil_kullanici')
      .upsert(
        {
          kullanici_id: user.id,
          tip_id: skinTypeToId[skinType] || 3,
          boy_cm: Number(height) || null,
          kilo_kg: Number(weight) || null,
        },
        { onConflict: 'kullanici_id' }
      );

    if (error) {
      Alert.alert('Hata', error.message);
      return;
    }

    Alert.alert('Başarılı', 'Profil bilgileriniz kaydedildi.');
    setView('main');
  } catch (error) {
    Alert.alert('Hata', 'Bilgiler kaydedilemedi.');
    console.log('PROFILE SAVE ERROR:', error);
  }
};
  // 3. ABONELİK İŞLEMİ (Google Play Entegrasyonu)
  // -----------------------------------------------------------------
  const handleSubscription = async (planType) => {
    Alert.alert(
      "Abonelik Onayı",
      "Google Play üzerinden ödeme işlemini başlatmak istiyor musunuz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Evet, Onayla",
          onPress: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase.from('kullanici_premium').insert([
                { kullanici_id: user.id, plan_tipi: planType, durum: true }
              ]);
              setIsPremium(true);
              Alert.alert("Tebrikler!", "Premium üyeliğiniz başarıyla aktif edildi.");
            }
          } 
        }
      ]
    );
  };

  // 3. مزامنة الـ XP مع السيرفر عند حدوث تغيير
  const syncXpToBackend = async (newXp, newMissionIds) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({
        xp: newXp,
        completed_missions: newMissionIds
      }).eq('id', user.id);
    }
  };

  // ----------------------------------------

  const missionPool = [
    {
      id: 'streak_3',
      title: '3 Günlük Seri',
      xp: 50,
      type: 'streak',
      target: 3,
      dependsOn: null,
    },
    {
      id: 'streak_7',
      title: '7 Günlük Seri',
      xp: 150,
      type: 'streak',
      target: 7,
      dependsOn: 'streak_3',
    },
    {
      id: 'streak_30',
      title: '30 Günlük Efsane',
      xp: 1000,
      type: 'streak',
      target: 30,
      dependsOn: 'streak_7',
    },
    {
      id: 'photo_1',
      title: 'İlk Fotoğraf',
      xp: 40,
      type: 'photo',
      target: 1,
      dependsOn: null,
    },
    {
      id: 'photo_10',
      title: '10 Fotoğraf Arşivi',
      xp: 300,
      type: 'photo',
      target: 10,
      dependsOn: 'photo_1',
    },
    {
      id: 'symptom_5',
      title: '5 Semptom Girişi',
      xp: 100,
      type: 'symptom',
      target: 5,
      dependsOn: null,
    },
    {
      id: 'symptom_20',
      title: 'Düzenli Takipçi',
      xp: 400,
      type: 'symptom',
      target: 20,
      dependsOn: 'symptom_5',
    },
  ];

  const [activeMissions, setActiveMissions] = useState([]);
  const badges = [
    {
      id: 'first_login',
      title: 'Başlangıç',
      description: 'Uygulamayı kullanmaya başladı',
      icon: <Star size={18} color="#F59E0B" />,
      unlocked: true,
    },
    {
      id: 'streak_badge',
      title: 'Seri Takipçi',
      description: '3 gün üst üste giriş yaptı',
      icon: <Flame size={18} color="#F97316" />,
      unlocked: stats.loginStreak >= 3,
    },
    {
      id: 'photo_badge',
      title: 'Fotoğraf Takipçisi',
      description: 'İlk fotoğrafını ekledi',
      icon: <Camera size={18} color="#8B2635" />,
      unlocked: stats.totalPhotoCount >= 1,
    },
    {
      id: 'symptom_badge',
      title: 'Düzenli Gözlemci',
      description: '5 semptom kaydı hedefi',
      icon: <Award size={18} color="#2E7D32" />,
      unlocked: stats.totalSymptomCount >= 5,
    },
  ];

  useEffect(() => {
    const processed = missionPool.map((mission) => {
      let isCompleted = false;
      if (mission.type === 'streak' && stats.loginStreak >= mission.target) isCompleted = true;
      if (mission.type === 'photo' && stats.totalPhotoCount >= mission.target) isCompleted = true;
      if (mission.type === 'symptom' && stats.totalSymptomCount >= mission.target) isCompleted = true;

      return { ...mission, isCompleted };
    });

    const newCompletedIds = [...completedMissionIds];
    let xpGain = 0;

    processed.forEach((mission) => {
      if (mission.isCompleted && !newCompletedIds.includes(mission.id)) {
        newCompletedIds.push(mission.id);
        xpGain += isPremium ? Math.floor(mission.xp * 1.5) : mission.xp;
      }
    });

    if (xpGain > 0) {
      const finalXp = xp + xpGain;
      setXp(finalXp);
      setCompletedMissionIds(newCompletedIds);
      // حفظ في الباك آند فوراً
      syncXpToBackend(finalXp, newCompletedIds);
    }

    const visibleMissions = processed.filter((mission) => {
      const successorCompleted = processed.some(
        (next) => next.dependsOn === mission.id && next.isCompleted
      );
      if (successorCompleted) return false;
      if (!mission.dependsOn) return true;
      const parent = processed.find((item) => item.id === mission.dependsOn);
      return parent && parent.isCompleted;
    });

    setActiveMissions(visibleMissions);
  }, [stats, isPremium]);

  const getLevelInfo = (xpValue) => {
    if (xpValue < 100) return { level: 1, title: 'Yeni Başlayan', currentMin: 0, nextLevelXp: 100 };
    if (xpValue < 250) return { level: 2, title: 'Takibe Başladı', currentMin: 100, nextLevelXp: 250 };
    if (xpValue < 500) return { level: 3, title: 'Düzenli Takipçi', currentMin: 250, nextLevelXp: 500 };
    if (xpValue < 900) return { level: 4, title: 'Bilinçli Kullanıcı', currentMin: 500, nextLevelXp: 900 };
    if (xpValue < 1500) return { level: 5, title: 'Sağlık Takipçisi', currentMin: 900, nextLevelXp: 1500 };
    return { level: 6, title: 'Psoriapp Uzmanı', currentMin: 1500, nextLevelXp: 2500 };
  };

  const levelInfo = getLevelInfo(xp);
  const level = levelInfo.level;
  const levelTitle = levelInfo.title;

  const progressPercentage = Math.min(
    100,
    ((xp - levelInfo.currentMin) / (levelInfo.nextLevelXp - levelInfo.currentMin)) * 100
  );

  const handleNotificationPermission = () => {
    if (!notifications) {
      Alert.alert('Bildirim Açıldı', 'Artık semptom takibi و hatırlatmaları alabilirsin.');
    } else {
      Alert.alert('Bildirim Kapatıldı', 'Bildirim tercihlerin kapatıldı.');
    }
    setNotifications((prev) => !prev);
  };

  const handleCameraPermission = () => setCameraPermission((prev) => !prev);
  const handleLocationPermission = () => setLocationPermission((prev) => !prev);

  const handlePasswordChange = async () => {
  setPasswordMessage({ text: '', type: '' });

  if (newPasswordInput.length < 6) {
    setPasswordMessage({ text: 'Yeni şifre en az 6 karakter olmalı!', type: 'error' });
    return;
  }

  if (newPasswordInput !== confirmPasswordInput) {
    setPasswordMessage({ text: 'Yeni şifreler eşleşmiyor!', type: 'error' });
    return;
  }

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setPasswordMessage({ text: 'Önce giriş yapmalısınız.', type: 'error' });
      router.replace('/login');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPasswordInput,
    });

    if (error) {
      setPasswordMessage({ text: error.message, type: 'error' });
      return;
    }

    setOldPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordMessage({ text: 'Şifre başarıyla değiştirildi!', type: 'success' });

    setTimeout(() => {
      setPasswordMessage({ text: '', type: '' });
      setView('main');
    }, 1200);
  } catch (error) {
    setPasswordMessage({ text: 'Şifre değiştirilemedi.', type: 'error' });
    console.log('PASSWORD UPDATE ERROR:', error);
  }
};

  const handlePurchase = async () => {
    setIsPremium(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ is_premium: true }).eq('id', user.id);
    }
    Alert.alert('Başarılı', selectedPlan === 'monthly' ? 'Aylık premium aktif edildi.' : 'Yıllık premium aktif edildi.');
    setView('main');
  };

  const Option = ({ icon, label, onPress, rightComponent }) => (
    <TouchableOpacity
      style={[styles.option, { backgroundColor: darkMode ? '#1E1E1E' : '#FFF', borderColor: darkMode ? '#333' : '#EEE' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.optionLeft}>
        <View style={[styles.iconBox, { backgroundColor: darkMode ? '#444' : '#FAD2D8' }]}>{icon}</View>
        <Text style={[styles.optionLabel, { color: darkMode ? '#FFF' : '#8B2635' }]}>{label}</Text>
      </View>
      {rightComponent || <ChevronRight size={18} color={darkMode ? '#AAA' : '#CCC'} />}
    </TouchableOpacity>
  );

  const renderMainView = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}><Text style={styles.avatarText}>G</Text></View>
          {isPremium && <View style={styles.premiumBadge}><Crown size={14} color="#fff" /></View>}
          <View style={[styles.streakBadge, { backgroundColor: stats.loginStreak > 1 ? '#F97316' : '#999' }]}>
            <Flame size={13} color="#fff" /><Text style={styles.streakText}>{stats.loginStreak}</Text>
          </View>
        </View>
        <Text style={[styles.profileName, { color: darkMode ? '#FFF' : '#8B2635' }]}>Ganime</Text>
        <Text style={[styles.profileEmail, { color: darkMode ? '#AAA' : '#A05555' }]}>ganime@gmail.com</Text>
      </View>

      <TouchableOpacity activeOpacity={0.85} onPress={() => setView('levelDetail')} style={[styles.levelCard, { backgroundColor: darkMode ? '#1E1E1E' : '#FFF', borderColor: darkMode ? '#333' : '#FCE8EC' }]}>
        <View style={styles.levelTop}>
          <View style={styles.levelLeft}>
            <View style={styles.trophyBox}><Trophy size={18} color="#FFF" /></View>
            <View>
              <Text style={[styles.levelSmallText, { color: darkMode ? '#AAA' : '#A05555' }]}>GELİŞİM</Text>
              <Text style={[styles.levelText, { color: darkMode ? '#FFF' : '#8B2635' }]}>SEVİYE {level}</Text>
              <Text style={[styles.levelTitleText, { color: darkMode ? '#AAA' : '#A05555' }]}>{levelTitle}</Text>
            </View>
          </View>
          <View style={styles.xpBox}>
            <Text style={styles.xpLabel}>XP</Text>
            <Text style={[styles.xpText, { color: darkMode ? '#FFF' : '#8B2635' }]}>{xp}</Text>
          </View>
        </View>
        <View style={styles.progressBg}><View style={[styles.progressFill, { width: `${progressPercentage}%` }]} /></View>
        <Text style={[styles.nextLevelText, { color: darkMode ? '#AAA' : '#A05555' }]}>Sonraki seviyeye {levelInfo.nextLevelXp - xp} XP kaldı</Text>
      </TouchableOpacity>

      {/* القسم المعدل بالكامل: يرجى استبدال قسم premiumCard القديم بهذا */}
      <View style={[styles.premiumCard, { backgroundColor: isPremium ? '#1F2937' : '#F59E0B' }]}>
        <View style={styles.premiumCardTop}>
          <View>
            <Text style={styles.premiumTitle}>PREMIUM ÜYELİK</Text>
            <Text style={styles.premiumDesc}>{isPremium ? 'Tüm ayrıcalıklar aktif.' : 'Görevlerden %50 fazla XP kazan.'}</Text>
          </View>
          <Crown size={24} color="#FFF" />
        </View>

        {/* --- إضافة البيانات الشخصية داخل الكرت --- */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 15 }}>
        </View>
        {/* -------------------------------------- */}

        <TouchableOpacity style={styles.premiumButton} onPress={() => setView('subscription')}>
          <Text style={styles.premiumButtonText}>{isPremium ? 'Yönet' : 'Hemen Yükselt'}</Text>
        </TouchableOpacity>
      </View>
      {showMissions && activeMissions.map((mission) => (
        <View key={mission.id} style={[styles.missionCard, { backgroundColor: mission.isCompleted ? '#E8F5E9' : (darkMode ? '#1E1E1E' : '#FFF'), borderColor: mission.isCompleted ? '#BDE5C1' : (darkMode ? '#333' : '#FFF') }]}>
          <View style={styles.missionLeft}>
            <View style={[styles.missionIconBox, { backgroundColor: mission.isCompleted ? '#C8E6C9' : '#F1F1F1' }]}>
              {mission.isCompleted ? <CheckCircle2 size={18} color="#2E7D32" /> : <Circle size={18} color="#BBB" />}
            </View>
            <View>
              <Text style={[styles.missionName, { color: mission.isCompleted ? '#2E7D32' : (darkMode ? '#FFF' : '#8B2635') }]}>{mission.title}</Text>
              <Text style={styles.missionSubText}>+{isPremium ? Math.floor(mission.xp * 1.5) : mission.xp} XP | {mission.type === 'streak' ? `${stats.loginStreak}/${mission.target} Gün` : (mission.isCompleted ? 'Tamamlandı' : 'Sistem takipte')}</Text>
            </View>
          </View>
        </View>
      ))}

      <Option label="Kullanıcı Bilgilerim" icon={<User size={18} color={darkMode ? '#FFF' : '#8B2635'} />} onPress={() => setView('user')} />
      <Option label="Şifre Değiştir" icon={<Lock size={18} color={darkMode ? '#FFF' : '#8B2635'} />} onPress={() => setView('password')} />
      <Option label="Koyu Mod" icon={<Moon size={18} color={darkMode ? '#FFF' : '#8B2635'} />} rightComponent={<Switch value={darkMode} onValueChange={toggleTheme} thumbColor={darkMode ? '#8B2635' : '#f4f3f4'} trackColor={{ false: '#CCC', true: '#FAD2D8' }} />} />
      <Option label="İzinler" icon={<Settings size={18} color={darkMode ? '#FFF' : '#8B2635'} />} onPress={() => setShowPermissions((prev) => !prev)} rightComponent={showPermissions ? <ChevronDown size={18} color={darkMode ? '#AAA' : '#CCC'} /> : <ChevronRight size={18} color={darkMode ? '#AAA' : '#CCC'} />} />

      {showPermissions && (
        <View style={[styles.permissionBox, { backgroundColor: darkMode ? '#1E1E1E' : '#FFF', borderColor: darkMode ? '#333' : '#EEE' }]}>
          <View style={styles.permissionRow}><Text style={[styles.permissionLabel, { color: darkMode ? '#FFF' : '#8B2635' }]}>Bildirimler</Text><Switch value={notifications} onValueChange={handleNotificationPermission} thumbColor={notifications ? '#8B2635' : '#f4f3f4'} trackColor={{ false: '#CCC', true: '#FAD2D8' }} /></View>
          <View style={styles.permissionRow}><Text style={[styles.permissionLabel, { color: darkMode ? '#FFF' : '#8B2635' }]}>Kamera</Text><Switch value={cameraPermission} onValueChange={handleCameraPermission} thumbColor={cameraPermission ? '#8B2635' : '#f4f3f4'} trackColor={{ false: '#CCC', true: '#FAD2D8' }} /></View>
          <View style={styles.permissionRow}><Text style={[styles.permissionLabel, { color: darkMode ? '#FFF' : '#8B2635' }]}>Konum</Text><Switch value={locationPermission} onValueChange={handleLocationPermission} thumbColor={locationPermission ? '#8B2635' : '#f4f3f4'} trackColor={{ false: '#CCC', true: '#FAD2D8' }} /></View>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={async () => { await supabase.auth.signOut(); router.replace('/login'); }}>
        <Feather name="log-out" size={20} color="#8B2635" /><Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderUserView = () => (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity style={styles.backButton} onPress={() => setView('main')}>
        <Feather name="chevron-left" size={20} color="#8B2635" /><Text style={styles.backButtonText}>Geri Dön</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: darkMode ? '#FFF' : '#8B2635' }]}>Kullanıcı Bilgilerim</Text>
      <Text style={[styles.label, { color: darkMode ? '#FFF' : '#8B2635' }]}>Cilt Tipi</Text>
      <View style={[styles.pickerContainer, { backgroundColor: darkMode ? '#333' : '#FFF', borderColor: darkMode ? '#333' : '#EEE' }]}>
        <Picker selectedValue={skinType} onValueChange={setSkinType} style={{ color: darkMode ? '#FFF' : '#8B2635' }}>
          <Picker.Item label="Seçiniz" value="" /><Picker.Item label="Kuru" value="kuru" /><Picker.Item label="Yağlı" value="yagli" /><Picker.Item label="Karma" value="karma" />
        </Picker>
      </View>
      <Text style={[styles.label, { color: darkMode ? '#FFF' : '#8B2635' }]}>Boy (cm)</Text>
      <TextInput style={[styles.input, { backgroundColor: darkMode ? '#333' : '#FFF', color: darkMode ? '#FFF' : '#333', borderColor: darkMode ? '#333' : '#EEE' }]} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="Örn: 170" placeholderTextColor={darkMode ? '#AAA' : '#999'} />
      <Text style={[styles.label, { color: darkMode ? '#FFF' : '#8B2635' }]}>Kilo (kg)</Text>
      <TextInput style={[styles.input, { backgroundColor: darkMode ? '#333' : '#FFF', color: darkMode ? '#FFF' : '#333', borderColor: darkMode ? '#333' : '#EEE' }]} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="Örn: 65" placeholderTextColor={darkMode ? '#AAA' : '#999'} />
      
      {/* تم تغيير onPress لاستدعاء دالة الحفظ في السيرفر */}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Kaydet</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderPasswordView = () => (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity style={styles.backButton} onPress={() => setView('main')}>
        <Feather name="chevron-left" size={20} color="#8B2635" /><Text style={styles.backButtonText}>Geri Dön</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: darkMode ? '#FFF' : '#8B2635' }]}>Şifre Değiştir</Text>
      <View style={[styles.passwordCard, { backgroundColor: darkMode ? '#1E1E1E' : '#FFF', borderColor: darkMode ? '#333' : '#EEE' }]}>
        <TextInput placeholder="Mevcut Şifre" secureTextEntry style={[styles.input, { backgroundColor: darkMode ? '#333' : '#FFF5F6', color: darkMode ? '#FFF' : '#333', borderColor: darkMode ? '#333' : '#EEE' }]} value={oldPasswordInput} onChangeText={setOldPasswordInput} placeholderTextColor={darkMode ? '#AAA' : '#999'} />
        <TextInput placeholder="Yeni Şifre" secureTextEntry style={[styles.input, { backgroundColor: darkMode ? '#333' : '#FFF5F6', color: darkMode ? '#FFF' : '#333', borderColor: darkMode ? '#333' : '#EEE' }]} value={newPasswordInput} onChangeText={setNewPasswordInput} placeholderTextColor={darkMode ? '#AAA' : '#999'} />
        <TextInput placeholder="Yeni Şifre Tekrar" secureTextEntry style={[styles.input, { backgroundColor: darkMode ? '#333' : '#FFF5F6', color: darkMode ? '#FFF' : '#333', borderColor: darkMode ? '#333' : '#EEE' }]} value={confirmPasswordInput} onChangeText={setConfirmPasswordInput} placeholderTextColor={darkMode ? '#AAA' : '#999'} />
        {passwordMessage.text ? (
          <View style={[styles.messageBox, { backgroundColor: passwordMessage.type === 'success' ? '#E8F5E9' : '#FFEBEE' }]}>
            <Text style={{ color: passwordMessage.type === 'success' ? '#2E7D32' : '#C62828', fontWeight: 'bold', textAlign: 'center' }}>{passwordMessage.text}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={styles.button} onPress={handlePasswordChange}><Text style={styles.buttonText}>Şifreyi Güncelle</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderLevelDetailView = () => {
    const todayXp = 15;
    const levels = [
      { id: 1, title: 'Yeni Başlayan', xp: '0 - 99', status: level > 1 ? 'completed' : level === 1 ? 'current' : 'locked' },
      { id: 2, title: 'Takibe Başladı', xp: '100 - 249', status: level > 2 ? 'completed' : level === 2 ? 'current' : 'locked' },
      { id: 3, title: 'Düzenli Takipçi', xp: '250 - 499', status: level > 3 ? 'completed' : level === 3 ? 'current' : 'locked' },
      { id: 4, title: 'Bilinçli Kullanıcı', xp: '500 - 899', status: level > 4 ? 'completed' : level === 4 ? 'current' : 'locked' },
      { id: 5, title: 'Sağlık Takipçisi', xp: '900 - 1499', status: level > 5 ? 'completed' : level === 5 ? 'current' : 'locked' },
      { id: 6, title: 'Psoriapp Uzmanı', xp: '1500+', status: level === 6 ? 'current' : 'locked' },
    ];

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.levelDetailHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => setView('main')}><Feather name="chevron-left" size={20} color="#8B2635" /><Text style={styles.backButtonText}>Geri Dön</Text></TouchableOpacity>
          <View style={styles.levelSettingsButton}><Settings size={18} color="#AAA" /></View>
        </View>
        <Text style={[styles.title, { color: darkMode ? '#FFF' : '#8B2635' }]}>Seviye Bilgileri</Text>
        <View style={[styles.levelHeroCard, { backgroundColor: darkMode ? '#1E1E1E' : '#FFF', borderColor: darkMode ? '#333' : '#FAD2D8' }]}>
          <Trophy size={80} color={darkMode ? '#333' : '#FAD2D8'} style={styles.levelHeroBgIcon} />
          <Text style={styles.levelDetailSmallTitle}>Mevcut Seviye</Text>
          <View style={styles.levelHeroRow}><View style={styles.levelHeroIconBox}><Award size={24} color="#FFF" /></View><Text style={[styles.levelHeroTitle, { color: darkMode ? '#FFF' : '#8B2635' }]}>Seviye {level}</Text></View>
          <Text style={styles.levelHeroSubTitle}>{levelTitle}</Text>
        </View>
        <View style={[styles.levelXpCard, { backgroundColor: darkMode ? '#1E1E1E' : '#FFF', borderColor: darkMode ? '#333' : '#FAD2D8' }]}>
          <View style={styles.levelXpTop}><View><Text style={styles.levelDetailSmallTitle}>XP Durumu</Text><Text style={[styles.levelXpValue, { color: darkMode ? '#FFF' : '#8B2635' }]}>{xp} XP</Text></View><View style={styles.todayXpBadge}><TrendingUp size={14} color="#2E7D32" /><Text style={styles.todayXpText}>+{todayXp} Bugün</Text></View></View>
          <View style={styles.levelProgressBg}><View style={[styles.levelProgressFill, { width: `${progressPercentage}%` }]} /></View>
          <Text style={styles.levelRemainingText}>Sonraki seviyeye <Text style={styles.levelRemainingBold}>{levelInfo.nextLevelXp - xp} XP</Text> kaldı</Text>
        </View>
        <Text style={styles.levelMapTitle}>Seviye Haritası</Text>
        <View style={styles.levelMapContainer}>
          {levels.map((item, index) => (
            <View key={item.id} style={styles.levelMapRow}>
              {index !== levels.length - 1 && <View style={[styles.levelMapLine, { backgroundColor: item.status === 'completed' ? '#8B2635' : '#E5E7EB' }]} />}
              <View style={[styles.levelMapIcon, item.status === 'completed' && styles.levelMapIconCompleted, item.status === 'current' && styles.levelMapIconCurrent, item.status === 'locked' && styles.levelMapIconLocked]}>
                {item.status === 'completed' ? <CheckCircle2 size={20} color="#FFF" /> : item.status === 'current' ? <Award size={20} color="#8B2635" /> : <Lock size={18} color="#CCC" />}
              </View>
              <View style={[styles.levelMapCard, { backgroundColor: darkMode ? '#1E1E1E' : '#FFF', borderColor: item.status === 'current' ? '#8B2635' : (darkMode ? '#333' : '#F1F1F1') }, item.status === 'current' && styles.levelMapCardCurrent]}>
                <View><Text style={[styles.levelMapNumber, { color: item.status === 'locked' ? '#AAA' : '#8B2635' }]}>Seviye {item.id}</Text><Text style={[styles.levelMapName, { color: item.status === 'locked' ? '#AAA' : (darkMode ? '#FFF' : '#333') }]}>{item.title}</Text></View>
                <Text style={styles.levelMapXp}>{item.xp} XP</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  const handleCancelSubscription = async () => {
  Alert.alert(
    'Abonelik İptali',
    'Premium üyeliğinizi iptal etmek istediğinize emin misiniz?',
    [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Evet, İptal Et',
        style: 'destructive',
        onPress: () => {
          setIsPremium(false);
          Alert.alert('Bilgi', 'Aboneliğiniz iptal edildi.');
          setView('main');
        },
      },
    ]
  );
};

  const renderSubscriptionView = () => (
  <ScrollView contentContainerStyle={styles.scrollContent}>
    <TouchableOpacity style={styles.backButton} onPress={() => setView('main')}>
      <Feather name="chevron-left" size={20} color="#8B2635" />
      <Text style={styles.backButtonText}>Geri Dön</Text>
    </TouchableOpacity>

    <View style={[styles.subscriptionCard, { backgroundColor: darkMode ? '#1E1E1E' : '#FFF', borderColor: darkMode ? '#333' : '#EEE' }]}>
      <View style={styles.subscriptionIcon}>
        <Crown size={34} color="#F59E0B" />
      </View>
      
      <Text style={[styles.subscriptionTitle, { color: darkMode ? '#FFF' : '#8B2635' }]}>
        Premium Ayrıcalıkları
      </Text>

      <View style={styles.planContainer}>
        <TouchableOpacity 
          style={[styles.planCard, selectedPlan === 'monthly' && styles.selectedPlanCard]} 
          onPress={() => setSelectedPlan('monthly')}
        >
          <Text style={styles.planTitle}>Aylık</Text>
          <Text style={styles.planPrice}>19.90 TL</Text>
          {/* أضفت لك النص الفرعي ليعطي جمالية أكثر */}
          <Text style={{ fontSize: 10, color: '#AAA' }}>Her ay yenilenir</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.planCard, selectedPlan === 'yearly' && styles.selectedPlanCard]} 
          onPress={() => setSelectedPlan('yearly')}
        >
          <Text style={styles.planTitle}>Yıllık</Text>
          <Text style={styles.planPrice}>189.90 TL</Text>
          <Text style={{ fontSize: 10, color: '#AAA' }}>Yılda bir yenilenir</Text>
        </TouchableOpacity>
      </View>

      {/* --- قسم المميزات اللي كان ناقص بالصور وضفناه هلق --- */}
      <View style={{ marginVertical: 20, width: '100%', paddingHorizontal: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <CheckCircle2 size={18} color="#8B2635" />
          <Text style={{ marginLeft: 10, color: darkMode ? '#CCC' : '#555' }}>%50 Fazla XP Bonusu</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <CheckCircle2 size={18} color="#8B2635" />
          <Text style={{ marginLeft: 10, color: darkMode ? '#CCC' : '#555' }}>Sınırsız Fotoğraf Arşivi</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <CheckCircle2 size={18} color="#8B2635" />
          <Text style={{ marginLeft: 10, color: darkMode ? '#CCC' : '#555' }}>Reklamsız Deneyim</Text>
        </View>
      </View>
      {/* -------------------------------------------------- */}
      

      {/* الأزرار تظهر حسب حالة الاشتراك كما في الصور */}
      {isPremium ? (
        <View style={{ width: '100%', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#E8F5E9', padding: 12, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ color: '#2E7D32', fontWeight: 'bold' }}>Premium üyeliğin aktif</Text>
          </View>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#FCE8EC', borderWidth: 1, borderColor: '#F8D7DA' }]} 
            onPress={handleCancelSubscription}
          >
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={handlePurchase}>
          <Text style={styles.buttonText}>Abone Ol</Text>
        </TouchableOpacity>
      )}
    </View>
  </ScrollView>
);
      
  return (
    <View style={[styles.container, { backgroundColor: darkMode ? '#121212' : '#FDF2F4' }]}>
      {view === 'main' && renderMainView()}
      {view === 'user' && renderUserView()}
      {view === 'password' && renderPasswordView()}
      {view === 'levelDetail' && renderLevelDetailView()}
      {view === 'subscription' && renderSubscriptionView()}
    </View>
  );
}

// --- Styles (كما هي بدون أي تغيير) ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  profileHeader: { alignItems: 'center', marginBottom: 25, marginTop: 10 },
  avatarWrapper: { position: 'relative', marginBottom: 15 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#8B2635', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  avatarText: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  premiumBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#F59E0B', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  streakBadge: { position: 'absolute', bottom: -5, right: -5, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 2, borderColor: '#FFF' },
  streakText: { color: '#FFF', fontSize: 12, fontWeight: 'bold', marginLeft: 3 },
  profileName: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  profileEmail: { fontSize: 14 },
  levelCard: { padding: 18, borderRadius: 20, borderWidth: 1, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  levelTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  levelLeft: { flexDirection: 'row', alignItems: 'center' },
  trophyBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#8B2635', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  levelSmallText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 },
  levelText: { fontSize: 18, fontWeight: 'bold' },
  levelTitleText: { fontSize: 13, marginTop: 1 },
  xpBox: { alignItems: 'flex-end' },
  xpLabel: { fontSize: 10, color: '#A05555', fontWeight: 'bold', marginBottom: 2 },
  xpText: { fontSize: 18, fontWeight: 'bold' },
  progressBg: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#8B2635' },
  nextLevelText: { fontSize: 11, textAlign: 'center' },
  premiumCard: { padding: 20, borderRadius: 20, marginBottom: 25, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  premiumCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  premiumTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  premiumDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 4 },
  premiumButton: { backgroundColor: '#FFF', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  premiumButtonText: { color: '#1F2937', fontWeight: 'bold', fontSize: 14 },
  missionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingHorizontal: 5 },
  missionTitleLeft: { flexDirection: 'row', alignItems: 'center' },
  missionTitle: { fontSize: 17, fontWeight: 'bold', marginLeft: 8 },
  missionToggle: { flexDirection: 'row', alignItems: 'center' },
  missionToggleText: { fontSize: 13, color: '#A05555', marginRight: 4 },
  missionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 18, marginBottom: 10, borderWidth: 1 },
  missionLeft: { flexDirection: 'row', alignItems: 'center' },
  missionIconBox: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  missionName: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  missionSubText: { fontSize: 12, color: '#666' },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 18, marginBottom: 12, borderWidth: 1 },
  optionLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  optionLabel: { fontSize: 15, fontWeight: '600' },
  permissionBox: { padding: 10, borderRadius: 18, marginBottom: 15, borderWidth: 1, marginTop: -5 },
  permissionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 10 },
  permissionLabel: { fontSize: 14, fontWeight: '500' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, marginTop: 10, marginBottom: 20 },
  logoutText: { color: '#8B2635', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  backButtonText: { color: '#8B2635', fontSize: 16, fontWeight: '600', marginLeft: 5 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 25 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  input: { height: 55, borderRadius: 15, paddingHorizontal: 18, fontSize: 16, marginBottom: 20, borderWidth: 1 },
  pickerContainer: { height: 55, borderRadius: 15, marginBottom: 20, borderWidth: 1, justifyContent: 'center', overflow: 'hidden' },
  button: { backgroundColor: '#8B2635', height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  buttonText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
  passwordCard: { padding: 20, borderRadius: 20, borderWidth: 1 },
  messageBox: { padding: 12, borderRadius: 12, marginBottom: 20 },
  levelDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  levelSettingsButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  levelHeroCard: { padding: 25, borderRadius: 24, borderWidth: 1, marginBottom: 20, position: 'relative', overflow: 'hidden', alignItems: 'center' },
  levelHeroBgIcon: { position: 'absolute', right: -20, bottom: -20, opacity: 0.5 },
  levelDetailSmallTitle: { fontSize: 12, color: '#A05555', fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  levelHeroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  levelHeroIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#8B2635', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  levelHeroTitle: { fontSize: 28, fontWeight: 'bold' },
  levelHeroSubTitle: { fontSize: 16, color: '#A05555', fontWeight: '500' },
  levelXpCard: { padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 25 },
  levelXpTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  levelXpValue: { fontSize: 24, fontWeight: 'bold' },
  todayXpBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  todayXpText: { color: '#2E7D32', fontSize: 12, fontWeight: 'bold', marginLeft: 5 },
  levelProgressBg: { height: 12, backgroundColor: '#F0F0F0', borderRadius: 6, overflow: 'hidden', marginBottom: 12 },
  levelProgressFill: { height: '100%', backgroundColor: '#8B2635' },
  levelRemainingText: { fontSize: 13, color: '#666', textAlign: 'center' },
  levelRemainingBold: { fontWeight: 'bold', color: '#8B2635' },
  levelMapTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, color: '#8B2635' },
  levelMapContainer: { paddingLeft: 10 },
  levelMapRow: { flexDirection: 'row', marginBottom: 0, alignItems: 'flex-start' },
  levelMapLine: { position: 'absolute', left: 20, top: 40, width: 2, height: 60, zIndex: -1 },
  levelMapIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF', zIndex: 1, elevation: 2 },
  levelMapIconCompleted: { backgroundColor: '#8B2635' },
  levelMapIconCurrent: { backgroundColor: '#FFF', borderColor: '#8B2635' },
  levelMapIconLocked: { backgroundColor: '#F5F5F5', borderColor: '#E5E7EB' },
  levelMapCard: { flex: 1, marginLeft: 15, padding: 15, borderRadius: 18, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  levelMapCardCurrent: { elevation: 3, shadowColor: '#8B2635', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  levelMapNumber: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  levelMapName: { fontSize: 15, fontWeight: 'bold' },
  levelMapXp: { fontSize: 12, color: '#A05555', fontWeight: '600' },
  subscriptionCard: { padding: 25, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
  subscriptionIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF9EB', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  subscriptionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 25 },
  planContainer: { width: '100%', marginBottom: 25 },
  planCard: { width: '100%', padding: 20, borderRadius: 18, borderWidth: 2, borderColor: '#EEE', marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedPlanCard: { borderColor: '#8B2635', backgroundColor: '#FFF5F6' },
  planTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  planPrice: { fontSize: 18, fontWeight: 'bold', color: '#8B2635' },
});