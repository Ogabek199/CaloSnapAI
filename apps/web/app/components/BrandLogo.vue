<script setup lang="ts">
withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg' }>(), { size: 'md' });
</script>

<template>
  <span
    class="brand-gradient inline-flex shrink-0 items-center justify-center shadow-sm shadow-brand-700/20"
    :class="{
      'size-8 rounded-[10px]': size === 'sm',
      'size-9 rounded-xl': size === 'md',
      'size-14 rounded-2xl': size === 'lg',
    }"
  >
    <img
      src="/logo-mark.png"
      alt=""
      :class="{ 'size-5': size === 'sm', 'size-6': size === 'md', 'size-9': size === 'lg' }"
      width="80"
      height="80"
    />
  </span>
</template>
