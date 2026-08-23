import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { useSendMessage, useThreadMessages } from '../hooks/useMessages';
import { Button, colors, Input, Muted } from './ui';

export function ChatThread({ classroomId, studentId }: { classroomId: string; studentId: string }) {
  const { profile } = useAuth();
  const { data: messages, isLoading } = useThreadMessages(classroomId, studentId);
  const sendMessage = useSendMessage(classroomId, studentId);
  const [body, setBody] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!body.trim() || !profile?.id) return;
    const text = body.trim();
    setBody('');
    await sendMessage.mutateAsync({ senderId: profile.id, body: text });
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {isLoading && <Muted>불러오는 중...</Muted>}
        {!isLoading && (messages ?? []).length === 0 && <Muted>아직 대화가 없어요. 메시지를 보내보세요.</Muted>}
        {(messages ?? []).map((m) => {
          const mine = m.sender_id === profile?.id;
          return (
            <View key={m.id} style={[styles.bubbleRow, mine && { justifyContent: 'flex-end' }]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={{ color: mine ? '#fff' : colors.text }}>{m.body}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputRow}>
        <Input
          placeholder="메시지 입력..."
          value={body}
          onChangeText={setBody}
          style={{ flex: 1, marginBottom: 0 }}
          onSubmitEditing={handleSend}
        />
        <View style={{ width: 8 }} />
        <View style={{ width: 72 }}>
          <Button title="전송" onPress={handleSend} loading={sendMessage.isPending} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubbleRow: { flexDirection: 'row', marginBottom: 8 },
  bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: colors.primary },
  bubbleTheirs: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
});
