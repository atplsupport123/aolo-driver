// Shared UI kit matching the AOLO Driver PDF.
import React, { ReactNode, useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { ArrowLeft, ChevronRight, LucideIcon } from 'lucide-react-native';
import { colors, font, radius, spacing } from '../theme';

// react-native-keyboard-controller keeps inputs visible above the keyboard.
// Falls back to React Native's own components in Expo Go if the module is missing.
let KScroll: any = ScrollView;
let KAvoid: any = KeyboardAvoidingView;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const kc = require('react-native-keyboard-controller');
  KScroll = kc.KeyboardAwareScrollView ?? ScrollView;
  KAvoid = kc.KeyboardAvoidingView ?? KeyboardAvoidingView;
} catch {
  /* Expo Go */
}

// ───────────────── Layout ─────────────────

export function Screen({
  children,
  footer,
  scroll = true,
  dark = false,
  padded = true,
  style,
  edges,
}: {
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  dark?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  const bg = dark ? colors.dark : colors.bg;
  const body = scroll ? (
    <KScroll
      contentContainerStyle={[padded && s.pad, { paddingBottom: 24 }, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bottomOffset={24}
    >
      {children}
    </KScroll>
  ) : (
    <View style={[{ flex: 1 }, padded && s.pad, style]}>{children}</View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={edges ?? ['top', 'bottom']}>
      <KAvoid style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {body}
        {footer ? <View style={[s.footer, { backgroundColor: bg }]}>{footer}</View> : null}
      </KAvoid>
    </SafeAreaView>
  );
}

export function Header({
  title,
  subtitle,
  back = true,
  backLabel = 'Back',
  step,
  totalSteps = 6,
  right,
  onBack,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  backLabel?: string;
  step?: number;
  totalSteps?: number;
  right?: ReactNode;
  onBack?: () => void;
}) {
  const nav = useNavigation();
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {(back || step || right) && (
        <View style={s.headerRow}>
          {back ? (
            <Pressable hitSlop={12} onPress={onBack ?? (() => nav.goBack())}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ArrowLeft size={16} color={colors.text} />
                <Text style={s.back}>{backLabel}</Text>
              </View>
            </Pressable>
          ) : (
            <View />
          )}
          {step ? (
            <Text style={font.small}>
              Step {step} of {totalSteps}
            </Text>
          ) : (
            right
          )}
        </View>
      )}
      {step ? (
        <View style={s.steps}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View key={i} style={[s.stepBar, { backgroundColor: i < step ? colors.primary : colors.surfaceAlt }]} />
          ))}
        </View>
      ) : null}
      {title ? <Text style={[font.h1, { marginTop: spacing.sm }]}>{title}</Text> : null}
      {subtitle ? <Text style={[font.small, { marginTop: 4, fontSize: 13 }]}>{subtitle}</Text> : null}
    </View>
  );
}

export const Row = ({
  children,
  gap = spacing.md,
  style,
}: {
  children: ReactNode;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) => (
  <View style={[{ flexDirection: 'row', gap }, style]}>
    {React.Children.map(children, (c) => (c ? <View style={{ flex: 1 }}>{c}</View> : null))}
  </View>
);

export const Spacer = ({ h = spacing.lg }: { h?: number }) => <View style={{ height: h }} />;

export const Divider = ({ style }: { style?: StyleProp<ViewStyle> }) => (
  <View style={[{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }, style]} />
);

export const SectionLabel = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[font.label, { marginTop: spacing.lg, marginBottom: spacing.sm }, style]}>{children}</Text>
);

export const Card = ({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) =>
  onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, style, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  ) : (
    <View style={[s.card, style]}>{children}</View>
  );

// ───────────────── Text ─────────────────

export const H1 = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[font.h1, style]}>{children}</Text>
);
export const H2 = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[font.h2, style]}>{children}</Text>
);
export const H3 = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[font.h3, style]}>{children}</Text>
);
export const Body = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[font.body, style]}>{children}</Text>
);
export const Muted = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[font.small, style]}>{children}</Text>
);

// ───────────────── Buttons ─────────────────

