import React, { useEffect, useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import Body from 'react-native-body-highlighter';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://paoonvobclstwdmvefwt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhaW9vbnZvYmNsc3R3ZG12ZWZ3dCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE0MTY4NDUyLCJleHAiOjIwMjk3NDQ0NTJ9.8M-f67J1r9-4k9U1Y-oR7W7-R-z-x-z-x-z-x-z-x'; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

import {
  Activity,
  BarChart3,
  CalendarDays,
  Camera,
  Home,
  Image as ImageIcon,
  Pill,
  Save,
  Trash2,
  User,
} from 'lucide-react-native';

export default function SymptomsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('form');
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedParts, setSelectedParts] = useState([]);
  const [painLevel, setPainLevel] = useState(0);
  const [itchLevel, setItchLevel] = useState(0);
  const [weather, setWeather] = useState('Yükleniyor...');
  const [bodyView, setBodyView] = useState('front');
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState('');
  const [userGender, setUserGender] = useState('female');

  // Records State
  const [savedSymptoms, setSavedSymptoms] = useState([]);
  const [filteredSymptoms, setFilteredSymptoms] = useState([]);

  const moodOptions = ['Mutluluk', 'Üzüntü', 'Stres', 'Kaygı', 'Huzur', 'Öfke', 'Yorgunluk'];

  useEffect(() => {
    fetchWeather();
    loadUserContext();
    fetchSymptoms();
  }, []);

  const loadUserContext = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('gender').eq('id', user.id).single();
      if (data?.gender) setUserGender(data.gender);
    }
  };

  const fetchSymptoms = async () => {
    setLoading(true);
    try {
      // 1. جلب بيانات المستخدم
      const { data: { user } } = await supabase.auth.getUser();

      // 2. الحارس: إذا لم يوجد مستخدم، توقف عن التنفيذ ولا تنهار
      if (!user) {
        console.log("Oturum açmış kullanıcı bulunamadı.");
        setLoading(false);
        return;
      }

      // 3. الآن الكود آمن لاستخدام user.id
      const { data, error } = await supabase
        .from('symptom_records')
        .select('*')
        .eq('user_id', user.id)
        .order('selected_date', { ascending: false });

      if (!error) {
        setSavedSymptoms(data);
        setFilteredSymptoms(data);
      }
    } catch (err) {
      console.error("Semptomlar yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedParts.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir vücut bölgesi seçin.');
      return;
    }
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // الحماية التي تمنع الخطأ الأحمر
      if (!user) {
        Alert.alert('Hata', 'Lütfen önce giriş yapın.');
        setLoading(false);
        return;
      }

      const newRecord = {
        user_id: user.id,
        selected_date: selectedDate.toISOString(),
        weather,
        selected_parts: selectedParts,
        pain_level: painLevel,
        itch_level: itchLevel,
        selected_moods: selectedMoods,
        selected_image: selectedImage,
        note,
      };

      const { error } = await supabase.from('symptom_records').insert([newRecord]);
      if (error) throw error;

      Alert.alert('Başarılı', 'Semptom kaydı kaydedildi.');
      resetForm();
      fetchSymptoms();
      setActiveTab('records');
    } catch (error) {
      Alert.alert('Hata', 'Kaydedilirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const deleteSymptomRecord = async (id) => {
    const { error } = await supabase.from('symptom_records').delete().eq('id', id);
    if (!error) fetchSymptoms();
  };

  const resetForm = () => {
    setSelectedParts([]);
    setPainLevel(0);
    setItchLevel(0);
    setSelectedMoods([]);
    setSelectedImage(null);
    setNote('');
    setSelectedDate(new Date());
  };

  const fetchWeather = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setWeather('Konum izni yok'); return; }
      const location = await Location.getCurrentPositionAsync({});
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&current=weather_code`);
      const data = await res.json();
      const code = data?.current?.weather_code;
      const weatherTexts = { 0: 'Güneşli', 1: 'Bulutlu', 2: 'Bulutlu', 3: 'Bulutlu', 45: 'Sisli', 61: 'Yağmurlu' };
      setWeather(weatherTexts[code] || 'Açık');
    } catch (e) { setWeather('Bilinmiyor'); }
  };

  const togglePart = (slug, side = null) => {
    setSelectedParts((prev) => {
      const exists = prev.some((item) => item.slug === slug && (item.side || null) === (side || null));
      if (exists) return prev.filter((item) => !(item.slug === slug && (item.side || null) === (side || null)));
      return [...prev, side ? { slug, side } : { slug }];
    });
  };

  const getPartLabel = (part) => {
    const labels = { head: 'Baş', neck: 'Boyun', chest: 'Göğüs', abs: 'Karın', hands: 'El', legs: 'Bacak' };
    const baseLabel = labels[part.slug] || part.slug;
    return part.side ? `${part.side === 'left' ? 'Sol' : 'Sağ'} ${baseLabel}` : baseLabel;
  };

  const renderFormTab = () => (
    <View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Vücut Bölgesi Seçimi</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity style={[styles.toggleButton, bodyView === 'front' && styles.toggleButtonActive]} onPress={() => setBodyView('front')}>
            <Text style={[styles.toggleButtonText, bodyView === 'front' && styles.toggleButtonTextActive]}>Ön</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleButton, bodyView === 'back' && styles.toggleButtonActive]} onPress={() => setBodyView('back')}>
            <Text style={[styles.toggleButtonText, bodyView === 'back' && styles.toggleButtonTextActive]}>Arka</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bodyWrapper}>
          <Body
            side={bodyView}
            gender={userGender}
            scale={0.9}
            data={selectedParts.map(p => ({ slug: p.slug, intensity: 3, ...(p.side ? { side: p.side } : {}) }))}
            onBodyPartPress={(part, side) => togglePart(part.slug, side)}
            colors={['#FCE4EC', '#F8BBD0', '#F48FB1', '#8B2635']}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ağrı & Kaşıntı</Text>
        <Text>Ağrı: {painLevel}</Text>
        <Slider minimumValue={0} maximumValue={10} step={1} value={painLevel} onValueChange={setPainLevel} minimumTrackTintColor="#8B2635" thumbTintColor="#8B2635" />
        <Text>Kaşıntı: {itchLevel}</Text>
        <Slider minimumValue={0} maximumValue={10} step={1} value={itchLevel} onValueChange={setItchLevel} minimumTrackTintColor="#D94F70" thumbTintColor="#D94F70" />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Not Ekle</Text>
        <TextInput style={styles.noteInput} placeholder="Notlarınızı buraya yazın..." value={note} onChangeText={setNote} multiline />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <><Save size={18} color="#fff" /><Text style={styles.saveButtonText}>Kaydet</Text></>}
      </TouchableOpacity>
    </View>
  );

  const renderRecordsTab = () => (
    <View style={{ padding: 10 }}>
      {savedSymptoms.map((item) => (
        <View key={item.id} style={styles.recordCard}>
          <View style={styles.recordTopRow}>
            <Text style={styles.recordDate}>{new Date(item.selected_date).toLocaleDateString('tr-TR')}</Text>
            <TouchableOpacity onPress={() => deleteSymptomRecord(item.id)}><Trash2 size={18} color="#B23A48" /></TouchableOpacity>
          </View>
          <Text style={styles.recordValue}>Bölgeler: {item.selected_parts?.map(getPartLabel).join(', ')}</Text>
          <Text style={styles.recordMini}>Ağrı: {item.pain_level} | Kaşıntı: {item.itch_level}</Text>
          {item.note && <Text style={styles.recordValue}>Not: {item.note}</Text>}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        <Text style={styles.pageTitle}>Semptom Takibi</Text>
        <View style={styles.topTabContainer}>
          <TouchableOpacity style={[styles.topTabButton, activeTab === 'form' && styles.topTabButtonActive]} onPress={() => setActiveTab('form')}>
            <Text style={[styles.topTabButtonText, activeTab === 'form' && styles.topTabButtonTextActive]}>Ekle</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.topTabButton, activeTab === 'records' && styles.topTabButtonActive]} onPress={() => setActiveTab('records')}>
            <Text style={[styles.topTabButtonText, activeTab === 'records' && styles.topTabButtonTextActive]}>Kayıtlar</Text>
          </TouchableOpacity>
        </View>
        {activeTab === 'form' ? renderFormTab() : renderRecordsTab()}
      </ScrollView>

      {/* Navbar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => router.push('/home')} style={styles.navItem}><Home size={22} color="#b9a7ab" /><Text style={styles.navText}>Ana Sayfa</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><Activity size={22} color="#8B2635" /><Text style={[styles.navText, { color: '#8B2635' }]}>Semptom</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/treatment')} style={styles.navItem}><Pill size={22} color="#b9a7ab" /><Text style={styles.navText}>Tedavi</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/fototerapi')} style={styles.navItem}><BarChart3 size={22} color="#b9a7ab" /><Text style={styles.navText}>Fototerapi</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.navItem}><User size={22} color="#b9a7ab" /><Text style={styles.navText}>Profil</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F6' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#8B2635', textAlign: 'center', marginTop: 40 },
  topTabContainer: { flexDirection: 'row', margin: 15, backgroundColor: '#f8e8eb', borderRadius: 12, padding: 4 },
  topTabButton: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10 },
  topTabButtonActive: { backgroundColor: '#8B2635' },
  topTabButtonText: { color: '#8B2635', fontWeight: 'bold' },
  topTabButtonTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', margin: 12, padding: 15, borderRadius: 15, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#630e0e', marginBottom: 10 },
  bodyWrapper: { alignItems: 'center', height: 400 },
  toggleRow: { flexDirection: 'row', marginBottom: 10, backgroundColor: '#f8e8eb', borderRadius: 10 },
  toggleButton: { flex: 1, padding: 8, alignItems: 'center', borderRadius: 8 },
  toggleButtonActive: { backgroundColor: '#8B2635' },
  toggleButtonText: { color: '#8B2635' },
  toggleButtonTextActive: { color: '#fff' },
  noteInput: { backgroundColor: '#fff8f9', borderRadius: 10, padding: 10, height: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#ebd4d9' },
  saveButton: { backgroundColor: '#8B2635', margin: 15, padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 10 },
  recordCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#f0dfe3' },
  recordTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  recordDate: { fontWeight: 'bold', color: '#8B2635' },
  recordValue: { fontSize: 14, color: '#444', marginTop: 3 },
  recordMini: { fontSize: 12, color: '#888' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', padding: 10, position: 'absolute', bottom: 0, width: '100%', borderTopWidth: 1, borderTopColor: '#eee' },
  navItem: { flex: 1, alignItems: 'center' },
  navText: { fontSize: 10, color: '#b9a7ab', marginTop: 4 }
});