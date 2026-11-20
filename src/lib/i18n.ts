// Hindi / English without an extra library: a small zustand store + dictionaries.
// The choice is saved with MMKV. Screen copy is in English in the screens and
// should be moved here as AOLO finalises Hindi wording.
import { create } from 'zustand';
import { prefs } from './storage';

const en = {
  'tabs.home': 'Home',
  'tabs.earnings': 'Earnings',
  'tabs.wallet': 'Wallet',
  'tabs.trips': 'Trips',
  'menu.home': 'Home',
  'menu.earnings': 'Earnings',
  'menu.wallet': 'Wallet',
  'menu.history': 'Ride History',
  'menu.bookings': 'Bookings',
  'menu.rideTypes': 'Ride types',
  'menu.documents': 'Documents',
  'menu.support': 'Support',
  'menu.language': 'Language: Hindi / English',
  'menu.settingsLegal': 'Settings & legal',
  'menu.penalty': 'Penalty',
  'menu.popups': 'Booking popups',
  'menu.sla': 'SLA Agreement',
  'menu.privacy': 'Privacy Policy',
  'menu.contact': 'Contact Us',
  'menu.session': 'Session',
  'menu.logout': 'Logout',
  'menu.delete': 'Delete account',
  'menu.editProfile': 'Edit profile',
  'home.offline': 'You are offline',
  'home.tapGo': 'Tap GO to start receiving rides',
  'home.looking': 'Looking for rides...',
  'home.ridesToday': 'Rides today',
  'home.acceptance': 'Acceptance',
  'home.rating': 'Rating',
  'home.goOfflineEarly': 'Go offline early',
  'net.offline': 'No internet. Trips and location are saved and will sync when you are back online.',
};
type Key = keyof typeof en;

const hi: Record<Key, string> = {
  'tabs.home': 'होम',
  'tabs.earnings': 'कमाई',
  'tabs.wallet': 'वॉलेट',
  'tabs.trips': 'ट्रिप्स',
  'menu.home': 'होम',
  'menu.earnings': 'कमाई',
  'menu.wallet': 'वॉलेट',
  'menu.history': 'राइड हिस्ट्री',
  'menu.bookings': 'बुकिंग',
  'menu.rideTypes': 'राइड के प्रकार',
  'menu.documents': 'दस्तावेज़',
  'menu.support': 'सहायता',
  'menu.language': 'भाषा: हिंदी / English',
  'menu.settingsLegal': 'सेटिंग्स और कानूनी',
  'menu.penalty': 'जुर्माना',
  'menu.popups': 'बुकिंग पॉपअप',
  'menu.sla': 'SLA अनुबंध',
  'menu.privacy': 'गोपनीयता नीति',
  'menu.contact': 'संपर्क करें',
  'menu.session': 'सेशन',
  'menu.logout': 'लॉग आउट',
  'menu.delete': 'अकाउंट हटाएं',
  'menu.editProfile': 'प्रोफ़ाइल बदलें',
  'home.offline': 'आप ऑफ़लाइन हैं',
  'home.tapGo': 'राइड पाने के लिए GO दबाएं',
  'home.looking': 'राइड खोज रहे हैं...',
  'home.ridesToday': 'आज की राइड',
  'home.acceptance': 'स्वीकृति',
  'home.rating': 'रेटिंग',
  'home.goOfflineEarly': 'जल्दी ऑफ़लाइन जाएं',
  'net.offline': 'इंटरनेट नहीं है। ट्रिप और लोकेशन सेव हैं, इंटरनेट आने पर भेज दी जाएंगी।',
};

const dict = { en, hi };

interface LangState {
  lang: 'en' | 'hi';
  setLang: (l: 'en' | 'hi') => void;
}

export const useLang = create<LangState>((set) => ({
  lang: prefs.language(),
  setLang: (lang) => {
    prefs.setLanguage(lang);
    set({ lang });
  },
}));

export const translate = (key: Key) => dict[useLang.getState().lang][key] ?? en[key];

/** Hook: re-renders when the language changes. */
export function useT() {
  const lang = useLang((s) => s.lang);
  return (key: Key) => dict[lang][key] ?? en[key];
}
