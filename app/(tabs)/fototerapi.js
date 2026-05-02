import { useRouter } from 'expo-router';
import {
  Activity,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  Home,
  Info,
  LayoutDashboard,
  Pill,
  Plus,
  Target,
  Trophy,
  User,
  Zap
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createClient } from '@supabase/supabase-js';

// ─── Supabase Client ──────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://ohnfupxbomdwrgajobbp.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9obmZ1cHhib21kd3JnYWpvYmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwOTU3MDgsImV4cCI6MjA5MjY3MTcwOH0.hL5QqUhsfJCDZ4LNHfFwpjU25LP82UqW1b9cr_M9tks';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const API_BASE_URL = 'http://localhost:5000/api';

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FototerapiScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [plans, setPlans] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [newPlanForm, setNewPlanForm] = useState({
    name: 'Fototerapi Planı',
    startDate: '2026-04-18',
    sessionCount: 10,
  });

  const [historyFilter, setHistoryFilter] = useState({
    startDate: '',
    endDate: '',
  });
  const [showHistoryStartPicker, setShowHistoryStartPicker] = useState(false);
  const [showHistoryEndPicker, setShowHistoryEndPicker] = useState(false);
  const [showNewPlanDatePicker, setShowNewPlanDatePicker] = useState(false);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const todayString = () => new Date().toISOString().split('T')[0];

  const getCurrentUserId = async () => {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  };

  // ─── Load Data from Supabase ─────────────────────────────────────────────────
  const loadData = useCallback(async () => {
  setLoading(true);

  try {
    let userId = await getCurrentUserId();

    if (!userId) {
      userId = 'test-user-123';
    }

    const response = await fetch(`${API_BASE_URL}/fototerapi/${userId}`);
    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Load error:', result);
      return;
    }

    const mappedPlans = (result.plans || []).map((row) => ({
      id: row.fototerapi_id,
      db_id: row.fototerapi_id,
      name: row.ad ?? 'Fototerapi Planı',
      startDate: row.baslangic_tarihi ?? '',
      sessionCount: row.seans_sayisi ?? 10,
      isActive: row.aktif_mi ?? false,
    }));

    const mappedSessions = (result.sessions || []).map((row) => ({
      id: row.seans_id,
      db_id: row.seans_id,
      planId: row.fototerapi_id,
      sessionNo: row.seans_no ?? 1,
      scheduledDate: row.tarih ?? '',
      completedAt: row.tamamlanma_tarihi ?? null,
      duration: row.sure_dakika ? String(row.sure_dakika) : '',
      isCompleted: row.alindi_mi ?? false,
    }));

    setPlans(mappedPlans);
    setSessions(mappedSessions);
      } catch (err) {
    console.error('Load error:', err);
  } finally {
    setLoading(false);
  }
}, []);


  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Computed Values ─────────────────────────────────────────────────────────
  const activePlan = useMemo(() => plans.find((p) => p.isActive), [plans]);

  const activePlanSessions = useMemo(() => {
    if (!activePlan) return [];
    return sessions
      .filter((s) => String(s.planId) === String(activePlan.id))
      .sort((a, b) => a.sessionNo - b.sessionNo);
  }, [sessions, activePlan]);

  const stats = useMemo(() => {
    const total = activePlan ? activePlan.sessionCount : 0;
    const completed = activePlanSessions.filter((s) => s.isCompleted).length;
    const adherence = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
    return { total, completed, pending: total - completed, adherence, progress: adherence };
  }, [activePlan, activePlanSessions]);

  const historySessions = useMemo(() => {
  return sessions
    .filter((s) => s.isCompleted && s.completedAt)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .filter((s) => {
      if (historyFilter.startDate && s.completedAt < historyFilter.startDate) return false;
      if (historyFilter.endDate && s.completedAt > historyFilter.endDate) return false;
      return true;
    });
}, [sessions, historyFilter]);

  // ─── Complete Session ────────────────────────────────────────────────────────
  const completeSession = async (sessionId) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;
    if (target.isCompleted) {
      Alert.alert('Bilgi', 'Bu seans zaten tamamlanmış.');
      return;
    }

    const today = todayString();

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, isCompleted: true, completedAt: today } : s
      )
    );

    try {
      if (target.db_id) {
  await fetch(`${API_BASE_URL}/fototerapi/session/${target.db_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tamamlanma_tarihi: today,
    }),
  });
}
    } catch (err) {
      console.error('Complete session error:', err);
    }
  };

// ─── Create Plan ─────────────────────────────────────────────────────────────
  const createPlan = async () => {
  const name = newPlanForm.name.trim();
  const startDate = newPlanForm.startDate;
  const sessionCount = Number(newPlanForm.sessionCount);

  if (!name || !startDate || sessionCount <= 0) {
    Alert.alert('Hata', 'Lütfen tüm alanları doğru doldurun.');
    return;
  }

  setSaving(true);

  try {
    let userId = await getCurrentUserId();

    if (!userId) {
      userId = 'test-user-123';
    }

    const response = await fetch(`${API_BASE_URL}/fototerapi/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kullanici_id: userId,
        ad: name,
        baslangic_tarihi: startDate,
        seans_sayisi: sessionCount,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      Alert.alert('Hata', result.message || 'Plan kaydedilemedi.');
      return;
    }

    await loadData();

    setNewPlanForm({
      name: 'Fototerapi Planı',
      startDate,
      sessionCount: '8',
    });

    Alert.alert('Başarılı', 'Yeni tedavi planı oluşturuldu.');
    setActiveTab('dashboard');
  } catch (err) {
    console.error('Create plan error:', err);
    Alert.alert('Hata', 'Beklenmeyen bir hata oluştu.');
  } finally {
    setSaving(false);
  }
};

