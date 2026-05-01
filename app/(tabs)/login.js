import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Bilgisayarda web için:
// const API_URL = 'http://localhost:5000';

// Telefonda Expo Go için:
const API_URL = 'http://10.248.85.91:5000';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const startShake = () => {
    setError(true);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !sifre.trim()) {
      Alert.alert('Hata', 'Email ve şifre giriniz.');
      startShake();
      return;
    }

    try {
      setLoading(true);
      setError(false);

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: email.trim().toLowerCase(),
  password: sifre.trim(),
});

if (authError || !authData.session) {
  Alert.alert('Giriş Başarısız', authError?.message || 'Supabase oturumu oluşturulamadı.');
  startShake();
  return;
}

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          sifre: sifre.trim(),
        }),
      });

      const text = await response.text();

      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        Alert.alert('Hata', 'Backend JSON formatında cevap dönmedi.');
        startShake();
        return;
      }

      console.log('LOGIN RESPONSE:', data);

      if (!response.ok || data.success === false) {
        Alert.alert(
          'Giriş Başarısız',
          data.message || data.error || 'Email veya şifre hatalı.'
        );
        startShake();
        return;
      }

      const backendUser =
        data.kullanici ||
        data.user ||
        data.data?.kullanici ||
        data.data?.user;

      if (!backendUser || !backendUser.kullanici_id) {
        Alert.alert('Giriş Hatası', 'Backend kullanici_id göndermedi.');
        console.log('Eksik kullanıcı verisi:', data);
        startShake();
        return;
      }

      const loggedUser = {
        kullanici_id: backendUser.kullanici_id,
        ad: backendUser.ad || '',
        soyad: backendUser.soyad || '',
        email: backendUser.email || email.trim().toLowerCase(),
      };

      await AsyncStorage.setItem('token', data.token || '');
      await AsyncStorage.setItem('user', JSON.stringify(loggedUser));
      await AsyncStorage.setItem('kullanici', JSON.stringify(loggedUser));
      await AsyncStorage.setItem('kullanici_id', String(loggedUser.kullanici_id));

      const savedUser = await AsyncStorage.getItem('user');
      console.log('KAYDEDİLEN USER:', savedUser);

      router.replace('/home');
    } catch (error) {
      console.log('Login hata:', error);

      Alert.alert(
        'Bağlantı Hatası',
        error.message || 'Backend çalışıyor mu kontrol et.'
      );

      startShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoOuter}>
              <Image
                source={require('../../assets/images/logo.jpeg')}
                style={styles.logoInner}
              />
            </View>

            <Text style={styles.title}>PSORIAPP</Text>
          </View>

          <View style={styles.form}>
            <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Email"
                placeholderTextColor="rgba(139,38,53,0.6)"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(false);
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Şifre"
                placeholderTextColor="rgba(139,38,53,0.6)"
                secureTextEntry
                value={sifre}
                onChangeText={(text) => {
                  setSifre(text);
                  setError(false);
                }}
              />
            </Animated.View>

            {error && (
              <Text style={styles.errorText}>
                E-posta veya şifre hatalı, lütfen tekrar deneyin.
              </Text>
            )}

            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => router.push('/forgot')}
            >
              <Text style={styles.forgotText}>Şifremi Unuttum</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, loading && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'GİRİLİYOR...' : 'GİRİŞ YAP'}
              </Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                Hesabınız mı yok?{' '}
                <Text
                  style={styles.signupLink}
                  onPress={() => router.push('/register')}
                >
                  Kaydol
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5F6',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    height: 250,
    backgroundColor: '#8B2635',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
  },
  logoOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'white',
  },
  logoInner: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#8B2635',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 19,
    backgroundColor: 'white',
    color: '#8B2635',
  },
  inputError: {
    borderColor: '#E74C3C',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#8B2635',
    fontSize: 12,
  },
  loginButton: {
    height: 50,
    backgroundColor: '#8B2635',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  signupContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  signupText: {
    fontSize: 12,
    color: 'rgba(139,38,53,0.8)',
  },
  signupLink: {
    fontWeight: 'bold',
    color: '#8B2635',
    textDecorationLine: 'underline',
  },
});