import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Home,
  Activity,
  Pill,
  User,
  Flame,
  CheckCircle2,
  Circle,
  Info,
  ChevronRight,
  Bell,
  Plus,
  BarChart3,
} from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();

  const [greeting, setGreeting] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [streak, setStreak] = useState(5);

  const [tasks, setTasks] = useState([
    { id: 1, text: 'Nemlendirici sür', completed: false },
    { id: 2, text: 'Fototerapi seansına git', completed: true },
    { id: 3, text: '2 Litre su tüket', completed: false },
    { id: 4, text: 'D vitamini takviyesi al', completed: false },
  ]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Günaydın');
    else if (hour < 18) setGreeting('İyi Günler');
    else setGreeting('İyi Akşamlar');
  }, []);

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const moods = [
    { id: 'happy', icon: '✨', label: 'Harika' },
    { id: 'normal', icon: '😊', label: 'İyi' },
    { id: 'sensitive', icon: '😟', label: 'Hassas' },
    { id: 'itchy', icon: '😖', label: 'Kaşıntılı' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}, Ganime</Text>
            <Text style={styles.title}>Cildin nasıl? ✨</Text>
          </View>

          <TouchableOpacity style={styles.iconButton}>
            <Bell size={18} color="#8B2635" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.streakCard} activeOpacity={0.9}>
          <View style={styles.streakLeft}>
            <View style={styles.flameBox}>
              <Flame size={20} color="#fff" fill="#fff" />
            </View>

            <View>
              <Text style={styles.streakSmall}>SERÜVEN DEVAM EDİYOR</Text>
              <Text style={styles.streakTitle}>{streak} Gündür Takiptesin!</Text>
            </View>
          </View>

          <ChevronRight size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        <View style={styles.moodRow}>
          {moods.map((m) => {
            const isSelected = selectedMood === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.moodCard, isSelected && styles.moodCardActive]}
                onPress={() => setSelectedMood(m.id)}
                activeOpacity={0.85}
              >
                <Text style={styles.moodEmoji}>{m.icon}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    isSelected && styles.moodLabelActive,
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Günün Görevleri</Text>
          <TouchableOpacity>
            <Text style={styles.editText}>Düzenle</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.taskCard}>
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskRow}
              onPress={() => toggleTask(task.id)}
              activeOpacity={0.8}
            >
              {task.completed ? (
                <CheckCircle2 size={22} color="#8B2635" />
              ) : (
                <Circle size={22} color="#b9a7ab" />
              )}

              <Text
                style={[
                  styles.taskText,
                  task.completed && styles.taskTextCompleted,
                ]}
              >
                {task.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIconBox}>
            <Info size={18} color="#8B2635" />
          </View>

          <View style={styles.infoTextBox}>
            <Text style={styles.infoTitle}>Biliyor muydun?</Text>
            <Text style={styles.infoText}>
              Omega-3 takviyesi cilt bariyerini güçlendirir. Bugün beslenmene
              ceviz ekleyebilirsin!
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
              <Pressable style={styles.navItem} onPress={() => router.push('/home')}>
                        <Home size={22} color="#8B2635" />
                        <Text style={styles.navText}>Ana Sayfa</Text>
                      </Pressable>
      
              <Pressable style={styles.navItem} onPress={() => router.push('/symptoms')}>
                <Activity size={22} color="#b9a7ab" />
                <Text style={styles.navText}>Semptom Takibi</Text>
              </Pressable>
      
              <Pressable style={styles.navItem}>
                <Pill size={22} color="#b9a7ab" />
                <Text style={[styles.navText, { color: '#b9a7ab' }]}>Tedaviler</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F6',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 120,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  // 🔥 DAHA SOFT YAPTIK (Tedaviler ile uyumlu)
  greeting: {
    color: '#8B2635',
    fontSize: 12,
    marginBottom: 4,
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B2635',
  },
  iconButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  streakCard: {
    backgroundColor: '#8B2635',
    borderRadius: 26,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flameBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 14,
    marginRight: 12,
  },
    streakSmall: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    marginBottom: 4,
  },

  streakTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 8,
  },
  moodCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  moodCardActive: {
    backgroundColor: '#8B2635',
    transform: [{ scale: 1.03 }],
  },
  moodEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: 10,
    color: '#b9a7ab',
  },

  moodLabelActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f1f1f',
  },
    editText: {
    color: '#8B2635',
    fontSize: 12,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fdecef',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
  },
  taskText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#444',
    flex: 1,
  },

  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#b9a7ab',
    fontStyle: 'italic',
  },

  infoTitle: {
    color: '#8B2635',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  infoText: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#8B2635',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoIconBox: {
    backgroundColor: '#FFF5F6',
    padding: 10,
    borderRadius: 14,
    marginRight: 12,
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

  centerButtonWrap: {
    position: 'relative',
    top: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    backgroundColor: '#8B2635',
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B2635',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
    navText: {
    fontSize: 10,
    marginTop: 4,
    color: '#b9a7ab',
    textAlign: 'center',
  },
  
});