// ─── Undo Session ────────────────────────────────────────────────────────────
const undoSession = async (sessionId) => {
  const target = sessions.find((s) => s.id === sessionId);
  if (!target) return;

  setSessions((prev) =>
    prev.map((s) =>
      s.id === sessionId ? { ...s, isCompleted: false, completedAt: null } : s
    )
  );

  try {
    if (target.db_id) {
      await fetch(`${API_BASE_URL}/fototerapi/session/${target.db_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tamamlanma_tarihi: null }),
      });
    }
  } catch (err) {
    console.error('Undo session error:', err);
  }
};

  // ─── Render Dashboard ────────────────────────────────────────────────────────
  const renderDashboard = () => {
    const currentSession = activePlanSessions.find((s) => !s.isCompleted);

    return (
      <View>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconBox}>
              <Target size={18} color="#8B2635" />
            </View>
            <Text style={styles.statLabel}>İlerleme</Text>
            <Text style={styles.statValue}>%{stats.progress}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconBoxOrange}>
              <Trophy size={18} color="#f97316" />
            </View>
            <Text style={styles.statLabel}>Tamamlanan</Text>
            <Text style={styles.statValue}>
              {stats.completed}
              <Text style={styles.statMuted}> / {stats.total}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.activeSessionCard}>
          <View style={styles.activeSessionHeader}>
            <View style={styles.activeDotRow}>
              <View style={styles.greenDot} />
              <Text style={styles.activeLabel}>Sıradaki Adım</Text>
            </View>
            <Clock size={17} color="#8B2635" />
          </View>

          <Text style={styles.activeSessionTitle}>
            {currentSession
              ? `Seans #${currentSession.sessionNo}`
              : 'Tüm Seanslar Tamamlandı'}
          </Text>

          <Text style={styles.activeSessionSub}>
            {currentSession
              ? `${currentSession.scheduledDate} • Hazırlan`
              : 'Aktif plandaki tüm seanslar tamamlandı'}
          </Text>

          {currentSession ? (
            <TouchableOpacity
              style={styles.completeBigButton}
              onPress={() => completeSession(currentSession.id)}
            >
              <Zap size={18} color="#fff" fill="#fff" />
              <Text style={styles.completeBigButtonText}>SEANSI TAMAMLA</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.completedAllBox}>
              <CheckCircle2 size={20} color="#1f9d55" />
              <Text style={styles.completedAllText}>Tedavi planı tamamlandı</Text>
            </View>
          )}
        </View>

        <View style={styles.roadSection}>
          <View style={styles.roadHeader}>
            <Text style={styles.roadTitle}>Tedavi Yolun</Text>
            <Text style={styles.roadAction}>
              {stats.completed} / {stats.total}
            </Text>
          </View>

          <View style={styles.sessionMatrix}>
            {activePlanSessions.map((session) => {
              const isCompleted = session.isCompleted;
              const isActive = currentSession?.id === session.id;

              return (
                <TouchableOpacity
                  key={session.id}
                  style={styles.matrixItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (session.isCompleted) {
                      undoSession(session.id);
                    } else {
                      completeSession(session.id);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.matrixCircle,
                      isCompleted && styles.matrixCircleCompleted,
                      isActive && styles.matrixCircleActive,
                    ]}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={24} color="#1f9d55" />
                    ) : (
                      <Text
                        style={[
                          styles.matrixNumber,
                          isActive && styles.matrixNumberActive,
                        ]}
                      >
                        {session.sessionNo}
                      </Text>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.matrixDate,
                      isActive && styles.matrixDateActive,
                    ]}
                  >
                    {session.scheduledDate.slice(5)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.progressCardNew}>
          <View style={styles.progressHeader}>
            <Text style={styles.cardTitle}>Katılım Durumu</Text>
            <Text style={styles.percentBadge}>%{stats.adherence}</Text>
          </View>

          <Text style={styles.progressText}>
            {stats.completed} / {stats.total} seans tamamlandı
          </Text>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBar, { width: `${stats.progress}%` }]} />
          </View>
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIconBox}>
            <Info size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipLabel}>Günün İpucu</Text>
            <Text style={styles.tipText}>
              Seans sonrası nemlendirici kullanımı cilt bariyerini güçlendirebilir.
            </Text>
          </View>
        </View>
      </View>
    );
  };

