import React, { useState, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  SafeAreaView, ScrollView, Alert, Image, Animated, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false); // Hata durumu için state
  const router = useRouter();

  // Animasyon için değer tanımlıyoruz
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  // Sallanma fonksiyonu
  const startShake = () => {
    setError(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = () => {
    if (email === 'admin@test' && password === '1') {
      setError(false);
      router.push('/home');
    } else {
      startShake();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          
          <View style={styles.header}>
            <View style={styles.logoOuter}>
              <Image
                source={require('../../assets/images/logo.jpeg')}
                style={styles.logoInner}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>PSORIAPP</Text>
          </View>

          <View style={styles.form}>
            {/* Animasyonlu View */}
            <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Email"
                value={email}
                onChangeText={setEmail} // sadece setEmail
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Şifre"
                secureTextEntry
                value={password}
                onChangeText={setPassword} // sadece setPassword
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

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>GİRİŞ YAP</Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>
                Hesabınız mı yok?{' '}
                <Text style={styles.signupLink} onPress={() => router.push('/register')}>
                  Kaydol
                </Text>
              </Text>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F6' },
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
  borderRadius: 48,      // tam daire
  overflow: 'hidden',     // bu çok önemli!
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 12,
  backgroundColor: 'white', // istersen arka plan
},

logoInner: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',    
},
  title: { color: 'white', fontSize: 32, fontWeight: 'bold', letterSpacing: 2 },
  form: { flex: 1, paddingHorizontal: 20, paddingTop: 30 },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: '#8B2635',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10, // dikey padding eklendi
    marginBottom: 19,
    backgroundColor: 'white',
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
  forgotButton: { alignSelf: 'flex-end', marginBottom: 20
   },
  forgotText: { color: '#8B2635', fontSize: 12 },
  loginButton: {
    height: 50,
    backgroundColor: '#8B2635',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  signupContainer: { alignItems: 'center', marginBottom: 20 },
  signupText: { fontSize: 12, color: 'rgba(139,38,53,0.8)' },
  signupLink: { fontWeight: 'bold' },
});