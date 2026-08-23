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
  bg: '#F5F7FA',
  card: '#FFFFFF',
  primary: '#3D5AFE',
  primarySoft: '#E8ECFF',
  text: '#1A1D29',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  success: '#22C55E',
  danger: '#EF4444',
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
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        (disabled || loading) && styles.buttonDisabled,
        pressed && { opacity: 0.85 },
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

export function Input(props: TextInputProps) {
  return <TextInput style={styles.input} placeholderTextColor={colors.textMuted} {...props} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  h1: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 4 },
  h2: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 8 },
  muted: { fontSize: 13, color: colors.textMuted },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
});