type BtnVariant =
  | 'primary'
  | 'outline'
  | 'ghost'
  | 'darkGhost'
  | 'danger'
  | 'dangerText'
  | 'light'
  | 'lightOutline'
  | 'soft';

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  small,
  style,
  icon,
}: {
  title: string;
  onPress?: () => void;
  variant?: BtnVariant;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
}) {
  const v = btn[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        v.box,
        (disabled || loading) && { opacity: 0.45 },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon}
          <Text style={[s.btnText, small && { fontSize: 13 }, v.text]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const btn: Record<BtnVariant, { box: ViewStyle; text: TextStyle }> = {
  primary: { box: { backgroundColor: colors.primary }, text: { color: colors.onPrimary } },
  outline: {
    box: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.bg },
    text: { color: colors.text },
  },
  ghost: { box: { backgroundColor: 'transparent' }, text: { color: colors.text } },
  darkGhost: { box: { backgroundColor: 'transparent' }, text: { color: '#D0D0D0' } },
  danger: { box: { backgroundColor: colors.red }, text: { color: '#fff' } },
  dangerText: { box: { backgroundColor: 'transparent' }, text: { color: colors.red } },
  light: { box: { backgroundColor: '#fff' }, text: { color: colors.text } },
  lightOutline: {
    box: { borderWidth: 1.5, borderColor: '#555', backgroundColor: 'transparent' },
    text: { color: '#fff' },
  },
  soft: { box: { backgroundColor: colors.surface }, text: { color: colors.text } },
};

// ───────────────── Inputs ─────────────────

export function Input({
  label,
  error,
  prefix,
  style,
  inputStyle,
  ...props
}: TextInputProps & { label?: string; error?: string | null; prefix?: string; inputStyle?: StyleProp<TextStyle> }) {
  return (
    <View style={[{ marginBottom: spacing.md }, style as any]}>
      {label ? <Text style={s.inputLabel}>{label}</Text> : null}
      <View
        style={[
          s.input,
          props.multiline && { minHeight: 70, alignItems: 'flex-start' },
          error ? { borderColor: colors.red } : null,
        ]}
      >
        {prefix ? <Text style={[font.body, { marginRight: 6 }]}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={colors.textFaint}
          style={[
            { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 10 },
            props.multiline && { textAlignVertical: 'top' },
            inputStyle,
          ]}
          {...props}
        />
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

/** Input bound to react-hook-form. Errors come from the zod schema or from Laravel 422s via setError. */
export function FormInput<T extends FieldValues>({
  control,
  name,
  transform,
  ...props
}: Omit<TextInputProps, 'value' | 'onChangeText'> & {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  prefix?: string;
  inputStyle?: StyleProp<TextStyle>;
  /** e.g. digits only, uppercase */
  transform?: (v: string) => string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Input
          {...props}
          value={field.value == null ? '' : String(field.value)}
          onChangeText={(t: string) => field.onChange(transform ? transform(t) : t)}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export function OtpInput({
  length,
  value,
  onChange,
  dark,
}: {
  length: number;
  value: string;
  onChange: (v: string) => void;
  dark?: boolean;
}) {
  const ref = useRef<React.ElementRef<typeof TextInput>>(null);
  return (
    <Pressable onPress={() => ref.current?.focus()} style={{ flexDirection: 'row', gap: 8 }}>
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          style={[
            s.otpBox,
            dark && { backgroundColor: colors.darkCard },
            i === value.length && { borderColor: colors.primary, borderWidth: 1.5 },
          ]}
        >
          <Text style={{ fontSize: 22, fontWeight: '700', color: dark ? '#fff' : colors.text }}>{value[i] ?? ''}</Text>
        </View>
      ))}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
      />
    </Pressable>
  );
}

// ───────────────── Selection ─────────────────

export function Chip({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, selected && { backgroundColor: colors.primary, borderColor: colors.primary }, style]}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: selected ? '#fff' : colors.text }}>{label}</Text>
    </Pressable>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  scroll,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  scroll?: boolean;
}) {
  const chips = options.map((o) => (
    <Chip key={o.key} label={o.label} selected={value === o.key} onPress={() => onChange(o.key)} />
  ));
  return scroll ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }}>
      {chips}
    </ScrollView>
  ) : (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{chips}</View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string; badge?: number }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.segment}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[s.segmentItem, on && { backgroundColor: colors.primary }]}
          >
            <Text style={{ fontWeight: '600', fontSize: 13, color: on ? '#fff' : colors.text }}>
              {o.label}
              {o.badge !== undefined ? `  ${o.badge}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      trackColor={{ true: colors.green, false: colors.borderStrong }}
      thumbColor="#fff"
      ios_backgroundColor={colors.borderStrong}
    />
  );
}

export function ToggleRow({
  title,
  subtitle,
  value,
  onChange,
  style,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[s.listRow, style]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={font.h3}>{title}</Text>
        {subtitle ? <Text style={[font.small, { marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      <Toggle value={value} onChange={onChange} />
    </View>
  );
}

export function CheckRow({
  label,
  checked,
  onPress,
  sub,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
  sub?: string;
}) {
  return (
    <Pressable onPress={onPress} style={s.checkRow}>
      <View style={[s.checkbox, checked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
        {checked ? <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>✓</Text> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600', fontSize: 14 }}>{label}</Text>
        {sub ? <Text style={font.small}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

export function RadioRow({
  label,
  selected,
  onPress,
  sub,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  sub?: string;
}) {
  return (
    <Pressable onPress={onPress} style={[s.checkRow, selected && { borderColor: colors.primary, borderWidth: 1.5 }]}>
      <View style={[s.radio, selected && { borderColor: colors.primary }]}>
        {selected ? <View style={s.radioDot} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600', fontSize: 14 }}>{label}</Text>
        {sub ? <Text style={font.small}>{sub}</Text> : null}
      </View>
    </Pressable>
  );
}

// ───────────────── Display ─────────────────

type Tone = 'green' | 'amber' | 'red' | 'gray' | 'dark';
const toneMap: Record<Tone, { bg: string; fg: string }> = {
  green: { bg: colors.greenSoft, fg: colors.green },
  amber: { bg: colors.amberSoft, fg: colors.amber },
  red: { bg: colors.redSoft, fg: colors.red },
  gray: { bg: colors.surface, fg: colors.textMuted },
  dark: { bg: colors.primary, fg: '#fff' },
};

export const Pill = ({ text, tone = 'gray', style }: { text: string; tone?: Tone; style?: StyleProp<ViewStyle> }) => (
  <View style={[s.pill, { backgroundColor: toneMap[tone].bg }, style]}>
    <Text style={{ fontSize: 11, fontWeight: '700', color: toneMap[tone].fg }}>{text}</Text>
  </View>
);

export const Banner = ({
  text,
  tone = 'amber',
  style,
  children,
}: {
  text?: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) => (
  <View style={[s.banner, { backgroundColor: toneMap[tone].bg }, style]}>
    {text ? (
      <Text style={{ fontSize: 13, color: toneMap[tone].fg, lineHeight: 18 }}>{text}</Text>
    ) : null}
    {children}
  </View>
);

export const Stat = ({
  label,
  value,
  style,
  dark,
}: {
  label: string;
  value: string | number;
  style?: StyleProp<ViewStyle>;
  dark?: boolean;
}) => (
  <View style={[s.stat, dark && { backgroundColor: colors.darkCard }, style]}>
    <Text style={[font.tiny, dark && { color: colors.darkMuted }]}>{label}</Text>
    <Text style={{ fontSize: 16, fontWeight: '800', marginTop: 2, color: dark ? '#fff' : colors.text }}>{value}</Text>
  </View>
);

export const StatGrid = ({
  items,
  columns = 2,
}: {
  items: { label: string; value: string | number }[];
  columns?: number;
}) => (
  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {items.map((i) => (
      <Stat
        key={i.label}
        label={i.label}
        value={i.value}
        style={{ width: `${100 / columns - 2}%` as any, flexGrow: 1 }}
      />
    ))}
  </View>
);

export const KV = ({
  label,
  value,
  bold,
  valueColor,
  dark,
  style,
}: {
  label: string;
  value: ReactNode;
  bold?: boolean;
  valueColor?: string;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
}) => (
  <View style={[s.kv, style]}>
    <Text
      style={[{ fontSize: 14, color: dark ? colors.darkMuted : colors.text, flex: 1 }, bold && { fontWeight: '700' }]}
    >
      {label}
    </Text>
    {typeof value === 'string' || typeof value === 'number' ? (
      <Text style={{ fontSize: 14, fontWeight: '700', color: valueColor ?? (dark ? '#fff' : colors.text) }}>
        {value}
      </Text>
    ) : (
      value
    )}
  </View>
);

export type StepState = 'done' | 'in_review' | 'waiting' | 'next' | 'pending';
export function StepList({ steps }: { steps: { label: string; state: StepState }[] }) {
  const right: Record<StepState, string> = {
    done: 'Done',
    in_review: 'In review',
    waiting: 'Waiting',
    next: 'Next',
    pending: 'Pending',
  };
  return (
    <View>
      {steps.map((st, i) => {
        const bg = st.state === 'done' ? colors.green : st.state === 'pending' ? colors.textMuted : colors.orange;
        return (
          <View key={st.label} style={[s.kv, { paddingVertical: 12 }]}>
            <View style={[s.stepDot, { backgroundColor: bg }]}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                {st.state === 'done' ? 'ok' : i + 1}
              </Text>
            </View>
            <Text style={{ flex: 1, fontSize: 14, marginLeft: 10 }}>{st.label}</Text>
            <Text style={{ fontWeight: '700', fontSize: 13 }}>{right[st.state]}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
  chevron,
  titleStyle,
  style,
}: {
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  titleStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [s.listRow, style, pressed && { opacity: 0.7 }]}
    >
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={[{ fontSize: 14, fontWeight: '600', color: colors.text }, titleStyle]}>{title}</Text>
        {typeof subtitle === 'string' ? <Text style={[font.small, { marginTop: 2 }]}>{subtitle}</Text> : subtitle}
      </View>
      {right}
      {chevron ? <ChevronRight size={18} color={colors.textMuted} style={{ marginLeft: 6 }} /> : null}
    </Pressable>
  );
}

export const Avatar = ({ initials, size = 48, dark = true }: { initials: string; size?: number; dark?: boolean }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: dark ? colors.primary : colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Text style={{ color: dark ? '#fff' : colors.text, fontWeight: '800', fontSize: size * 0.34 }}>{initials}</Text>
  </View>
);

export const IconCircle = ({
  icon: Icon,
  label,
  size = 36,
  bg = colors.primary,
  fg = '#fff',
}: {
  icon?: LucideIcon;
  label?: string;
  size?: number;
  bg?: string;
  fg?: string;
}) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: bg,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {Icon ? (
      <Icon size={size * 0.5} color={fg} />
    ) : (
      <Text style={{ color: fg, fontWeight: '800', fontSize: (label?.length ?? 0) > 2 ? 10 : 14 }}>{label}</Text>
    )}
  </View>
);

export const Loading = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
    <ActivityIndicator color={colors.primary} />
  </View>
);

export const Empty = ({ text }: { text: string }) => (
  <View style={{ padding: 32, alignItems: 'center' }}>
    <Text style={font.small}>{text}</Text>
  </View>
);

export const ProgressBar = ({ value, color = colors.green }: { value: number; color?: string }) => (
  <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}>
    <View style={{ width: `${Math.min(100, Math.max(0, value * 100))}%`, height: '100%', backgroundColor: color }} />
  </View>
);

const s = StyleSheet.create({
  pad: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  back: { fontSize: 13, color: colors.text },
  steps: { flexDirection: 'row', gap: 4, marginBottom: spacing.sm },
  stepBar: { flex: 1, height: 3, borderRadius: 2 },
  card: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  btn: { height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnSmall: { height: 34, borderRadius: radius.sm, paddingHorizontal: 12 },
  btnText: { fontSize: 15, fontWeight: '700' },
  inputLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 6 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    backgroundColor: colors.bg,
  },
  error: { color: colors.red, fontSize: 11, marginTop: 4 },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  segment: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, padding: 3 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.pill },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  banner: { padding: spacing.md, borderRadius: radius.md },
  stat: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, flex: 1 },
  kv: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  stepDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
