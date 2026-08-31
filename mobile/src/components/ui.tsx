import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewProps,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

export const colors = {
  bg: '#F8F8FC',
  card: '#FFFFFF',
  primary: '#5B5FEF',
  primaryDark: '#4347C9',
  primarySoft: '#ECEDFF',
  accent: '#F59E0B',
  accentSoft: '#FFF7E6',
  text: '#15161C',
  textMuted: '#888D96',
  border: '#ECEDF1',
  success: '#16A34A',
  successSoft: '#E7F7ED',
  danger: '#EF4444',
  dangerSoft: '#FDECEC',
};

const DEFAULT_SCREEN_EDGES: Edge[] = ['top', 'bottom'];

export function Screen({
  children,
  style,
  edges = DEFAULT_SCREEN_EDGES,
  ...rest
}: ViewProps & { edges?: Edge[] }) {
  return (
    <SafeAreaView edges={edges} style={[styles.screen, style]} {...rest}>
      {children}
    </SafeAreaView>
  );
}

export function Card({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

type TextLikeProps = { children: React.ReactNode; style?: TextStyle | TextStyle[] };

export function H1({ children, style }: TextLikeProps) {
  return <Text style={[styles.h1, style]}>{children}</Text>;
}

export function H2({ children, style }: TextLikeProps) {
  return <Text style={[styles.h2, style]}>{children}</Text>;
}

export function Muted({ children, style }: TextLikeProps) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

export function Button({
  title,
  onPress,
  loading,
  variant = 'primary',
  disabled,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        (disabled || loading) && styles.buttonDisabled,
        pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : '#fff'} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'secondary' && { color: colors.primary },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Input({ style, ...props }: TextInputProps) {
  return <TextInput style={[styles.input, style]} placeholderTextColor={colors.textMuted} {...props} />;
}

// 라벨이 입력값 위에 고정으로 남아있는 필드. 로그인/가입 등 값을 잊으면 안 되는 폼에 쓴다.
export function Field({
  label,
  required,
  style,
  ...inputProps
}: TextInputProps & { label: string; required?: boolean }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={{ color: colors.danger }}> *</Text>}
      </Text>
      <TextInput style={[styles.input, { marginBottom: 0 }, style]} placeholderTextColor={colors.textMuted} {...inputProps} />
    </View>
  );
}

// 앱 전체에서 쓰는 알약 모양 선택칩. 개별 화면마다 흩어져 있던 chip 스타일을 하나로 통일한다.
export function Chip({
  label,
  active,
  onPress,
  tone = 'primary',
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  tone?: 'primary' | 'danger';
}) {
  const activeColor = tone === 'danger' ? colors.danger : colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: activeColor },
      ]}
    >
      <Text style={[styles.chipText, active ? { color: '#fff' } : tone === 'danger' && { color: colors.danger }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Badge({
  label,
  tone = 'primary',
}: {
  label: string;
  tone?: 'primary' | 'success' | 'danger' | 'accent' | 'muted';
}) {
  const map = {
    primary: { bg: colors.primarySoft, fg: colors.primary },
    success: { bg: colors.successSoft, fg: colors.success },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
    accent: { bg: colors.accentSoft, fg: colors.accent },
    muted: { bg: colors.border, fg: colors.textMuted },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <Text style={[styles.badgeText, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#1A1D29',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  h1: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 4, letterSpacing: -0.4 },
  h2: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 8, letterSpacing: -0.2 },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  button: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonSecondary: {
    backgroundColor: colors.primarySoft,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: -0.1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
