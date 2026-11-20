// PDF p.65 — Step 6 of 6: Terms and conditions (bilingual)
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Screen, Header, Button, CheckRow, H3, Muted } from '../../components/ui';
import { onboardingApi } from '../../api/endpoints';
import { useAction } from '../../hooks/useApi';
import { useAuth } from '../../store/auth';
import { colors } from '../../theme';
import type { ScreenProps } from '../../navigation/types';

// Copy supplied in the AOLO PDF. Ideally serve from GET /legal/terms so
// AOLO can update without an app release.
export const TERMS: { en: string; hi: string; items: { hi: string; en: string }[] }[] = [
  {
    en: 'Documents and legal',
    hi: 'दस्तावेज़ और कानूनी',
    items: [
      {
        hi: 'फ्लीट ओनर/ड्राइवर घोषित करता है कि सभी दस्तावेज़ असली और वैध हैं। फर्जी दस्तावेज़ = तत्काल निष्कासन + FIR।',
        en: 'The fleet owner or driver declares that all documents are genuine and valid. Fake documents mean immediate removal and an FIR.',
      },
      {
        hi: 'AOLO Cabs किसी भी समय कमीशन, नियम और दंड नीति बदल सकता है। बदलाव WhatsApp/App से सूचित होंगे।',
        en: 'AOLO Cabs may change commission, rules and penalty policy at any time. Changes will be told on WhatsApp or the app.',
      },
      {
        hi: 'वाहन हर समय व्यावसायिक उपयोग के लिए वैध होना चाहिए। दस्तावेज़ समाप्ति पर तत्काल प्लेटफ़ॉर्म निलंबन।',
        en: 'The vehicle must be valid for commercial use at all times. If documents expire, the platform account is suspended at once.',
      },
      {
        hi: 'AOLO Cabs केवल बुकिंग/डिस्पैच प्लेटफ़ॉर्म है। सड़क सुरक्षा और कानूनी अनुपालन की जिम्मेदारी पूरी तरह फ्लीट ओनर/ड्राइवर की है।',
        en: 'AOLO Cabs is only a booking and dispatch platform. Road safety and legal compliance are fully the responsibility of the fleet owner or driver.',
      },
    ],
  },
  {
    en: 'Customers and platform',
    hi: 'ग्राहक और प्लेटफ़ॉर्म',
    items: [
      {
        hi: 'ड्राइवर प्लेटफ़ॉर्म से बाहर किसी AOLO ग्राहक से सीधे निजी डील नहीं करेगा। निजी बुकिंग पूर्णतः प्रतिबंधित है।',
        en: 'The driver will not make any direct private deal with an AOLO customer outside the platform. Private bookings are completely banned.',
      },
      {
        hi: 'ग्राहक का नंबर, पता, OTP, डेटा किसी को भी साझा नहीं होगा। उल्लंघन = ब्लॉक + IT Act 2000 धारा 43A के तहत कानूनी कार्रवाई।',
        en: 'Customer number, address, OTP and data will not be shared with anyone. Breaking this means a block and legal action under IT Act 2000 Section 43A.',
      },
      {
        hi: 'ड्राइवर ग्राहक को “अगली बार सीधे कॉल करना” नहीं कहेगा। AOLO Cabs को बायपास करना गंभीर अनुबंध उल्लंघन है।',
        en: 'The driver will not tell a customer to call directly next time. Bypassing AOLO Cabs is a serious breach of the agreement.',
      },
      {
        hi: 'ग्राहकों के साथ विनम्र व्यवहार अनिवार्य। गाली, धमकी, बदसलूकी या अतिरिक्त पैसों की मांग बिल्कुल नहीं।',
        en: 'Polite behaviour with customers is a must. No abuse, threats, rudeness or demand for extra money.',
      },
      {
        hi: 'केवल AOLO स्वीकृत शुल्क ही बुकिंग स्लिप अनुसार लिए जा सकते हैं। अनधिकृत वसूली सख्त मना है।',
        en: 'Only AOLO approved charges, as per the booking slip, can be taken. Unauthorised collection is strictly not allowed.',
      },
    ],
  },
  {
    en: 'Driver and vehicle',
    hi: 'ड्राइवर और वाहन',
    items: [
      {
        hi: 'ड्यूटी के समय वैध DL (कमर्शियल), परमिट/बैज और पहचान पत्र अनिवार्य। बिना DL ड्राइविंग = MV Act धारा 3/181 अपराध।',
        en: 'A valid commercial DL, permit or badge and ID card are a must on duty. Driving without a DL is an offence under MV Act Section 3/181.',
      },
      {
        hi: 'वाहन साफ, AC कार्यरत (AC बुकिंग पर), स्टेपनी, जैक, फर्स्ट एड किट, अग्निशामक यंत्र हर समय उपलब्ध होना चाहिए।',
        en: 'The vehicle must be clean, with working AC (on AC bookings), and a spare wheel, jack, first aid kit and fire extinguisher always available.',
      },
    ],
  },
  {
    en: 'Safety and discipline',
    hi: 'सुरक्षा और अनुशासन',
    items: [
      {
        hi: 'शराब/नशे में ड्राइविंग जीरो-टॉलरेंस। तत्काल स्थायी ब्लैकलिस्ट + MV Act धारा 185 के तहत FIR (₹10,000 जुर्माना + 6 माह कारावास)।',
        en: 'Zero tolerance for drunk or drugged driving. Permanent blacklist at once, plus an FIR under MV Act Section 185 (fine of ₹10,000 and 6 months in jail).',
      },
      {
        hi: 'ओवरस्पीडिंग, रैश ड्राइविंग, मोबाइल पर बात, बिना सीट बेल्ट — सब MV Act के तहत प्रतिबंधित। ट्रैफिक चालान = 100% ड्राइवर की जिम्मेदारी।',
        en: 'Overspeeding, rash driving, talking on the phone and driving without a seat belt are all banned under the MV Act. Traffic challans are 100% the driver’s responsibility.',
      },
      {
        hi: 'क्षमता से अधिक सवारी नहीं। उल्लंघन = MV Act धारा 66/93 अपराध + तत्काल 3 माह प्लेटफ़ॉर्म निलंबन।',
        en: 'No passengers beyond capacity. Breaking this is an offence under MV Act Section 66/93 and means a 3 month platform suspension at once.',
      },
      {
        hi: 'ड्राइवर समय पर रिपोर्ट करेगा। AOLO अनुमति बिना दूसरा ड्राइवर नहीं भेजेगा। वाहन में अवैध वस्तु, हथियार या नशा नहीं होगा।',
        en: 'The driver will report on time. No other driver will be sent without AOLO permission. No illegal items, weapons or intoxicants in the vehicle.',
      },
    ],
  },
];

