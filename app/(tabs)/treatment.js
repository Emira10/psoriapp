import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ClipboardPlus,
  Home,
  Pill,
  Plus,
  SunMedium,
  Trash2,
  User,
  X,
} from 'lucide-react-native';

export default function TreatmentsScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('current');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [treatments, setTreatments] = useState([
    {
      id: 1,
      name: 'Kortizonlu Merhem',
      type: 'Krem',
      frequency: 'Günde 2 kez',
      startDate: '2026-03-01',
      endDate: '2026-05-15',
    },
    {
      id: 2,
      name: 'Biyolojik Ajan',
      type: 'İğne',
      frequency: 'Haftada 1 kez',
      startDate: '2026-04-10',
      endDate: '2026-10-10',
    },
    {
      id: 3,
      name: 'D Vitamini Takviyesi',
      type: 'Hap',
      frequency: 'Günde 1 kez',
      startDate: '2025-12-01',
      endDate: '2026-01-30',
    },
  ]);

  const [form, setForm] = useState({
    name: '',
    type: '',
    frequency: '',
    startDate: '',
    endDate: '',
  });

  const treatmentTypes = ['İğne', 'Krem', 'Hap'];
  const today = new Date().toISOString().split('T')[0];

  const { currentList, pastList } = useMemo(() => {
    return {
      currentList: treatments.filter((t) => t.endDate >= today),
      pastList: treatments.filter((t) => t.endDate < today),
    };
  }, [treatments, today]);

  const list = activeTab === 'current' ? currentList : pastList;

  const resetForm = () => {
    setForm({
      name: '',
      type: '',
      frequency: '',
      startDate: '',
      endDate: '',
    });
    setSelectedTreatment(null);
    setIsEditMode(false);
    setShowTypeDropdown(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setSelectedTreatment(item);
    setForm({
      name: item.name || '',
      type: item.type || '',
      frequency: item.frequency || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
    });
    setIsEditMode(true);
    setShowTypeDropdown(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const addOrUpdateTreatment = () => {
    if (!form.name.trim() || !form.type || !form.startDate || !form.endDate) {
      Alert.alert('Eksik Bilgi', 'Lütfen zorunlu alanları doldur.');
      return;
    }

    if (form.endDate < form.startDate) {
      Alert.alert('Tarih Hatası', 'Bitiş tarihi başlangıç tarihinden önce olamaz.');
      return;
    }

    const newTreatment = {
      name: form.name.trim(),
      type: form.type,
      frequency: form.frequency.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
    };

    if (isEditMode && selectedTreatment) {
      setTreatments((prev) =>
        prev.map((t) =>
          t.id === selectedTreatment.id ? { ...t, ...newTreatment } : t
        )
      );
    } else {
      setTreatments((prev) => [
        {
          id: Date.now(),
          ...newTreatment,
        },
        ...prev,
      ]);
    }

    closeModal();
  };

  const deleteTreatment = (id) => {
    Alert.alert('Tedaviyi Sil', 'Bu tedaviyi silmek istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          setTreatments((prev) => prev.filter((t) => t.id !== id));
        },
      },
    ]);
  };

  const getIcon = (type, size = 20, color = '#8B2635') => {
    if (type === 'Hap') return <Pill size={size} color={color} />;
    if (type === 'Krem') return <ClipboardPlus size={size} color={color} />;
    if (type === 'İğne') {
      return <MaterialCommunityIcons name="needle" size={size} color={color} />;
    }
    return <Pill size={size} color={color} />;
  };

  const selectTreatmentType = (type) => {
    setForm((prev) => ({ ...prev, type }));
    setShowTypeDropdown(false);
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.tabsWrapper}>
        <Pressable
          style={[styles.tabBox, activeTab === 'current' && styles.activeTabBox]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={[styles.tabBoxText, activeTab === 'current' && styles.activeTabBoxText]}>
            Güncel
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tabBox, activeTab === 'past' && styles.activeTabBox]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabBoxText, activeTab === 'past' && styles.activeTabBoxText]}>
            Geçmiş
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {list.length === 0 ? (
          <View style={styles.emptyBox}>
            <Pill size={38} color="#f0b1bb" />
            <Text style={styles.emptyText}>
              {activeTab === 'current'
                ? 'Şu an devam eden bir tedavin bulunmuyor.'
                : 'Geçmiş tedavi kaydın bulunmuyor.'}
            </Text>
          </View>
        ) : (
          list.map((item) => (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() => activeTab === 'current' && openEditModal(item)}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <View style={styles.iconBox}>{getIcon(item.type)}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.typeText}>{item.type || 'Tür yok'}</Text>
                  </View>
                </View>

                {activeTab === 'current' && (
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => deleteTreatment(item.id)}
                  >
                    <Trash2 size={18} color="#d96b78" />
                  </Pressable>
                )}
              </View>

              <View style={styles.badgeRow}>
                <View style={styles.frequencyBadge}>
                  <SunMedium size={14} color="#8B2635" />
                  <Text style={styles.frequencyText}>
                    {item.frequency || 'Sıklık belirtilmedi'}
                  </Text>
                </View>
              </View>

              <View style={styles.dateFooter}>
                <View style={styles.dateSmallRow}>
                  <CalendarDays size={14} color="#d8919e" />
                  <Text style={styles.dateText}>{formatDateLabel(item.startDate)}</Text>
                </View>
                <Text style={styles.arrowText}>→</Text>
                <View style={styles.dateSmallRow}>
                  <Text style={styles.dateText}>{formatDateLabel(item.endDate)}</Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={openAddModal}>
        <Plus color="white" size={28} />
      </Pressable>

      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <Pressable style={styles.overlayBg} onPress={closeModal} />

          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {isEditMode ? 'Tedaviyi Düzenle' : 'Yeni Tedavi'}
              </Text>
              <Pressable style={styles.closeButton} onPress={closeModal}>
                <X size={20} color="#8B2635" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Tedavi Adı</Text>
            <TextInput
              placeholder="Örn: Kortizonlu Merhem"
              placeholderTextColor="#d8919e"
              style={styles.input}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />

            <Text style={styles.inputLabel}>Tedavi Türü</Text>
            <View style={styles.pickerWrapper}>
              <Pressable
                style={styles.typeSelector}
                onPress={() => setShowTypeDropdown((prev) => !prev)}
              >
                <View style={styles.typeSelectorLeft}>
                  {form.type ? getIcon(form.type, 18) : <Pill size={18} color="#d8919e" />}
                  <Text style={[styles.typeSelectorText, !form.type && styles.placeholderText]}>
                    {form.type || 'Tür seçiniz'}
                  </Text>
                </View>
                <ChevronDown size={18} color="#8B2635" />
              </Pressable>

              {showTypeDropdown && (
                <View style={styles.dropdownList}>
                  {treatmentTypes.map((type) => (
                    <Pressable
                      key={type}
                      style={styles.dropdownItem}
                      onPress={() => selectTreatmentType(type)}
                    >
                      {getIcon(type, 18)}
                      <Text style={styles.dropdownItemText}>{type}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Text style={styles.inputLabel}>Kullanım Sıklığı</Text>
            <TextInput
              placeholder="Örn: Günde 2 kez"
              placeholderTextColor="#d8919e"
              style={styles.input}
              value={form.frequency}
              onChangeText={(text) => setForm({ ...form, frequency: text })}
            />

            {/* ─── Tarih alanları — TextInput (web uyumlu) ─── */}
            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Başlangıç</Text>
                <View style={styles.dateBox}>
                  <CalendarDays size={18} color="#8B2635" />
                  <TextInput
                    style={styles.dateBoxInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#d8919e"
                    value={form.startDate}
                    onChangeText={(text) => setForm({ ...form, startDate: text })}
                    maxLength={10}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Bitiş</Text>
                <View style={styles.dateBox}>
                  <CalendarDays size={18} color="#8B2635" />
                  <TextInput
                    style={styles.dateBoxInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#d8919e"
                    value={form.endDate}
                    onChangeText={(text) => setForm({ ...form, endDate: text })}
                    maxLength={10}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <Pressable style={styles.saveBtn} onPress={addOrUpdateTreatment}>
              <Text style={styles.saveBtnText}>
                {isEditMode ? 'Güncelle' : 'Kaydet'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => router.push('/home')}>
          <Home size={22} color="#b9a7ab" />
          <Text style={styles.navText}>Ana Sayfa</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push('/symptoms')}>
          <Activity size={22} color="#b9a7ab" />
          <Text style={styles.navText}>Semptom Takibi</Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Pill size={22} color="#8B2635" />
          <Text style={[styles.navText, { color: '#8B2635' }]}>Tedaviler</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push('/fototerapi')}>
          <BarChart3 size={22} color="#b9a7ab" />
          <Text style={styles.navText}>Fototerapi Takibi</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.push('/profile')}>
          <User size={22} color="#b9a7ab" />
          <Text style={styles.navText}>Profil</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F9',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 55,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#8B2635',
  },
  subtitle: {
    color: '#a46e77',
    fontSize: 13,
    marginTop: 4,
  },
  tabsWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FDF8F9',
    gap: 12,
  },
  tabBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1e5e8',
  },
  activeTabBox: {
    backgroundColor: '#8B2635',
    borderColor: '#8B2635',
  },
  tabBoxText: {
    color: '#a46e77',
    fontSize: 15,
    fontWeight: '500',
  },
  activeTabBoxText: {
    color: '#fff',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#f1e5e8',
    borderStyle: 'dashed',
    paddingVertical: 34,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyText: {
    color: '#a46e77',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#faeef0',
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#FDF8F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  name: {
    color: '#54151f',
    fontSize: 17,
    fontWeight: '800',
  },
  typeText: {
    color: '#a46e77',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
    marginTop: -6,
    marginRight: -6,
    borderRadius: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  frequencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fcf2f4',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  frequencyText: {
    color: '#8B2635',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  dateFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f4e2e5',
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateSmallRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#8a5d65',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  arrowText: {
    color: '#d8919e',
    fontSize: 14,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 22,
    width: 56,
    height: 56,
    backgroundColor: '#8B2635',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    zIndex: 10,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(84,21,31,0.42)',
  },
  sheet: {
    backgroundColor: '#fff',
    padding: 22,
    paddingBottom: 36,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#f1e5e8',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#8B2635',
  },
  closeButton: {
    width: 36,
    height: 36,
    backgroundColor: '#FDF8F9',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    color: '#8a5d65',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FDF8F9',
    borderWidth: 1,
    borderColor: '#f4e2e5',
    color: '#54151f',
    padding: 14,
    borderRadius: 18,
    fontSize: 14,
    marginBottom: 12,
  },
  pickerWrapper: {
    marginBottom: 12,
    zIndex: 20,
  },
  typeSelector: {
    backgroundColor: '#FDF8F9',
    borderWidth: 1,
    borderColor: '#f4e2e5',
    padding: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeSelectorText: {
    color: '#54151f',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  placeholderText: {
    color: '#d8919e',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f4e2e5',
    borderRadius: 18,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fdf8f9',
  },
  dropdownItemText: {
    color: '#54151f',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  dateBox: {
    backgroundColor: '#FDF8F9',
    borderWidth: 1,
    borderColor: '#f4e2e5',
    borderRadius: 18,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBoxText: {
    color: '#54151f',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  // ─── جديد: input داخل dateBox ───
  dateBoxInput: {
    flex: 1,
    color: '#54151f',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    outlineStyle: 'none',
  },
  saveBtn: {
    backgroundColor: '#8B2635',
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
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
});