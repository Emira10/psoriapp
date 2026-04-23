import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Kayit() {
  const router = useRouter();
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
  const [modalType, setModalType] = useState(''); // 'terms' veya 'privacy'

  const handleKaydol = async () => {
  if (!formData.termsAccepted) {
    Alert.alert('Hata', 'Kayıt olmak için kullanım koşullarını kabul etmelisiniz.');
    return;
  }

  if (!formData.cinsiyet) {
    Alert.alert('Hata', 'Lütfen cinsiyet seçiniz.');
    return;
  }

  try {
    // ✅ CİNSİYETİ KAYDET
    await AsyncStorage.setItem('user_gender', formData.cinsiyet);

    Alert.alert('Başarılı', 'Kayıt işlemi tamamlandı!', [
      { text: 'Tamam', onPress: () => router.push('/login') },
    ]);
  } catch (error) {
    console.log(error);
    Alert.alert('Hata', 'Kayıt sırasında sorun oluştu.');
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Kaydol</Text>
        <Text style={styles.subtitle}>PsoriApp Dünyasına Katıl</Text>
      </View>

      {/* Form */}
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

        {/* Cinsiyet ve Doğum Tarihi */}
        <View style={styles.row}>
          <View style={[styles.input, {flex:1, justifyContent:'center', padding:0}]}>
            <Picker
              selectedValue={formData.cinsiyet}
              onValueChange={(itemValue) => setFormData({...formData, cinsiyet: itemValue})}
              style={{width: '100%', color: '#8B2635'}}
              itemStyle={{textAlign:'center', height:50}}
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
            display="default"
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
          onChangeText={(text) => setFormData({...formData, email: text})}
        />
        <TextInput
          placeholder="Şifre"
          secureTextEntry
          style={styles.input}
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

        <TouchableOpacity style={styles.button} onPress={handleKaydol}>
          <Text style={styles.buttonText}>KAYDOL</Text>
        </TouchableOpacity>

        <Text style={styles.signupText}>
          Zaten hesabın var mı?{' '}
          <Text style={styles.signupLink} onPress={() => router.push('/login')}>
            Giriş Yap
          </Text>
        </Text>
      </View>

      {/* Modal */}
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
                  : "1. Kullanıcı verileri sadece uygulama içinde kullanılır.\n2. Üçüncü kişilerle paylaşılmaz.\n3. Kullanıcı istediğinde verilerini silebilir.\n4. Bu uygulama eğitim amaçlıdır."}
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


  input: { backgroundColor:'white',
     borderColor:'#8B2635',
      borderWidth:1.5, borderRadius:25, 
      padding:12, 
      marginBottom:15, 
      textAlign:'center', 
      color:'#8B2635' },

  row: { 
    flexDirection:'row',
     gap:10 },

  button: { 
    backgroundColor:'#8B2635', 
    padding:15, 
    borderRadius:15, 
    alignItems:'center', 
    marginTop:10 },

  buttonText:
   { color:'white', 
    fontWeight:'bold' },

  signupText: {
     textAlign:'center',
      marginTop:20, 
      color:'#8B2635', 
      fontSize:12 },

  signupLink: { fontWeight:'bold', color:'#8B2635', textDecorationLine:'underline' },
  termsContainer: { flexDirection:'row', alignItems: 'flex-start', marginVertical: 10 },
  textWrapper: { flex: 1, marginLeft: 8 },
  termsText: { color: '#8B2635', fontSize: 12, lineHeight: 18 },
  linkText: { fontWeight: 'bold', textDecorationLine: 'underline', color: '#8B2635' },
  modalOverlay: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.3)', justifyContent:'center', alignItems:'center' },
  modalBox: { width:'90%', maxHeight:'70%', backgroundColor:'#FFF5F6', borderRadius:20, padding:20 },
  modalClose: { position:'absolute', top:10, right:10 },
  modalTitle: { fontSize:20, fontWeight:'bold', color:'#8B2635', marginBottom:10, textAlign:'center' },
  modalContent: { fontSize:14, color:'#8B2635', lineHeight:22 }
});