export default function TermsScreen({ navigation }: ScreenProps<'Terms'>) {
  const [agree, setAgree] = useState(false);
  const setDriver = useAuth((s) => s.setDriver);
  const api = useAction(onboardingApi.submit);

  const submit = async () => {
    try {
      const { application_no } = await api.run();
      // Root navigator swaps to the "submitted" stack when status changes.
      setDriver({ onboarding_status: 'submitted', application_no });
    } catch {
      /* shown */
    }
  };

  return (
    <Screen
      footer={
        <>
          <CheckRow label="I have read and agree to all terms" checked={agree} onPress={() => setAgree(!agree)} />
          <Button title="Accept and submit" disabled={!agree} onPress={submit} loading={api.loading} />
        </>
      }
    >
      <Header
        step={6}
        title="Terms and conditions"
        subtitle="नियम एवं शर्तें. Please read all of it before you sign."
      />
      {TERMS.map((sec) => (
        <View key={sec.en} style={{ marginBottom: 16 }}>
          <H3>{sec.en}</H3>
          <Muted>{sec.hi}</Muted>
          {sec.items.map((it, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, lineHeight: 19 }}>{it.hi}</Text>
                <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textMuted, marginTop: 4 }}>{it.en}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
      <Pressable onPress={() => navigation.navigate('PenaltyStructure')}>
        <Text style={{ fontWeight: '700', textDecorationLine: 'underline' }}>See penalty structure (दंड संरचना) ›</Text>
      </Pressable>
    </Screen>
  );
}
