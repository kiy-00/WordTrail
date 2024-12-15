<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'WordBox',
  props: {
    word: {
      type: String,
      required: true,
    },
    phonetic: {
      type: String,
      required: true,
    },
    translation: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      default: '',
    },
  },
  methods: {
    handleClick() {
      this.$emit('click')
    },
  },
})
</script>

<template>
  <view class="mb-4 rounded-lg px-4 py-4 frosted-glass">
    <view class="flex flex-col cursor-pointer" @click="handleClick">
      <view class="flex flex-row items-center justify-between">
        <view class="text-lg font-bold">
          {{ word }}
        </view>
        <view class="text-sm text-gray-500">
          [{{ phonetic }}]
        </view>
      </view>
      <view class="mt-2 text-sm text-gray-600">
        {{ translation }}
      </view>
    </view>
  </view>
</template>

<style scoped>
.frosted-glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
}
</style>
