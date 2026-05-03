import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useThemeCustom } from '../../context/ThemeContext';//dark
import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Body from 'react-native-body-highlighter';

import {
  Activity,
  AlertCircle,
  BarChart2,
  BarChart3,
  CalendarDays,
  Camera,
  ClipboardList,
  Home,
  Image as ImageIcon,
  Minus,
  Pill,
  PlusSquare,
  Save,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
} from 'lucide-react-native';

const STORAGE_KEY = 'symptom_records_v1';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ohnfupxbomdwrgajobbp.supabase.co';
const supabaseAnonKey ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obmZ1cHhib21kd3JnYWpvYmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTU3MDgsImV4cCI6MjA5MjY3MTcwOH0.hL5QqUhsfJCDZ4LNHfFwpjU25LP82UqW1b9cr_M9tks';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const API_BASE_URL = 'http://YOUR_IP:5000/api';

const getDeviceId = async () => {
  try {
    let id = await AsyncStorage.getItem('device_id');

    if (!id) {
      id =
        'device_' +
        Math.random().toString(36).substring(2, 11) +
        '_' +
        Date.now();

      await AsyncStorage.setItem('device_id', id);
    }

    return id;
  } catch (error) {
    console.log('DEVICE ID ERROR:', error);
    return 'device_default';
  }
};

