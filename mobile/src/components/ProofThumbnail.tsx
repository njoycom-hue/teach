import React from 'react';
import { Image, StyleSheet } from 'react-native';

import { useSignedProofUrl } from '../hooks/useProofUpload';

export function ProofThumbnail({ path }: { path: string }) {
  const { data: url } = useSignedProofUrl(path);
  if (!url) return null;
  return <Image source={{ uri: url }} style={styles.thumb} />;
}

const styles = StyleSheet.create({
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    marginTop: 8,
  },
});
