import React, { useEffect, useState, useMemo } from 'react';
import {
  Alert,
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
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Activity,
  BarChart3,
  Calendar,
  History,
  Home,
  LayoutDashboard,
  Pill,
  Plus,
  User,
} from 'lucide-react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://paoonvobclstwdmvefwt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhaW9vbnZvYmNsc3R3ZG12ZWZ3dCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE0MTY4NDUyLCJleHAiOjIwMjk3NDQ0NTJ9.8M-f67J1r9-4k9U1Y-oR7W7-R-z-x-z-x-z-x-z-x'; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function FototerapiScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // Data State
  const [plans, setPlans] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Form & Filter State
  const [newPlanForm, setNewPlanForm] = useState({
    name: 'Fototerapi Planı',
    startDate: new Date().toISOString().split('T')[0],
    sessionCount: 10,
  });

  const [historyFilter, setHistoryFilter] = useState({ startDate: '', endDate: '' });
  const [pickerState, setPickerState] = useState({ visible: false, field: null, value: new Date() });

  // 1. Fetch Data on Mount
  useEffect(() => {
    fetchInitialData();
  }, []);

 const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("Kullanıcı bulunamadı");
        return;
      }

      const { data: plansData } = await supabase
        .from('phototherapy_plans')
        .select('*')
        .eq('user_id', user.id);
      
      const { data: sessionsData } = await supabase
        .from('phototherapy_sessions')
        .select('*')
        .eq('user_id', user.id);

      if (plansData) setPlans(plansData);
      if (sessionsData) setSessions(sessionsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Create New Plan in Database
  const createPlan = async () => {
    const { name, startDate, sessionCount } = newPlanForm;
    if (!name || !startDate || sessionCount <= 0) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Hata', 'Lütfen önce giriş yapın.');
        return;
      }

      await supabase.from('phototherapy_plans').update({ is_active: false }).eq('user_id', user.id);

      // إدخال الخطة الجديدة
      const { data: plan, error: planErr } = await supabase
        .from('phototherapy_plans')
        .insert([{ user_id: user.id, name, start_date: startDate, session_count: sessionCount, is_active: true }])
        .select()
        .single();

      if (planErr) throw planErr;

      // إنشاء الجلسات تلقائياً (جلسة كل يومين)
      const generatedSessions = [];
      for (let i = 0; i < sessionCount; i++) {
        const sDate = new Date(startDate);
        sDate.setDate(sDate.getDate() + i * 2);
        generatedSessions.push({
          user_id: user.id,
          plan_id: plan.id,
          session_no: i + 1,
          scheduled_date: sDate.toISOString().split('T')[0],
          is_completed: false,
        });
      }

      const { error: sessErr } = await supabase.from('phototherapy_sessions').insert(generatedSessions);
      if (sessErr) throw sessErr;

      Alert.alert('Başarılı', 'Yeni plan oluşturuldu.');
      fetchInitialData();
      setActiveTab('dashboard');
    } catch (err) {
      Alert.alert('Hata', 'Plan oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Update Session in Database
  const toggleSessionStatus = async (sessionId, currentStatus) => {
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
      .from('phototherapy_sessions')
      .update({ 
        is_completed: !currentStatus, 
        completed_at: !currentStatus ? today : null 
      })
      .eq('id', sessionId);

    if (!error) fetchInitialData();
  };

  const updateDuration = async (sessionId, value) => {
    const cleanValue = value.replace(/[^0-9]/g, '');
    const { error } = await supabase
      .from('phototherapy_sessions')
      .update({ duration: cleanValue })
      .eq('id', sessionId);
    
    if (!error) {
        setSessions(prev => prev.map(s => s.id === sessionId ? {...s, duration: cleanValue} : s));
    }
  };

  // Logic Helpers (Memoized)
  const activePlan = useMemo(() => plans.find(p => p.is_active), [plans]);
  const activePlanSessions = useMemo(() => 
    sessions.filter(s => s.plan_id === activePlan?.id).sort((a,b) => a.session_no - b.session_no)
  , [sessions, activePlan]);

  const stats = useMemo(() => {
    const total = activePlan?.session_count || 0;
    const completed = activePlanSessions.filter(s => s.is_completed).length;
    return { total, completed, pending: total - completed, progress: total > 0 ? (completed/total)*100 : 0 };
  }, [activePlan, activePlanSessions]);

  const historySessions = useMemo(() => {
    return sessions
      .filter(s => s.is_completed)
      .filter(s => (!historyFilter.startDate || s.completed_at >= historyFilter.startDate))
      .filter(s => (!historyFilter.endDate || s.completed_at <= historyFilter.endDate))
      .sort((a,b) => new Date(b.completed_at) - new Date(a.completed_at));
  }, [sessions, historyFilter]);

  // Date Picker Logic
  const onDateChange = (event, selectedDate) => {
    setPickerState(prev => ({ ...prev, visible: false }));
    if (selectedDate && pickerState.field) {
      const formatted = selectedDate.toISOString().split('T')[0];
      setHistoryFilter(prev => ({ ...prev, [pickerState.field]: formatted }));
    }
  };

  // Rendering Functions
  const renderDashboard = () => (
    <View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Aktif Tedavi</Text>
        <Text style={styles.mainTitle}>{activePlan ? activePlan.name : 'Aktif plan yok'}</Text>
        <Text style={styles.infoText}>Başlangıç: {activePlan?.start_date || '-'}</Text>
        <Text style={styles.infoText}>Seans: {stats.completed} / {stats.total}</Text>
        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${stats.progress}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Seanslar</Text>
        {activePlanSessions.map((session) => (
          <View key={session.id} style={styles.sessionRow}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionTitle}>{session.session_no}. Seans</Text>
              <Text style={styles.sessionSub}>Tarih: {session.scheduled_date}</Text>
              {session.is_completed && (
                <TextInput
                  style={styles.durationInput}
                  value={String(session.duration || '')}
                  onChangeText={(text) => updateDuration(session.id, text)}
                  placeholder="Süre (sn)"
                  keyboardType="numeric"
                />
              )}
            </View>
            <TouchableOpacity 
              style={session.is_completed ? styles.undoButton : styles.completeButton}
              onPress={() => toggleSessionStatus(session.id, session.is_completed)}
            >
              <Text style={session.is_completed ? styles.undoButtonText : styles.completeButtonText}>
                {session.is_completed ? 'Geri Al' : 'Tamamlandı'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderHistory = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Geçmiş</Text>
      <TouchableOpacity style={styles.datePickerButton} onPress={() => setPickerState({visible:true, field:'startDate', value: new Date()})}>
        <Text style={styles.datePickerText}>{historyFilter.startDate || 'Başlangıç Seç'}</Text>
      </TouchableOpacity>
      {historySessions.map(s => (
        <View key={s.id} style={styles.historyItem}>
          <Text style={styles.historyTitle}>{s.session_no}. Seans - {s.completed_at}</Text>
          <Text style={styles.statusText}>Süre: {s.duration || 0} sn</Text>
        </View>
      ))}
    </View>
  );

  const renderNewPlan = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Yeni Plan</Text>
      <TextInput 
        style={styles.inputBox} 
        placeholder="Plan Adı" 
        value={newPlanForm.name} 
        onChangeText={t => setNewPlanForm({...newPlanForm, name: t})}
      />
      <TextInput 
        style={styles.inputBox} 
        placeholder="Seans Sayısı" 
        keyboardType="numeric"
        value={String(newPlanForm.sessionCount)}
        onChangeText={t => setNewPlanForm({...newPlanForm, sessionCount: Number(t)})}
      />
      <TouchableOpacity style={styles.primaryButton} onPress={createPlan} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff"/> : <Text style={styles.primaryButtonText}>Kaydet</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Fototerapi Takibi</Text>
        </View>
        <View style={styles.topTabs}>
          {['dashboard', 'history', 'new_plan'].map(tab => (
            <TouchableOpacity 
              key={tab}
              style={[styles.topTabButton, activeTab === tab && styles.topTabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.topTabText, activeTab === tab && styles.topTabTextActive]}>
                {tab === 'dashboard' ? 'Panel' : tab === 'history' ? 'Geçmiş' : 'Yeni'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'new_plan' && renderNewPlan()}
      </ScrollView>

      {pickerState.visible && (
        <DateTimePicker value={pickerState.value} mode="date" onChange={onDateChange} />
      )}

      {/* Navbar الاختصار */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/home')}><Home size={22} color="#b9a7ab"/><Text style={styles.navText}>Ana Sayfa</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/symptoms')}><Activity size={22} color="#b9a7ab"/><Text style={styles.navText}>Semptom</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem}><BarChart3 size={22} color="#8B2635"/><Text style={[styles.navText, {color:'#8B2635'}]}>Fototerapi</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}><User size={22} color="#b9a7ab"/><Text style={styles.navText}>Profil</Text></TouchableOpacity>
      </View>
    </View>
  );
}

// التنسيقات هي نفسها التي أرفقتيها مع تعديلات بسيطة لتناسب المكونات الجديدة
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F6' },
  scrollContent: { paddingBottom: 110 },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#8B2635' },
  topTabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  topTabButton: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', marginHorizontal: 4 },
  topTabButtonActive: { backgroundColor: '#8B2635' },
  topTabText: { color: '#8B2635', fontWeight: '600' },
  topTabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, padding: 18, borderRadius: 22 },
  cardLabel: { fontSize: 11, color: '#8B2635', fontWeight: '600' },
  mainTitle: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  infoText: { fontSize: 13, color: '#666', marginBottom: 4 },
  progressSection: { marginTop: 10 },
  progressBarBg: { height: 10, backgroundColor: '#f0e2e5', borderRadius: 10, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#8B2635' },
  sessionRow: { backgroundColor: '#FFF5F6', borderRadius: 16, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  sessionInfo: { flex: 1 },
  sessionTitle: { fontSize: 15, fontWeight: '700' },
  sessionSub: { fontSize: 12, color: '#666' },
  durationInput: { backgroundColor: '#fff', borderRadius: 8, padding: 5, marginTop: 5, width: 80, borderWidth: 1, borderColor: '#ead7dc' },
  completeButton: { backgroundColor: '#8B2635', borderRadius: 10, padding: 10 },
  completeButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  undoButton: { backgroundColor: '#ececec', borderRadius: 10, padding: 10 },
  undoButtonText: { color: '#555', fontSize: 12 },
  inputBox: { backgroundColor: '#FFF5F6', borderRadius: 12, padding: 12, marginBottom: 10 },
  primaryButton: { backgroundColor: '#8B2635', padding: 15, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  historyItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3eaec' },
  historyTitle: { fontWeight: '600' },
  statusText: { fontSize: 12, color: '#1f9d55' },
  bottomNav: { position: 'absolute', bottom: 0, width: '100%', height: 75, backgroundColor: '#fff', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1e5e8' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 10, color: '#b9a7ab', marginTop: 4 }
});