export default function SymptomsScreen() {
  const router = useRouter();
  const { isDark } = useThemeCustom();

  
  const [analysisRange, setAnalysisRange] = useState('30');
  const [activeTab, setActiveTab] = useState('form');

  const [selectedParts, setSelectedParts] = useState([]);
  const [painLevel, setPainLevel] = useState(0);
  const [itchLevel, setItchLevel] = useState(0);
  const [weather, setWeather] = useState('Yükleniyor...');
  const [bodyView, setBodyView] = useState('front');
  const [selectedImage, setSelectedImage] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [selectedMoods, setSelectedMoods] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [savedSymptoms, setSavedSymptoms] = useState([]);

  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const [showFilterStartPicker, setShowFilterStartPicker] = useState(false);
  const [showFilterEndPicker, setShowFilterEndPicker] = useState(false);
  const [filteredSymptoms, setFilteredSymptoms] = useState([]);
  const [filterStartText, setFilterStartText] = useState('');
  const [filterEndText, setFilterEndText] = useState('');
  const [note, setNote] = useState('');
  const [userGender, setUserGender] = useState('female');

  

  const moodOptions = [
    'Mutluluk',
    'Üzüntü',
    'Stres',
    'Kaygı',
    'Huzur',
    'Öfke',
    'Yorgunluk',
  ];

const loadUserGender = async () => {
  try {
    const storedGender = await AsyncStorage.getItem('user_gender');

    if (storedGender === 'female' || storedGender === 'male') {
      setUserGender(storedGender);
    }
  } catch (error) {
    console.log(error);
  }
};

  useEffect(() => {
    loadSavedSymptoms();
    loadUserGender();
  }, []);

  useEffect(() => {
    setFilteredSymptoms(savedSymptoms);
  }, [savedSymptoms]);

  const togglePart = (slug, side = null) => {
  setSelectedParts((prev) => {
    const exists = prev.some(
      (item) => item.slug === slug && (item.side || null) === (side || null)
    );

    if (exists) {
      return prev.filter(
        (item) => !(item.slug === slug && (item.side || null) === (side || null))
      );
    }

    return [...prev, side ? { slug, side } : { slug }];
  });
};


  const toggleMood = (mood) => {
    if (selectedMoods.includes(mood)) {
      setSelectedMoods(selectedMoods.filter((m) => m !== mood));
    } else {
      setSelectedMoods([...selectedMoods, mood]);
    }
  };

  

  const getPartLabel = (part) => {
  const labels = {
    head: 'Baş',
    neck: 'Boyun',
    chest: 'Göğüs',
    abs: 'Karın',
    obliques: 'Yan Karın',
    deltoids: 'Omuz',
    biceps: 'Kol Üst',
    triceps: 'Arka Kol',
    forearm: 'Ön Kol',
    hands: 'El',
    quadriceps: 'Üst Bacak',
    knees: 'Diz',
    calves: 'Baldır',
    feet: 'Ayak',
    'upper-back': 'Üst Sırt',
    'lower-back': 'Alt Sırt',
    gluteal: 'Kalça',
    hamstring: 'Arka Üst Bacak',
    trapezius: 'Ense / Omuz Üstü',
    hair: 'Saç',
  };

  const slug = typeof part === 'string' ? part : part.slug;
  const side = typeof part === 'string' ? null : part.side;

  const baseLabel = labels[slug] || slug;

  if (side === 'left') return `Sol ${baseLabel}`;
  if (side === 'right') return `Sağ ${baseLabel}`;

  return baseLabel;
};

  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('İzin Gerekli', 'Galeriden fotoğraf seçmek için izin vermelisiniz.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Hata', 'Galeriden fotoğraf seçilemedi.');
    }
  };

  const pickFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermelisiniz.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Hata', 'Kamera açılamadı.');
    }
  };
  const analyzeImageWithAI = async () => {
  if (!selectedImage) {
    Alert.alert('Hata', 'Önce fotoğraf seçmelisin');
    return;
  }

  try {
    setAiLoading(true);
    setAiResult(null);

    const formData = new FormData();
    formData.append('file', {
      uri: selectedImage,
      name: 'image.jpg',
      type: 'image/jpeg',
    });

    const res = await fetch('https://ai-backend-cm45.onrender.com/predict', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await res.json();
    setAiResult(data);

  } catch (e) {
    console.log(e);
    Alert.alert('Hata', 'AI analiz başarısız');
  } finally {
    setAiLoading(false);
  }
};

  const onChangeDate = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
    }
  };

  const onChangeFilterStartDate = (event, date) => {
  if (Platform.OS === 'android') {
    setShowFilterStartPicker(false);
  }

  if (date) {
    setFilterStartDate(date);
    setFilterStartText(formatDate(date));
  }
};

  const onChangeFilterEndDate = (event, date) => {
    if (Platform.OS === 'android') {
      setShowFilterEndPicker(false);
    }

    if (date) {
      setFilterEndDate(date);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Tarih Seç';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    return `${hour}:${minute}`;
  };

  const loadSavedSymptoms = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const deviceId = await getDeviceId();
    const id = user?.id || deviceId;

    const response = await fetch(`${API_BASE_URL}/symptoms/${id}`);

    const result = await response.json();

    if (!response.ok || !result.success) {
      Alert.alert('Hata', result.message || 'Kayıtlı semptomlar yüklenemedi.');
      return;
    }

    const mapped = (result.symptoms || []).map((item) => ({
      id: item.id,
      createdAt: item.created_at,
      selectedDate: item.selected_date,
      weather: item.weather,
      selectedParts: item.selected_parts || [],
      painLevel: item.pain_level || 0,
      itchLevel: item.itch_level || 0,
      selectedMoods: item.selected_moods || [],
      selectedImage: item.selected_image,
      aiResult: item.ai_result,
      note: item.note,
    }));

    setSavedSymptoms(mapped);
    setFilteredSymptoms(mapped);
  } catch (error) {
    console.log(error);
    Alert.alert('Hata', 'Kayıtlı semptomlar yüklenemedi.');
  }
};


  const saveSymptomsToStorage = async (records) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      setSavedSymptoms(records);
      setFilteredSymptoms(records);
    } catch (error) {
      console.log(error);
      Alert.alert('Hata', 'Semptomlar kaydedilemedi.');
    }
  };

  const resetForm = () => {
    setSelectedParts([]);
    setPainLevel(0);
    setItchLevel(0);
    setSelectedMoods([]);
    setSelectedImage(null);
    setSelectedDate(new Date());
    setBodyView('front');
    setNote('');
  };

  const handleSave = async () => {
  try {
    console.log("KAYDET BASILDI");
    const { data: { user } } = await supabase.auth.getUser();
    const deviceId = await getDeviceId();

    const response = await fetch(`${API_BASE_URL}/symptoms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kullanici_id: user?.id || null,
        cihaz_id: deviceId,
        selected_date: selectedDate.toISOString(),
        weather,
        selected_parts: selectedParts,
        pain_level: painLevel,
        itch_level: itchLevel,
        selected_moods: selectedMoods,
        selected_image: selectedImage,
        ai_result: aiResult,
        note,
      }),
    });

    const result = await response.json();
    console.log("KAYDET RESULT:", result);

    if (!response.ok || !result.success) {
      Alert.alert('Hata', result.message || 'Semptom kaydedilemedi.');
      return;
    }

    await loadSavedSymptoms();

    Alert.alert('Başarılı', 'Semptom kaydı kaydedildi.');
    resetForm();
    setActiveTab('records');
  } catch (error) {
    console.log(error);
    Alert.alert('Hata', 'Semptom kaydedilemedi.');
  }
};

const deleteSymptomRecord = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/symptoms/${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      Alert.alert('Hata', result.message || 'Kayıt silinemedi.');
      return;
    }

    await loadSavedSymptoms();
  } catch (error) {
    console.log(error);
    Alert.alert('Hata', 'Kayıt silinemedi.');
  }
};

const confirmDeleteRecord = (id) => {
  if (Platform.OS === 'web') {
    const ok = window.confirm('Bu semptom kaydını silmek istiyor musun?');
    if (ok) deleteSymptomRecord(id);
    return;
  }

  Alert.alert(
    'Kaydı Sil',
    'Bu semptom kaydını silmek istiyor musun?',
    [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteSymptomRecord(id) },
    ]
  );
};

const clearAllRecords = () => {
  if (Platform.OS === 'web') {
    const ok = window.confirm('Tüm kayıtlı semptomlar silinsin mi?');
    if (ok) saveSymptomsToStorage([]);
    return;
  }

  Alert.alert(
    'Tüm Kayıtları Sil',
    'Tüm kayıtlı semptomlar silinsin mi?',
    [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Tümünü Sil',
        style: 'destructive',
        onPress: async () => {
  const { data: { user } } = await supabase.auth.getUser();
  const deviceId = await getDeviceId();

  const id = user?.id || deviceId;

  await fetch(`${API_BASE_URL}/symptoms/all/${id}`, {
    method: 'DELETE',
  });

  await loadSavedSymptoms();
},
      },
    ]
  );
};

  const parseDateText = (text) => {
  if (!text) return null;

  const clean = text.trim();

  if (clean.includes('.')) {
    const [day, month, year] = clean.split('.');
    if (!day || !month || !year) return null;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  if (clean.includes('-')) {
    const [year, month, day] = clean.split('-');
    if (!day || !month || !year) return null;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return null;
};

const handleFilterStartText = (text) => {
  setFilterStartText(text);
  const parsed = parseDateText(text);
  if (parsed && !isNaN(parsed.getTime())) {
    setFilterStartDate(parsed);
  }
};

const handleFilterEndText = (text) => {
  setFilterEndText(text);
  const parsed = parseDateText(text);
  if (parsed && !isNaN(parsed.getTime())) {
    setFilterEndDate(parsed);
  }
};

  const applyDateFilter = () => {
    let filtered = [...savedSymptoms];

    if (filterStartDate) {
      const start = new Date(filterStartDate);
      start.setHours(0, 0, 0, 0);

      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.selectedDate);
        return itemDate >= start;
      });
    }

    if (filterEndDate) {
      const end = new Date(filterEndDate);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.selectedDate);
        return itemDate <= end;
      });
    }

    setFilteredSymptoms(filtered);
  };

  const clearDateFilter = () => {
  setFilterStartDate(null);
  setFilterEndDate(null);
  setFilterStartText('');
  setFilterEndText('');
  setFilteredSymptoms(savedSymptoms);
};

  const analysisData = useMemo(() => {
  if (savedSymptoms.length === 0) return null;

  const currentRange = Number(analysisRange) || 1;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - currentRange);
  cutoffDate.setHours(0, 0, 0, 0);

  const filtered = savedSymptoms.filter(
    (item) => new Date(item.selectedDate) >= cutoffDate
  );

  if (filtered.length === 0) return { empty: true };

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.selectedDate) - new Date(a.selectedDate)
  );

  const latest = sorted[0];
  const previous = sorted.length > 1 ? sorted[1] : null;

  const painChange = previous ? latest.painLevel - previous.painLevel : 0;
  const itchChange = previous ? latest.itchLevel - previous.itchLevel : 0;

  const avgPain = (
    sorted.reduce((acc, item) => acc + Number(item.painLevel || 0), 0) /
    sorted.length
  ).toFixed(1);

  const avgItch = (
    sorted.reduce((acc, item) => acc + Number(item.itchLevel || 0), 0) /
    sorted.length
  ).toFixed(1);

  const partCounts = {};

  sorted.forEach((record) => {
    record.selectedParts?.forEach((part) => {
      const key = `${part.slug}-${part.side || 'center'}`;
      partCounts[key] = (partCounts[key] || 0) + 1;
    });
  });

  const topParts = Object.entries(partCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => {
      const lastDashIndex = key.lastIndexOf('-');
      const slug = key.slice(0, lastDashIndex);
      const side = key.slice(lastDashIndex + 1);
      return getPartLabel({
        slug,
        side: side === 'center' ? null : side,
      });
    });

  const chartData = sorted.slice(0, 10).reverse();

  return {
    latest,
    previous,
    painChange,
    itchChange,
    avgPain,
    avgItch,
    topParts,
    chartData,
  };
}, [savedSymptoms, analysisRange]);

  

  const renderFormTab = () => {
    return (
      <>
        <View
  style={[
    styles.card,
    { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }
  ]}
>
          <Text style={styles.sectionTitle}>Fotoğraf Ekle</Text>

{selectedImage && (
  <>
    {/* 🔥 عرض الصورة */}
    <Image
      source={{ uri: selectedImage }}
      style={styles.aiPreviewImage}
    />

    {/* 🔥 كرت AI */}
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>AI Analiz</Text>


    <TouchableOpacity
      style={styles.aiButton}
      onPress={analyzeImageWithAI}
    >
      <Text style={styles.aiButtonText}>
        {aiLoading ? 'Analiz ediliyor...' : 'AI ile Analiz Et'}
      </Text>
    </TouchableOpacity>

    {aiResult && (
      <View style={styles.aiResultBox}>
        <Text style={styles.aiResultText}>
          Tahmin: {aiResult.prediction}
        </Text>
        <Text style={styles.aiResultText}>
          Güven: %{Math.round(aiResult.confidence * 100)}
        </Text>
      </View>
    )}
  </View>
  </>
)}


        

          <View style={styles.uploadButtonsRow}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickFromCamera}>
              <Camera size={18} color="#fff" />
              <Text style={styles.uploadButtonText}>Kamera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadButton} onPress={pickFromGallery}>
              <ImageIcon size={18} color="#fff" />
              <Text style={styles.uploadButtonText}>Galeri</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Vücut Bölgesi Seçimi</Text>
          

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                bodyView === 'front' && styles.toggleButtonActive,
              ]}
              onPress={() => setBodyView('front')}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  bodyView === 'front' && styles.toggleButtonTextActive,
                ]}
              >
                Ön Vücut
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                bodyView === 'back' && styles.toggleButtonActive,
              ]}
              onPress={() => setBodyView('back')}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  bodyView === 'back' && styles.toggleButtonTextActive,
                ]}
              >
                Arka Vücut
              </Text>
            </TouchableOpacity>
          </View>

         

         <View style={styles.bodyWrapper}>
  <Body
    side={bodyView}
    gender={userGender}
    scale={0.9}
    border="#D9C7CC"
    data={selectedParts.map((part) => ({
      slug: part.slug,
      intensity: painLevel > 7 ? 4 : painLevel > 4 ? 3 : 2,
      ...(part.side ? { side: part.side } : {}),
    }))}
    onBodyPartPress={(bodyPart, side) => togglePart(bodyPart.slug, side)}
    colors={['#FCE4EC', '#F8BBD0', '#F48FB1', '#8B2635']}
  />
</View>

<View style={styles.selectedBox}>
  <Text style={styles.selectedTitle}>Seçilen Bölgeler</Text>

  {selectedParts.length === 0 ? (
    <Text style={styles.emptyText}>Henüz vücut bölgesi seçilmedi.</Text>
  ) : (
    <View style={styles.tagsContainer}>
      {selectedParts.map((part, index) => (
  <View key={`${part.slug}-${part.side || 'center'}-${index}`} style={styles.tag}>
    <Text style={styles.tagText}>{getPartLabel(part)}</Text>
  </View>
      ))}
    </View>
  )}
</View>
<TouchableOpacity onPress={() => setSelectedParts([])}>
    <Text style={styles.clearSelectionText}>Seçimleri Temizle</Text>
  </TouchableOpacity>
</View>


        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Ağrı Şiddeti: {painLevel}</Text>
          <Slider
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={painLevel}
            onValueChange={setPainLevel}
            minimumTrackTintColor="#8B2635"
            maximumTrackTintColor="#E8DADF"
            thumbTintColor="#8B2635"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Kaşıntı Şiddeti: {itchLevel}</Text>
          <Slider
            minimumValue={0}
            maximumValue={10}
            step={1}
            value={itchLevel}
            onValueChange={setItchLevel}
            minimumTrackTintColor="#D94F70"
            maximumTrackTintColor="#E8DADF"
            thumbTintColor="#D94F70"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Duygu Durumu</Text>
          <Text style={styles.helperText}>
            Semptomlarla ilişkisini görmek için ruh halini seçebilirsin.
          </Text>

          <View style={styles.tagsContainer}>
            {moodOptions.map((mood) => {
              const isSelected = selectedMoods.includes(mood);
              return (
                <TouchableOpacity
                  key={mood}
                  style={[styles.moodTag, isSelected && styles.moodTagActive]}
                  onPress={() => toggleMood(mood)}
                >
                  <Text
                    style={[
                      styles.moodTagText,
                      isSelected && styles.moodTagTextActive,
                    ]}
                  >
                    {mood}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tarih Seçimi</Text>

          <View style={styles.dateButton}>
  <TouchableOpacity
    onPress={() => {
      if (Platform.OS !== 'web') {
        setShowDatePicker(true);
      }
    }}
  >
    <CalendarDays size={18} color="#8B2635" />
  </TouchableOpacity>

  <TextInput
    style={{ marginLeft: 10, flex: 1, color: '#8B2635' }}
    value={formatDate(selectedDate)}
    onChangeText={(text) => {
      const parts = text.split('.');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        const newDate = new Date(year, month - 1, day);
        if (!isNaN(newDate.getTime())) {
          setSelectedDate(newDate);
        }
      }
    }}
    placeholder="GG.AA.YYYY"
    placeholderTextColor="#b9a7ab"
  />
</View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeDate}
            />
          )}
        </View>

            <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Not Ekle</Text>
                <TextInput
                  placeholder="Bugün nasıl hissettin? Eklemek istediğin bir şey var mı?"
                   value={note}
                  onChangeText={setNote}
                  multiline
                 style={styles.noteInput}
                />
                </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Semptom Özeti</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tarih:</Text>
            <Text style={styles.summaryValue}>{formatDate(selectedDate)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Hava:</Text>
            <Text style={styles.summaryValue}>{weather}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ağrı:</Text>
            <Text style={styles.summaryValue}>{painLevel}/10</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Kaşıntı:</Text>
            <Text style={styles.summaryValue}>{itchLevel}/10</Text>
          </View>

          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Bölgeler:</Text>
            <Text style={styles.summaryMultiValue}>
              {selectedParts.length > 0
                ? selectedParts.map(getPartLabel).join(', ')
                : 'Seçilmedi'}
            </Text>
          </View>

          <View style={styles.summaryBlock}>
            <Text style={styles.summaryLabel}>Duygu Durumu:</Text>
            <Text style={styles.summaryMultiValue}>
              {selectedMoods.length > 0
                ? selectedMoods.join(', ')
                : 'Seçilmedi'}
            </Text>
          </View>
          <View style={styles.summaryBlock}>
    <Text style={styles.summaryLabel}>Not:</Text>
    <Text style={styles.summaryMultiValue}>
      {note ? note : 'Not eklenmedi'}
    </Text>
  </View>
          

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Save size={18} color="#fff" />
            <Text style={styles.saveButtonText}>Kaydet</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  const renderRecordsTab = () => {
    return (
      <>
        <View style={styles.card}>
  <Text style={styles.sectionTitle}>Tarihsel Filtreleme</Text>

  <View style={styles.filterRow}>

  {/* 🔵 Başlangıç */}
  <View style={styles.filterInputBox}>
  {Platform.OS === 'web' ? (
    <TextInput
      style={styles.filterTextInput}
      value={filterStartText}
      onChangeText={setFilterStartText}
      placeholder="Başlangıç"
      placeholderTextColor="#b9a7ab"
    />
  ) : (
    <>
      <TouchableOpacity
        style={styles.filterDateButton}
        onPress={() => setShowFilterStartPicker(true)}
      >
        <CalendarDays size={16} color="#8B2635" />
        <Text style={styles.filterDateText}>
          {filterStartText || 'Başlangıç'}
        </Text>
      </TouchableOpacity>

      {showFilterStartPicker && (
        <DateTimePicker
          value={filterStartText ? new Date(filterStartText) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowFilterStartPicker(false);
            if (selectedDate) {
              setFilterStartText(selectedDate.toISOString().split('T')[0]);
            }
          }}
        />
      )}
    </>
  )}
</View>

  {/* 🔵 Bitiş */}
  <View style={styles.filterInputBox}>
  {Platform.OS === 'web' ? (
    <TextInput
      style={styles.filterTextInput}
      value={filterEndText}
      onChangeText={setFilterEndText}
      placeholder="Bitiş"
      placeholderTextColor="#b9a7ab"
    />
  ) : (
    <>
      <TouchableOpacity
        style={styles.filterDateButton}
        onPress={() => setShowFilterEndPicker(true)}
      >
        <CalendarDays size={16} color="#8B2635" />
        <Text style={styles.filterDateText}>
          {filterEndText || 'Bitiş'}
        </Text>
      </TouchableOpacity>

      {showFilterEndPicker && (
        <DateTimePicker
          value={filterEndText ? new Date(filterEndText) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowFilterEndPicker(false);
            if (selectedDate) {
              setFilterEndText(selectedDate.toISOString().split('T')[0]);
            }
          }}
        />
      )}
    </>
  )}
</View>

</View>



  <View style={styles.filterActionRow}>
    <TouchableOpacity style={styles.filterButton} onPress={applyDateFilter}>
      <Text style={styles.filterButtonText}>Filtrele</Text>
    </TouchableOpacity>

    <TouchableOpacity style={styles.clearFilterButton} onPress={clearDateFilter}>
      <Text style={styles.clearFilterButtonText}>Temizle</Text>
    </TouchableOpacity>
  </View>

  {showFilterStartPicker && (
    <DateTimePicker
      value={filterStartDate || new Date()}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={onChangeFilterStartDate}
    />
  )}

  {showFilterEndPicker && (
    <DateTimePicker
      value={filterEndDate || new Date()}
      mode="date"
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={onChangeFilterEndDate}
    />
  )}
</View>

        <View
          style={[
            styles.card,
            { backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
          ]}
        >
          <View style={styles.savedHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: isDark ? '#FFF' : '#8B2635' },
              ]}
            >
              Kayıtlı Semptomlar
            </Text>

            {savedSymptoms.length > 0 && (
              <TouchableOpacity onPress={clearAllRecords}>
                <Text style={styles.clearAllText}>Tümünü Sil</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredSymptoms.length === 0 ? (
            <Text style={styles.emptyText}>Bu filtreye uygun kayıt bulunamadı.</Text>
          ) : (
            filteredSymptoms.map((item) => (
              <View key={item.id} style={styles.recordCard}>
                <View style={styles.recordTopRow}>
                  <View>
                    <Text style={styles.recordDate}>
                      {formatDate(item.selectedDate)} • {formatTime(item.createdAt)}
                    </Text>
                    <Text style={styles.recordWeather}>Hava: {item.weather}</Text>
                  </View>

                  <TouchableOpacity onPress={() => confirmDeleteRecord(item.id)}>
                    <Trash2 size={18} color="#B23A48" />
                  </TouchableOpacity>
                </View>

                <View style={styles.recordInfoBlock}>
                  <Text style={styles.recordLabel}>Bölgeler</Text>
                  <Text style={styles.recordValue}>
                    {item.selectedParts?.length > 0
                      ? item.selectedParts.map(getPartLabel).join(', ')
                      : 'Seçilmedi'}
                  </Text>
                </View>

                <View style={styles.recordRow}>
                  <Text style={styles.recordMini}>Ağrı: {item.painLevel}/10</Text>
                  <Text style={styles.recordMini}>Kaşıntı: {item.itchLevel}/10</Text>
                </View>

                <View style={styles.recordInfoBlock}>
                  <Text style={styles.recordLabel}>Duygu Durumu</Text>
                  <Text style={styles.recordValue}>
                    {item.selectedMoods?.length > 0
                      ? item.selectedMoods.join(', ')
                      : 'Seçilmedi'}
                  </Text>
                </View>

                <View style={styles.recordInfoBlock}>
                  <Text style={styles.recordLabel}>Not</Text>
                  <Text style={styles.recordValue}>
                    {item.note ? item.note : 'Not yok'}
                  </Text>
                </View>

                {/* كود الصورة الموجود عندك أصلاً */}
                {item.selectedImage ? (
                  <Image source={{ uri: item.selectedImage }} style={styles.recordImage} />
                ) : null}

                {/* إضافة كود الـ AI Result اللي طلبتيه في المكان الصح */}
                {item.aiResult && (
                  <View style={styles.aiRecordBox}>
                    <Text style={styles.recordValue}>
                      AI: {item.aiResult.prediction}
                    </Text>
                    <Text style={styles.recordValue}>
                      %{Math.round(item.aiResult.confidence * 100)}
                    </Text>
                  </View>
                )}

              </View> // إغلاق الـ recordCard (الكارت بالكامل)
            ))
          )}
        </View>
      </>
    );
  };

  const renderAnalysisTab = () => {
  const currentRange = Number(analysisRange) || 1;

  if (!analysisData) {
    return (
      <View style={styles.card}>
        <Text style={styles.emptyText}>
          Analiz için henüz kayıt yok. Önce semptom eklemelisin.
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Analiz Aralığı</Text>

        <View style={styles.analysisRangeRow}>
          <Text style={styles.analysisRangeText}>Son</Text>

          <TextInput
            style={styles.analysisRangeInput}
            value={analysisRange}
            onChangeText={(text) =>
              setAnalysisRange(text.replace(/[^0-9]/g, ''))
            }
            keyboardType="numeric"
            placeholder="30"
            placeholderTextColor="#b9a7ab"
          />

          <Text style={styles.analysisRangeText}>Gün</Text>
        </View>
      </View>

      {analysisData.empty ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>
            Seçili {currentRange} günlük aralıkta kayıt bulunamadı.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.analysisStatsGrid}>
            <View style={styles.analysisStatCard}>
              <Text style={styles.analysisStatLabel}>
                SON {currentRange} GÜN AĞRI
              </Text>
              <Text style={styles.analysisPainValue}>
                {analysisData.avgPain}
              </Text>
              <Text style={styles.analysisStatSub}>/ 10</Text>
            </View>

            <View style={styles.analysisStatCard}>
              <Text style={styles.analysisStatLabel}>
                SON {currentRange} GÜN KAŞINTI
              </Text>
              <Text style={styles.analysisItchValue}>
                {analysisData.avgItch}
              </Text>
              <Text style={styles.analysisStatSub}>/ 10</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Önceki Kayda Göre Değişim</Text>

            <View style={styles.changeBox}>
              <Text style={styles.changeText}>
                {analysisData.painChange > 0
                  ? `Ağrı önceki kayda göre arttı (+${analysisData.painChange})`
                  : analysisData.painChange < 0
                    ? `Ağrı önceki kayda göre azaldı (${analysisData.painChange})`
                    : 'Ağrı önceki kayda göre aynı kaldı'}
              </Text>

              {analysisData.painChange > 0 ? (
                <TrendingUp size={20} color="#ef4444" />
              ) : analysisData.painChange < 0 ? (
                <TrendingDown size={20} color="#22c55e" />
              ) : (
                <Minus size={20} color="#999" />
              )}
            </View>

            <View style={styles.changeBoxPink}>
              <Text style={styles.changeText}>
                {analysisData.itchChange > 0
                  ? `Kaşıntı önceki kayda göre arttı (+${analysisData.itchChange})`
                  : analysisData.itchChange < 0
                    ? `Kaşıntı önceki kayda göre azaldı (${analysisData.itchChange})`
                    : 'Kaşıntı önceki kayda göre aynı kaldı'}
              </Text>

              {analysisData.itchChange > 0 ? (
                <TrendingUp size={20} color="#ef4444" />
              ) : analysisData.itchChange < 0 ? (
                <TrendingDown size={20} color="#22c55e" />
              ) : (
                <Minus size={20} color="#999" />
              )}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.analysisTitleRow}>
              <BarChart2 size={18} color="#8B2635" />
              <Text style={styles.sectionTitle}>
                Trend Grafiği
              </Text>
            </View>

            <Text style={styles.helperText}>
              Son {analysisData.chartData.length} kayıt gösteriliyor.
            </Text>

            <View style={styles.chartContainer}>
              {analysisData.chartData.map((item) => (
                <View key={item.id} style={styles.chartItem}>
                  <View style={styles.chartBars}>
                    <View
                      style={[
                        styles.painBar,
                        { height: `${Math.max(item.painLevel * 10, 5)}%` },
                      ]}
                    />
                    <View
                      style={[
                        styles.itchBar,
                        { height: `${Math.max(item.itchLevel * 10, 5)}%` },
                      ]}
                    />
                  </View>

                  <Text style={styles.chartDate}>
                    {new Date(item.selectedDate).getDate()}/
                    {new Date(item.selectedDate).getMonth() + 1}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={styles.painLegend} />
                <Text style={styles.legendText}>Ağrı</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={styles.itchLegend} />
                <Text style={styles.legendText}>Kaşıntı</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.analysisTitleRow}>
              <AlertCircle size={18} color="#8B2635" />
              <Text style={styles.sectionTitle}>
                En Yoğun Şikayet Bölgeleri
              </Text>
            </View>

            <Text style={styles.helperText}>
              Son {currentRange} gün içinde en çok seçilen bölgeler:
            </Text>

            {analysisData.topParts.length === 0 ? (
              <Text style={styles.emptyText}>Bölge verisi bulunamadı.</Text>
            ) : (
              <View style={styles.tagsContainer}>
                {analysisData.topParts.map((part, index) => (
                  <View key={`${part}-${index}`} style={styles.analysisTag}>
                    <Text style={styles.analysisTagText}>{part}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </>
  );
};

  return (
    <View
  style={[
    styles.container,
    { backgroundColor: isDark ? '#121212' : '#FFF5F6' }
  ]}
>
      <ScrollView
  contentContainerStyle={{
    paddingBottom: 130,
    backgroundColor: isDark ? '#121212' : '#FFF5F6'
  }}
>
       

    
<View style={styles.topTabContainer}>
  <TouchableOpacity
    style={[
      styles.topTabCard,
      { backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
      activeTab === 'form' && styles.topTabCardActive,
    ]}
    onPress={() => setActiveTab('form')}
  >
    <PlusSquare
      size={20}
      color={activeTab === 'form' ? '#fff' : '#8B2635'}
    />
    <Text
      style={[
        styles.topTabCardText,
        activeTab === 'form' && styles.topTabCardTextActive,
      ]}
    >
      Ekle
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.topTabCard,
      { backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
      activeTab === 'records' && styles.topTabCardActive,
    ]}
    onPress={() => setActiveTab('records')}
  >
    <ClipboardList
      size={20}
      color={activeTab === 'records' ? '#fff' : '#8B2635'}
    />
    <Text
      style={[
        styles.topTabCardText,
        activeTab === 'records' && styles.topTabCardTextActive,
      ]}
    >
      Kayıtlı
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={[
      styles.topTabCard,
      { backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
      activeTab === 'analysis' && styles.topTabCardActive,
    ]}
    onPress={() => setActiveTab('analysis')}
  >
    <BarChart2
      size={20}
      color={activeTab === 'analysis' ? '#fff' : '#8B2635'}
    />
    <Text
      style={[
        styles.topTabCardText,
        activeTab === 'analysis' && styles.topTabCardTextActive,
      ]}
    >
      Analiz
    </Text>
  </TouchableOpacity>
</View>

        {activeTab === 'form' && renderFormTab()}
        {activeTab === 'records' && renderRecordsTab()}
        {activeTab === 'analysis' && renderAnalysisTab()}
      </ScrollView>

     <View
  style={[
    styles.bottomNav,
    {
      backgroundColor: isDark ? '#1E1E1E' : '#FFF',
      borderTopColor: isDark ? '#333' : '#f1e5e8',
    },
  ]}
>
  <TouchableOpacity onPress={() => router.push('/home')} style={styles.navItem}>
    <Home size={22} color="#b9a7ab" />
    <Text style={styles.navText}>Ana Sayfa</Text>
  </TouchableOpacity>

  <TouchableOpacity style={styles.navItem}>
    <Activity size={22} color="#8B2635" />
    <Text style={[styles.navText, { color: '#8B2635' }]}>
      Semptom Takibi
    </Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => router.push('/treatment')} style={styles.navItem}>
    <Pill size={22} color="#b9a7ab" />
    <Text style={styles.navText}>Tedaviler</Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => router.push('/fototerapi')} style={styles.navItem}>
    <BarChart3 size={22} color="#b9a7ab" />
    <Text style={styles.navText}>Fototerapi Takibi</Text>
  </TouchableOpacity>

  <TouchableOpacity onPress={() => router.push('/profile')} style={styles.navItem}>
    <User size={22} color="#b9a7ab" />
    <Text style={styles.navText}>Profil</Text>
  </TouchableOpacity>
</View>
</View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    backgroundColor: '#FFF5F6',
  },

  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B2635',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },

  topTabContainer: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: '#f8e8eb',
    borderRadius: 16,
    padding: 4,
  },

  topTabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },

  topTabButtonActive: {
    backgroundColor: '#8B2635',
  },

  topTabButtonText: {
    color: '#8B2635',
    fontWeight: '700',
    fontSize: 14,
  },

  topTabButtonTextActive: {
    color: '#fff',
  },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 18,
  },

  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#630e0e',
    marginBottom: 12,
  },

  helperText: {
    color: '#7d6b70',
    fontSize: 13,
    marginBottom: 10,
  },

  weatherText: {
    fontSize: 18,
    color: '#8B2635',
    fontWeight: '600',
  },

  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8f9',
    borderWidth: 1,
    borderColor: '#ebd4d9',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },

  dateButtonText: {
    marginLeft: 10,
    color: '#8B2635',
    fontSize: 15,
    fontWeight: '600',
  },

  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },

 filterDateButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#fff8f9',
  borderWidth: 1,
  borderColor: '#ebd4d9',
  borderRadius: 14,
  paddingVertical: 12,
  paddingHorizontal: 12,
  marginHorizontal: 5,
},


  filterDateText: {
    marginLeft: 8,
    color: '#8B2635',
    fontSize: 14,
    fontWeight: '600',
  },

  filterActionRow: {
    flexDirection: 'row',
  },

  filterButton: {
   flex: 1,
   backgroundColor: '#8B2635',
   borderRadius: 12,
   paddingVertical: 12,
   alignItems: 'center',
   marginRight: 5,
},

  filterButtonText: {
    color: '#fff',
    fontWeight: '700',
  },

  clearFilterButton: {
   flex: 1,
   backgroundColor: '#f8e8eb',
   borderRadius: 12,
   paddingVertical: 12,
   alignItems: 'center',
   borderWidth: 1,
   borderColor: '#ebd4d9',
   marginLeft: 5,
},

  clearFilterButtonText: {
    color: '#8B2635',
    fontWeight: '700',
  },

  uploadBox: {
    height: 180,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#d7b8bf',
    borderRadius: 16,
    backgroundColor: '#fff8f9',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  uploadPlaceholder: {
    color: '#9b7f86',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  previewImage: {
    width: '100%',
    height: '100%',
  },

  uploadButtonsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },

  uploadButton: {
   flex: 1,
   backgroundColor: '#bb6f6f',
   borderRadius: 12,
   paddingVertical: 12,
  flexDirection: 'row',
   justifyContent: 'center',
   alignItems: 'center',
   marginHorizontal: 5,
},

  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },

  analysisTitleRow: {
  flexDirection: 'row',
  alignItems: 'center',
},

legendRow: {
  flexDirection: 'row',
  justifyContent: 'center',
  marginTop: 12,
},

legendItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginHorizontal: 9,
},

  toggleRow: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f8e8eb',
    borderRadius: 14,
    padding: 4,
  },

  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },

  toggleButtonActive: {
    backgroundColor: '#8B2635',
  },

  toggleButtonText: {
    color: '#8B2635',
    fontWeight: '600',
  },

  toggleButtonTextActive: {
    color: '#fff',
  },

  selectedBox: {
    marginTop: 8,
    backgroundColor: '#fff8f9',
    borderRadius: 14,
    padding: 12,
  },

  selectedTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#8B2635',
    marginBottom: 10,
  },

  emptyText: {
    color: '#8a7a7f',
    fontSize: 14,
  },

  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  bodyWrapper: {
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 420,
  paddingVertical: 10,
},

  tag: {
    backgroundColor: '#8B2635',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },

  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  moodTag: {
    backgroundColor: '#f8e8eb',
    borderWidth: 1,
    borderColor: '#ead3d8',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },

  moodTagActive: {
    backgroundColor: '#8B2635',
    borderColor: '#8B2635',
  },

  moodTagText: {
    color: '#8B2635',
    fontSize: 13,
    fontWeight: '600',
  },

  moodTagTextActive: {
    color: '#fff',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  summaryBlock: {
    marginTop: 8,
    marginBottom: 4,
  },

  summaryLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5c4a4f',
    marginBottom: 4,
  },

  summaryValue: {
    fontSize: 14,
    color: '#222',
  },

  summaryMultiValue: {
    fontSize: 14,
    color: '#222',
    lineHeight: 20,
  },

  saveButton: {
    marginTop: 16,
    backgroundColor: '#8B2635',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },

  savedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  clearAllText: {
    color: '#B23A48',
    fontWeight: '700',
    fontSize: 13,
  },

  recordCard: {
    backgroundColor: '#fff8f9',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#f0dfe3',
  },

  recordTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  recordDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8B2635',
  },

  recordWeather: {
    fontSize: 13,
    color: '#6e5d62',
    marginTop: 4,
  },

  recordInfoBlock: {
    marginBottom: 8,
  },

  recordLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5c4a4f',
    marginBottom: 2,
  },

  recordValue: {
    fontSize: 13,
    color: '#333',
    lineHeight: 19,
  },

  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  recordMini: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },

  recordImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginTop: 8,
  },

  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1e5e8',
  },

  navItem: {
    flex: 1,
    alignItems: 'center',
  },

  navText: {
    fontSize: 10,
    marginTop: 4,
    color: '#b9a7ab',
  },
  noteInput: {
  backgroundColor: '#fff8f9',
  borderRadius: 12,
  padding: 12,
  minHeight: 80,
  textAlignVertical: 'top',
  borderWidth: 1,
  borderColor: '#ebd4d9',
  color: '#333',
},
clearSelectionText: {
  color: '#8B2635',
  fontWeight: '600',
  marginTop: 10,
  textAlign: 'center',
},
analysisRangeRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f8e8eb',
  borderRadius: 14,
  paddingVertical: 10,
  paddingHorizontal: 12,
},

analysisRangeText: {
  color: '#8B2635',
  fontSize: 14,
  fontWeight: '700',
},

analysisRangeInput: {
  width: 55,
  height: 40,
  backgroundColor: '#fff',
  borderRadius: 12,
  marginHorizontal: 10,
  textAlign: 'center',
  color: '#8B2635',
  fontSize: 18,
  fontWeight: '800',
},

analysisStatsGrid: {
  flexDirection: 'row',
  marginHorizontal: 12,
  marginTop: 12,
},

analysisStatCard: {
  flex: 1,
  backgroundColor: '#fff',
  borderRadius: 18,
  padding: 16,
  alignItems: 'center',
  marginHorizontal: 5,
},

analysisStatLabel: {
  fontSize: 10,
  fontWeight: '800',
  color: '#999',
  textAlign: 'center',
  marginBottom: 8,
},

analysisPainValue: {
  fontSize: 32,
  fontWeight: '900',
  color: '#8B2635',
},

analysisItchValue: {
  fontSize: 32,
  fontWeight: '900',
  color: '#D94F70',
},

analysisStatSub: {
  fontSize: 12,
  color: '#999',
},

changeBox: {
  backgroundColor: '#fff1f2',
  borderRadius: 14,
  padding: 12,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},

changeBoxPink: {
  backgroundColor: '#fdf2f8',
  borderRadius: 14,
  padding: 12,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

changeText: {
  flex: 1,
  color: '#555',
  fontSize: 13,
  fontWeight: '600',
  marginRight: 10,
},


chartContainer: {
  height: 170,
  flexDirection: 'row',
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  marginTop: 16,
},

chartItem: {
  flex: 1,
  alignItems: 'center',
},

chartBars: {
  height: 120,
  flexDirection: 'row',
  alignItems: 'flex-end',
  justifyContent: 'center',
},

painBar: {
  width: 8,
  backgroundColor: '#8B2635',
  borderTopLeftRadius: 5,
  borderTopRightRadius: 5,
  marginRight: 2,
},

itchBar: {
  width: 8,
  backgroundColor: '#D94F70',
  borderTopLeftRadius: 5,
  borderTopRightRadius: 5,
  marginLeft: 2,
},

chartDate: {
  fontSize: 10,
  color: '#999',
  marginTop: 8,
},



legendItem: {
  flexDirection: 'row',
  alignItems: 'center',
},

painLegend: {
  width: 12,
  height: 12,
  backgroundColor: '#8B2635',
  borderRadius: 3,
  marginRight: 6,
},

itchLegend: {
  width: 12,
  height: 12,
  backgroundColor: '#D94F70',
  borderRadius: 3,
  marginRight: 6,
},

legendText: {
  fontSize: 12,
  color: '#666',
  fontWeight: '600',
},

analysisTag: {
  backgroundColor: '#f8e8eb',
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 20,
  marginRight: 8,
  marginBottom: 8,
},

analysisTagText: {
  color: '#8B2635',
  fontSize: 13,
  fontWeight: '700',
},
topTabContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginHorizontal: 12,
  marginTop: 10,
  marginBottom: 10,
},

topTabCard: {
 flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginHorizontal: 4,
},

topTabCardActive: {
  backgroundColor: '#8B2635',
},

topTabCardText: {
  marginTop: 6,
  fontSize: 11,
  fontWeight: '700',
  color: '#8B2635',
},

topTabCardTextActive: {
  color: '#fff',
},
aiPreviewImage: {
  width: '100%',
  height: 180,
  borderRadius: 14,
  marginTop: 8,
},

aiButton: {
  marginTop: 14,
  backgroundColor: '#8B2635',
  borderRadius: 14,
  paddingVertical: 13,
  alignItems: 'center',
},

aiButtonText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: '800',
},

aiResultBox: {
  marginTop: 14,
  backgroundColor: '#fff8f9',
  borderRadius: 14,
  padding: 12,
  borderWidth: 1,
  borderColor: '#ebd4d9',
},

aiResultTitle: {
  color: '#8B2635',
  fontWeight: '800',
  fontSize: 15,
  marginBottom: 6,
},

aiResultText: {
  color: '#333',
  fontSize: 14,
  fontWeight: '600',
  marginBottom: 4,
},

aiWarningText: {
  color: '#8a7a7f',
  fontSize: 12,
  marginTop: 8,
  lineHeight: 18,
},

aiRecordBox: {
  marginTop: 10,
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 10,
  borderWidth: 1,
  borderColor: '#f0dfe3',
},
filterInputBox: {
  flex: 1,
  marginHorizontal: 5,
},

filterTextInput: {
  marginTop: 8,
  backgroundColor: '#fff8f9',
  borderWidth: 1,
  borderColor: '#ebd4d9',
  borderRadius: 12,
  paddingVertical: 10,
  paddingHorizontal: 12,
  color: '#8B2635',
  fontWeight: '600',
},
});