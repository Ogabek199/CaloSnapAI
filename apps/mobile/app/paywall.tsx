import React from 'react';
import { useRouter } from 'expo-router';
import { PaywallModal } from '../src/features/subscription/PaywallModal';

export default function PaywallScreen() {
  const router = useRouter();

  return (
    <PaywallModal
      visible={true}
      onClose={() => router.back()}
    />
  );
}