// ─── Render History ──────────────────────────────────────────────────────────
const renderHistory = () => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>Geçmiş Seanslar</Text>

    <Text style={styles.filterLabel}>Başlangıç Tarihi</Text>
    <View style={styles.datePickerButton}>
      <TouchableOpacity onPress={() => setShowHistoryStartPicker(true)}>
        <Calendar size={18} color="#8B2635" />
      </TouchableOpacity>

      <TextInput
        style={styles.datePickerText}
        value={historyFilter.startDate}
        onChangeText={(text) =>
          setHistoryFilter((prev) => ({ ...prev, startDate: text }))
        }
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#b9a7ab"
        maxLength={10}
        keyboardType="numeric"
      />
    </View>

    {showHistoryStartPicker && (
      <DateTimePicker
        value={historyFilter.startDate ? new Date(historyFilter.startDate) : new Date()}
        mode="date"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={(event, date) => {
          if (Platform.OS === 'android') setShowHistoryStartPicker(false);
          if (date) {
            setHistoryFilter((prev) => ({
              ...prev,
              startDate: date.toISOString().split('T')[0],
            }));
          }
        }}
      />
    )}

    <Text style={styles.filterLabel}>Bitiş Tarihi</Text>
    <View style={styles.datePickerButton}>
      <TouchableOpacity onPress={() => setShowHistoryEndPicker(true)}>
        <Calendar size={18} color="#8B2635" />
      </TouchableOpacity>

      <TextInput
        style={styles.datePickerText}
        value={historyFilter.endDate}
        onChangeText={(text) =>
          setHistoryFilter((prev) => ({ ...prev, endDate: text }))
        }
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#b9a7ab"
        maxLength={10}
        keyboardType="numeric"
      />
    </View>

    {showHistoryEndPicker && (
      <DateTimePicker
        value={historyFilter.endDate ? new Date(historyFilter.endDate) : new Date()}
        mode="date"
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        onChange={(event, date) => {
          if (Platform.OS === 'android') setShowHistoryEndPicker(false);
          if (date) {
            setHistoryFilter((prev) => ({
              ...prev,
              endDate: date.toISOString().split('T')[0],
            }));
          }
        }}
      />
    )}

    <TouchableOpacity
      style={styles.clearFilterButton}
      onPress={() => setHistoryFilter({ startDate: '', endDate: '' })}
    >
      <Text style={styles.clearFilterButtonText}>Filtreyi Temizle</Text>
    </TouchableOpacity>

    {historySessions.length === 0 ? (
      <Text style={styles.emptyText}>Filtreye uygun geçmiş seans yok.</Text>
    ) : (
      historySessions.map((session, index) => (
        <View
          key={`${session.planId ?? 'plan'}-${session.id ?? index}-${session.sessionNo ?? index}`}
          style={styles.historyItem}
        >
          <View>
            <Text style={styles.historyTitle}>{session.sessionNo}. Seans</Text>
            <Text style={styles.historySub}>
              Planlanan Tarih: {session.scheduledDate}
            </Text>
            <Text style={styles.historySub}>
              Tamamlanma Tarihi: {session.completedAt}
            </Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Tamamlandı</Text>
          </View>
        </View>
      ))
    )}
  </View>
);

  // ─── Render New Plan ─────────────────────────────────────────────────────────
  const renderNewPlan = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Yeni Plan Oluştur</Text>

      <Text style={styles.inputLabel}>Plan Adı</Text>
      <TextInput
        style={styles.inputBox}
        value={newPlanForm.name}
        onChangeText={(text) => setNewPlanForm({ ...newPlanForm, name: text })}
        placeholder="Fototerapi Planı"
        placeholderTextColor="#b9a7ab"
      />

      <Text style={styles.inputLabel}>Başlangıç Tarihi</Text>
      <View style={styles.inputWrapper}>
  <TouchableOpacity onPress={() => setShowNewPlanDatePicker(true)}>
    <Calendar size={18} color="#8B2635" />
  </TouchableOpacity>

  <TextInput
    style={styles.input}
    value={newPlanForm.startDate}
    onChangeText={(text) =>
      setNewPlanForm({ ...newPlanForm, startDate: text })
    }
    placeholder="YYYY-MM-DD"
    placeholderTextColor="#b9a7ab"
    maxLength={10}
    keyboardType="numbers-and-punctuation"
  />
