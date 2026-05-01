
import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, Platform, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabaseClient'; 

export default function Kayit() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    isim: '',
    soyisim: '',
    cinsiyet: '',
    dogumTarihi: new Date(),
    email: '',
    sifre: '',
    termsAccepted: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState(''); 

  const handleKaydol = async () => {
    if (!formData.termsAccepted) {
      Platform.OS === 'web' ? window.alert('❌ Lütfen kullanım koşullarını kabul edin.') : Alert.alert('Hata', 'Lütfen kullanım koşullarını kabul edin.');
      return;
    }
    if (!formData.email || !formData.sifre || !formData.isim) {
      Platform.OS === 'web' ? window.alert('❌ Lütfen tüm zorunlu alanları doldurun.') : Alert.alert('Hata', 'Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.sifre,
      });

      if (authError) throw authError;

      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            first_name: formData.isim,
            last_name: formData.soyisim,
            gender: formData.cinsiyet,
            birth_date: formData.dogumTarihi.toISOString().split('T')[0],
          }, { onConflict: 'id' });

        if (profileError) throw profileError;

        Platform.OS === 'web' ? window.alert('✅ Kaydınız başarıyla tamamlandı!') : Alert.alert('Başarılı', 'Kaydınız başarıyla tamamlandı!');
        router.push('/home');
      }
    } catch (error) {
      console.log("Registration Error:", error);
      Platform.OS === 'web' ? window.alert('❌ ' + (error.message || 'Kayıt sırasında bir sorun oluştu.')) : Alert.alert('Hata', error.message || 'Kayıt sırasında bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kaydol</Text>
        <Text style={styles.subtitle}>PsoriApp Dünyasına Katıl</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="İsim"
          style={styles.input}
          value={formData.isim}
          onChangeText={(text) => setFormData({...formData, isim: text})}
        />
        <TextInput
          placeholder="Soyisim"
          style={styles.input}
          value={formData.soyisim}
          onChangeText={(text) => setFormData({...formData, soyisim: text})}
        />

        <View style={styles.row}>
          <View style={[styles.input, {flex:1, justifyContent:'center', padding:0}]}>
            <Picker
              selectedValue={formData.cinsiyet}
              onValueChange={(itemValue) => setFormData({...formData, cinsiyet: itemValue})}
              style={{width: '100%', color: '#8B2635'}}
            >
              <Picker.Item label="Cinsiyet" value="" />
              <Picker.Item label="Kadın" value="female" />
              <Picker.Item label="Erkek" value="male" />   
            </Picker>
          </View>

          <TouchableOpacity
            style={[styles.input, {flex:1, justifyContent:'center'}]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{color:'#8B2635', textAlign:'center'}}>
              {formData.dogumTarihi.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={formData.dogumTarihi}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setFormData({...formData, dogumTarihi: selectedDate});
            }}
          />
        )}

        <TextInput
          placeholder="E-mail"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={formData.email}
          onChangeText={(text) => setFormData({...formData, email: text})}
        />
        <TextInput
          placeholder="Şifre"
          secureTextEntry
          style={styles.input}
          value={formData.sifre}
          onChangeText={(text) => setFormData({...formData, sifre: text})}
        />

        <View style={styles.termsContainer}>
          <Switch
            value={formData.termsAccepted}
            onValueChange={(value) => setFormData({...formData, termsAccepted: value})}
            trackColor={{ false: "#ccc", true: "#8B2635" }}
            thumbColor="white"
          />
          <View style={styles.textWrapper}>
            <Text style={styles.termsText}>
              Kayıt olarak{' '}
              <Text style={styles.linkText} onPress={() => openModal('terms')}>
                Kullanım Koşulları
              </Text>{' '}
              ve{' '}
              <Text style={styles.linkText} onPress={() => openModal('privacy')}>
                Gizlilik Politikası
              </Text>{' '}
              kabul etmiş olursunuz.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleKaydol} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>KAYDOL</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.signupText}>
          Zaten hesabın var mı?{' '}
          <Text style={styles.signupLink} onPress={() => router.push('/login')}>
            Giriş Yap
          </Text>
        </Text>
      </View>

      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
              <Text style={{fontSize:18, fontWeight:'bold'}}>✕</Text>
            </TouchableOpacity>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {modalType === 'terms' ? 'Kullanım Koşulları' : 'Gizlilik Politikası'}
              </Text>
              <Text style={styles.modalContent}>
                {modalType === 'terms'
                  ? "1. Bu uygulama eğitim amaçlıdır.\n2. Kullanıcı bilgileri güvenli şekilde saklanır.\n3. Uygulama tıbbi tavsiye yerine geçmez.\n4. Kullanım sırasında oluşabilecek durumlardan kullanıcı sorumludur."
                  : "1. Kullanıcı verileri sadece uygulama içinde kullanılır.\n2. Üçüncü kişilerle paylaşılmaz.\n3. Kullanıcı istediğinde verilerini silebilir."}
              </Text>
            </ScrollView>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#FFF5F6' },
  header: { backgroundColor:'#8B2635', padding:60, alignItems:'center', borderBottomLeftRadius:100, borderBottomRightRadius:100 },
  title: { color:'white', fontSize:28, fontWeight:'bold' },
  subtitle: { color:'#FAD2D8', marginTop:5 },
  form: { padding:20, marginTop: 40 },
  input: { 
    backgroundColor:'white',
    borderColor:'#8B2635',
    borderWidth:1.5, 
    borderRadius:25, 
    padding:12, 
    marginBottom:15, 
    textAlign:'center', 
    color:'#8B2635' 
  },
  row: { flexDirection:'row', gap:10 },
  button: { 
    backgroundColor:'#8B2635', 
    padding:15, 
    borderRadius:15, 
    alignItems:'center', 
    marginTop:10 
  },
  buttonText: { color:'white', fontWeight:'bold' },
  signupText: { textAlign:'center', marginTop:20, color:'#8B2635', fontSize:12 },
  signupLink: { fontWeight:'bold', color:'#8B2635', textDecorationLine:'underline' },
  termsContainer: { flexDirection:'row', alignItems: 'flex-start', marginVertical: 10 },
  textWrapper: { flex: 1, marginLeft: 8 },
  termsText: { color: '#8B2635', fontSize: 12, lineHeight: 18 },
  linkText: { fontWeight: 'bold', textDecorationLine: 'underline', color: '#8B2635' },
  modalOverlay: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.3)', justifyContent:'center', alignItems:'center', zIndex: 1000 },
  modalBox: { width:'90%', maxHeight:'70%', backgroundColor:'#FFF5F6', borderRadius:20, padding:20 },
  modalClose: { position:'absolute', top:10, right:10 },
  modalTitle: { fontSize:20, fontWeight:'bold', color:'#8B2635', marginBottom:10, textAlign:'center' },
  modalContent: { fontSize:14, color:'#8B2635', lineHeight:22 }
});