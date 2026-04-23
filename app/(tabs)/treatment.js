import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';

import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  CalendarDays,
  Plus,
  Trash2,
  X,
  Pill,
  ClipboardPlus,
  SunMedium,
  Home,
  Activity,
  BarChart3,
  User,
  ChevronDown,
} from 'lucide-react-native';

export default function TreatmentsScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('current');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
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
  ]);

  const [form, setForm] = useState({
    name: '',
    type: '',
    frequency: '',
    startDate: '',
    endDate: '',
  });

  const treatmentTypes = ['İğne', 'Fototerapi', 'Krem', 'Hap'];

  const today = new Date().toISOString().split('T')[0];

  const { currentList, pastList } = useMemo(() => {
    return {
      currentList: treatments.filter((t) => t.endDate >= today),
      pastList: treatments.filter((t) => t.endDate < today),
    };
  }, [treatments, today]);

  const list = activeTab === 'current' ? currentList : pastList;

  const formatDateForPicker = (dateString) => {
    if (!dateString) return new Date();

    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

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
    setShowStartPicker(false);
    setShowEndPicker(false);
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
    if (!form.name.trim() || !form.type || !form.startDate || !form.endDate) return;
    if (form.endDate < form.startDate) return;

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
        ...prev,
        {
          id: Date.now(),
          ...newTreatment,
        },
      ]);
    }

    closeModal();
  };

  const deleteTreatment = (id) => {
    setTreatments((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type) => {
    if (type === 'Hap') return <Pill size={20} color="#8B2635" />;
    if (type === 'Krem') return <ClipboardPlus size={20} color="#8B2635" />;
    if (type === 'Fototerapi') return <SunMedium size={20} color="#8B2635" />;
    if (type === 'İğne') {
      return (
        <MaterialCommunityIcons
          name="needle"
          size={20}
          color="#8B2635"
        />
      );
    }
    return <Pill size={20} color="#8B2635" />;
  };

  const selectTreatmentType = (type) => {
    setForm((prev) => ({ ...prev, type }));
    setShowTypeDropdown(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tedavilerim</Text>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'current' && styles.activeTab]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={styles.tabText}>Güncel</Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={styles.tabText}>Geçmiş</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {list.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              {activeTab === 'current'
                ? 'Güncel tedavi bulunmuyor.'
                : 'Geçmiş tedavi bulunmuyor.'}
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
                <View style={styles.cardTitleRow}>
                  {getIcon(item.type)}
                  <Text style={styles.name}>{item.name}</Text>
                </View>

                {activeTab === 'current' && (
                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => deleteTreatment(item.id)}
                  >
                    <Trash2 color="red" size={18} />
                  </Pressable>
                )}
              </View>

              <Text style={styles.sub}>
                {item.type || 'Tür yok'} • {item.frequency || 'Sıklık yok'}
              </Text>

              <Text style={styles.sub}>
                {item.startDate} → {item.endDate}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Pressable style={styles.fab} onPress={openAddModal}>
        <Plus color="white" />
      </Pressable>

      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {isEditMode ? 'Düzenle' : 'Yeni Tedavi'}
              </Text>
              <Pressable onPress={closeModal}>
                <X />
              </Pressable>
            </View>

            <TextInput
              placeholder="Tedavi adı"
              style={styles.input}
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
            />

            <View style={styles.pickerWrapper}>
              <Pressable
                style={styles.typeSelector}
                onPress={() => setShowTypeDropdown((prev) => !prev)}
              >
                <View style={styles.typeSelectorLeft}>
                  {form.type ? getIcon(form.type) : <Pill size={20} color="#8B2635" />}
                  <Text style={styles.typeSelectorText}>
                    {form.type || 'Tedavi türü'}
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
                      <View style={styles.dropdownItemLeft}>
                        {getIcon(type)}
                        <Text style={styles.dropdownItemText}>{type}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <TextInput
              placeholder="Sıklık"
              style={styles.input}
              value={form.frequency}
              onChangeText={(t) => setForm({ ...form, frequency: t })}
            />

            <View style={styles.dateRow}>
              <Pressable
                style={styles.dateBox}
                onPress={() => setShowStartPicker(true)}
              >
                <CalendarDays size={18} color="#8B2635" />
                <Text style={styles.dateText}>
                  {form.startDate || 'Başlangıç tarihi'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.dateBox}
                onPress={() => setShowEndPicker(true)}
              >
                <CalendarDays size={18} color="#8B2635" />
                <Text style={styles.dateText}>
                  {form.endDate || 'Bitiş tarihi'}
                </Text>
              </Pressable>
            </View>

            {showStartPicker && (
              <DateTimePicker
                value={formatDateForPicker(form.startDate)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  if (Platform.OS !== 'ios') {
                    setShowStartPicker(false);
                  }

                  if (date) {
                    setForm((prev) => ({
                      ...prev,
                      startDate: formatDate(date),
                    }));
                  }
                }}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                value={formatDateForPicker(form.endDate)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  if (Platform.OS !== 'ios') {
                    setShowEndPicker(false);
                  }

                  if (date) {
                    setForm((prev) => ({
                      ...prev,
                      endDate: formatDate(date),
                    }));
                  }
                }}
              />
            )}

            <Pressable style={styles.saveBtn} onPress={addOrUpdateTreatment}>
              <Text style={styles.saveBtnText}>Kaydet</Text>
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
  container: { flex: 1, backgroundColor: '#f6e9eb' },

  header: { padding: 28 },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B2635',
  },

  tabs: {
    flexDirection: 'row',
    padding: 10,
  },

  tab: {
    flex: 1,
    padding: 10,
    margin: 5,
    backgroundColor: '#f0b1bb',
    borderRadius: 10,
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: '#8B2635',
  },

  tabText: {
    color: 'white',
  },

  card: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 15,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  deleteButton: {
    marginLeft: 10,
  },

  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  sub: {
    fontSize: 12,
    color: '#54151f',
    marginTop: 5,
  },

  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#8B2635',
    padding: 15,
    borderRadius: 50,
  },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  sheet: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B2635',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    backgroundColor: '#fff',
  },

  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginVertical: 5,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
  },

  typeSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  typeSelectorText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#54151f',
  },

  dropdownList: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: '#f3f3f3',
    backgroundColor: '#fff',
  },

  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dropdownItemText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#54151f',
  },

  dateRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },

  dateBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },

  dateText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#54151f',
  },

  saveBtn: {
    backgroundColor: '#8B2635',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
  },

  saveBtnText: {
    color: 'white',
    fontWeight: '600',
  },

  emptyBox: {
    backgroundColor: 'white',
    margin: 10,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
  },

  emptyText: {
    color: '#54151f',
    fontSize: 13,
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