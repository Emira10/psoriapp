import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  SafeAreaView,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  ActivityIndicator
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

// تعريف مباشر داخل الملف لحل مشكلة المسارات فوراً
const supabaseUrl = 'https://paoonvobclstwdmvefwt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhaW9vbnZvYmNsc3R3ZG12ZWZ3dCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzE0MTY4NDUyLCJleHAiOjIwMjk3NDQ0NTJ9.8M-f67J1r9-4k9U1Y-oR7W7-R-z-x-z-x-z-x-z-x'; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // إرسال رابط إعادة التعيين (أو الكود) عبر سوبابيز
  const handleSendCode = async () => {
    if (!email) {
      Alert.alert('Hata', 'Lütfen e-mail girin');
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      Alert.alert('Hata', 'E-mail gönderilemedi: ' + error.message);
    } else {
      Alert.alert('Başarılı', 'Şifre sıفردlama bağlantısı e-posta adresinize gönderildi.');
      setStep(2); 
    }
  };

  // التحقق من الكود (إذا كنتِ تستخدمين OTP)
  const handleVerifyCode = async () => {
    if (!code) {
        Alert.alert('Hata', 'Lütfen kodu girin');
        return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery',
    });
    setLoading(false);

    if (error) {
        Alert.alert('Hata', 'Kod yanlış أو geçersiz!');
    } else {
        setStep(3);
    }
  };

  // تحديث كلمة المرور فعلياً في قاعدة البيانات
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen yeni şifreleri girin');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
        Alert.alert('Hata', 'Şifre güncellenemedi: ' + error.message);
    } else {
        Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi', [
            { text: 'OK', onPress: () => router.replace('/') }
        ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
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

        <Text style={styles.stepTitle}>
          {step === 1
            ? 'Şifremi Unuttum'
            : step === 2
            ? 'Kod Doğrulama'
            : 'Şifre Değiştir'}
        </Text>

        <View style={styles.form}>
          {step === 1 && (
            <>
              <TextInput
                placeholder="E-mail"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.button} onPress={handleSendCode} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>KOD GÖNDER</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.infoText}>E-postanıza gelen kodu girin</Text>
              <TextInput
                placeholder="Kod"
                style={styles.input}
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.button} onPress={handleVerifyCode} disabled={loading}>
                 {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>DOĞRULA</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 3 && (
            <>
              <TextInput
                placeholder="Yeni Şifre"
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <TextInput
                placeholder="Yeni Şifre Tekrar"
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loading}>
                 {loading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>ŞİFRE DEĞİŞTİR</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5F6' },
  header: { height: 250, backgroundColor: '#8B2635', justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 80, borderBottomRightRadius: 80 },
  content: { paddingBottom: 40, justifyContent: 'center' },
  title: { color: 'white', fontSize: 32, fontWeight: 'bold', letterSpacing: 2 },
  logoOuter: { width: 96, height: 96, borderRadius: 48, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginBottom: 12, backgroundColor: 'white' },
  logoInner: { width: '100%', height: '100%', resizeMode: 'cover' },
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: '#8B2635', textAlign: 'center', marginVertical: 20 },
  form: { padding: 20, marginTop: 10 },
  input: { backgroundColor: 'white', borderColor: '#8B2635', borderWidth: 1.5, borderRadius: 25, padding: 12, marginBottom: 15, textAlign: 'center', color: '#8B2635' },
  button: { backgroundColor: '#8B2635', padding: 15, borderRadius: 25, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  infoText: { textAlign: 'center', marginBottom: 10, color: '#8B2635' }
});