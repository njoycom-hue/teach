import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';

const BUCKET = 'study-proofs';

// ---- 학생: 인증샷 촬영/선택 후 업로드, storage 상의 경로를 반환 ----
export function useUploadProof(studentId: string | undefined) {
  return useMutation({
    mutationFn: async ({ goalId }: { goalId: string }) => {
      if (!studentId) throw new Error('로그인이 필요합니다.');

      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw new Error('카메라 권한이 필요합니다.');

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.6,
        allowsEditing: true,
      });
      if (result.canceled || !result.assets?.[0]) return null;

      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const path = `${studentId}/${goalId}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: asset.mimeType ?? 'image/jpeg',
        upsert: true,
      });
      if (error) throw error;

      return path;
    },
  });
}

// ---- 인증샷 열람: 비공개 버킷이므로 서명된 URL을 발급받아 표시 ----
export function useSignedProofUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ['proof-url', path],
    enabled: !!path,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path as string, 60 * 30);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
