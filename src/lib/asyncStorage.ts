// Mobil uygulamadaki AsyncStorage ile aynı arayüz, tarayıcının localStorage'ı
// üzerinde. Böylece mobildeki modüller web'de değişmeden kullanılabiliyor.
// Tarayıcı depolamayı engellerse (gizli sekme vb.) sessizce boş döner.
const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
    } catch {
      // yok say
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    } catch {
      // yok say
    }
  },
};
export default AsyncStorage;