</View>

{showNewPlanDatePicker && (
  <DateTimePicker
    value={newPlanForm.startDate ? new Date(newPlanForm.startDate) : new Date()}
    mode="date"
    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
    onChange={(event, date) => {
      if (Platform.OS === 'android') setShowNewPlanDatePicker(false);

      if (date) {
        setNewPlanForm((prev) => ({
          ...prev,
          startDate: date.toISOString().split('T')[0],
        }));
      }
    }}
  />
)}

      <Text style={styles.inputLabel}>Seans Sayısı</Text>
      <TextInput
        style={styles.inputBox}
        value={String(newPlanForm.sessionCount)}
        onChangeText={(text) =>
  setNewPlanForm({ ...newPlanForm, sessionCount: text.replace(/[^0-9]/g, '') })
        }
        keyboardType="numeric"
        placeholder="10"
        placeholderTextColor="#b9a7ab"
      />

      <TouchableOpacity
        style={[styles.primaryButton, saving && { opacity: 0.6 }]}
        onPress={createPlan}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Yeni Planı Kaydet</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // ─── Loading Screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#8B2635" />
        <Text style={{ color: '#8B2635', marginTop: 12, fontWeight: '600' }}>
          Yükleniyor...
        </Text>
      </View>
    );
  }

  // ─── Main Render ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.topTabs}>
          <TouchableOpacity
            style={[
              styles.topTabButton,
              activeTab === 'dashboard' && styles.topTabButtonActive,
            ]}
            onPress={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard
              size={16}
              color={activeTab === 'dashboard' ? '#fff' : '#8B2635'}
            />
            <Text
              style={[
                styles.topTabText,
                activeTab === 'dashboard' && styles.topTabTextActive,
              ]}
            >
              Panel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.topTabButton,
              activeTab === 'history' && styles.topTabButtonActive,
            ]}
            onPress={() => setActiveTab('history')}
          >
            <History
              size={16}
              color={activeTab === 'history' ? '#fff' : '#8B2635'}
            />
            <Text
              style={[
                styles.topTabText,
                activeTab === 'history' && styles.topTabTextActive,
              ]}
            >
              Geçmiş
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.topTabButton,
              activeTab === 'new_plan' && styles.topTabButtonActive,
            ]}
            onPress={() => setActiveTab('new_plan')}
          >
            <Plus
              size={16}
              color={activeTab === 'new_plan' ? '#fff' : '#8B2635'}
            />
            <Text
              style={[
                styles.topTabText,
                activeTab === 'new_plan' && styles.topTabTextActive,
              ]}
            >
              Yeni Plan
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'new_plan' && renderNewPlan()}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/home')}
        >
          <Home size={22} color="#b9a7ab" />
          <Text style={styles.navText}>Ana Sayfa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/symptoms')}
        >
          <Activity size={22} color="#b9a7ab" />
          <Text style={styles.navText}>Semptom Takibi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/treatment')}
        >
          <Pill size={22} color="#b9a7ab" />
          <Text style={styles.navText}>Tedaviler</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <BarChart3 size={22} color="#8B2635" />
          <Text style={[styles.navText, { color: '#8B2635' }]}>
            Fototerapi Takibi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/profile')}
        >
          <User size={22} color="#b9a7ab" />
          <Text style={styles.navText}>Profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles (100% original) ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F6',
  },
  scrollContent: {
    paddingBottom: 110,
    paddingTop: 80,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8B2635',
  },
  subtitle: {
    fontSize: 13,
    color: '#9b8d91',
    marginTop: 4,
  },
  topTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  topTabButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginHorizontal: 4,
  },
  topTabButtonActive: {
    backgroundColor: '#8B2635',
  },
  topTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B2635',
    marginLeft: 6,
  },
  topTabTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: 22,
  },
  cardLabel: {
    fontSize: 11,
    color: '#8B2635',
    marginBottom: 6,
    fontWeight: '600',
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  progressSection: {
    marginTop: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8B2635',
    marginBottom: 10,
  },
  percentBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B2635',
  },
  progressText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 10,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#f0e2e5',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8B2635',
    borderRadius: 10,
  },
  sessionRow: {
    backgroundColor: '#FFF5F6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  sessionInfo: {
    marginBottom: 10,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  sessionSub: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  completedDateText: {
    fontSize: 13,
    color: '#1f9d55',
    marginTop: 4,
    fontWeight: '600',
  },
  pendingText: {
    fontSize: 13,
    color: '#c05674',
    marginTop: 4,
    fontWeight: '600',
  },
  durationLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    marginBottom: 6,
    fontWeight: '600',
  },
  durationInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: '#333',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ead7dc',
  },
  completeButton: {
    backgroundColor: '#8B2635',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  undoButton: {
    backgroundColor: '#ececec',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  undoButtonText: {
    color: '#555',
    fontWeight: '700',
    fontSize: 13,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3eaec',
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  historySub: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: '#e8f7ee',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1f9d55',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F6',
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 14,
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    color: '#333',
    fontSize: 14,
  },
  inputBox: {
    backgroundColor: '#FFF5F6',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 14,
    color: '#333',
    fontSize: 14,
  },
  datePickerButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFF5F6',
    paddingHorizontal: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  datePickerPlaceholder: {
    color: '#b9a7ab',
  },
  noteBox: {
    backgroundColor: '#fff1e6',
    padding: 12,
    borderRadius: 14,
    marginTop: 4,
    marginBottom: 14,
  },
  noteText: {
    fontSize: 12,
    color: '#9a5b20',
  },
  clearFilterButton: {
    backgroundColor: '#f3e7ea',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  clearFilterButtonText: {
    color: '#8B2635',
    fontWeight: '700',
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: '#8B2635',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
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
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    marginTop: 4,
    color: '#b9a7ab',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f8e7eb',
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#FFF5F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statIconBoxOrange: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#aaa',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#8B2635',
    marginTop: 4,
  },
  statMuted: {
    fontSize: 14,
    color: '#bbb',
  },
  activeSessionCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 32,
    padding: 22,
    borderWidth: 1,
    borderColor: '#f8e7eb',
  },
  activeSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  activeDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    marginRight: 8,
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activeSessionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#222',
    marginBottom: 4,
  },
  activeSessionSub: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginBottom: 18,
  },
  completeBigButton: {
    backgroundColor: '#8B2635',
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  completeBigButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  completedAllBox: {
    backgroundColor: '#e8f7ee',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  completedAllText: {
    color: '#1f9d55',
    fontWeight: '800',
    fontSize: 13,
  },
  roadSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  roadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  roadTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  roadAction: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8B2635',
  },
   sessionMatrix: {
  backgroundColor: '#fff',
  borderRadius: 28,
  paddingVertical: 18,
  paddingHorizontal: 12,
  borderWidth: 1,
  borderColor: '#f8e7eb',
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
},

matrixItem: {
  width: '20%',
  alignItems: 'center',
  marginBottom: 18,
},

matrixCircle: {
  width: 54,
  height: 54,
  borderRadius: 18,
  backgroundColor: '#f8f8f8',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 2,
  borderColor: 'transparent',
},

matrixCircleCompleted: {
  backgroundColor: '#e8f7ee',
  borderColor: '#d1f0dc',
},

matrixCircleActive: {
  backgroundColor: '#FFF5F6',
  borderColor: '#8B2635',
},

matrixNumber: {
  fontSize: 16,
  fontWeight: '800',
  color: '#bbb',
},

matrixNumberActive: {
  color: '#8B2635',
},

matrixDate: {
  marginTop: 6,
  fontSize: 10,
  fontWeight: '700',
  color: '#aaa',
  textAlign: 'center',
},

matrixDateActive: {
  color: '#8B2635',
},
  progressCardNew: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: 24,
  },
  tipCard: {
    backgroundColor: '#8B2635',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  tipIconBox: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
  },
  tipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
});
