<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  name: 'Calendar',
  emits: ['update:signInDays'],
  setup(props, { emit }) {
    // 周标题
    const weekDays = ref(['日', '一', '二', '三', '四', '五', '六'])

    // 当前日期
    const currentDate = ref(new Date())

    // 本月天数
    const daysInMonth = ref<number[]>([])

    // 本月第一天是星期几
    const firstDayOfWeek = ref<number>(0)

    // 累计签到天数
    const signInDays = ref<number>(0)

    // 签到日期数组，存储日期数字，例如 [1, 2, 3]
    const signInDates = ref<number[]>([])

    // 控制闪光效果的响应式变量
    const isFlashing = ref(false)

    // 计算本月的天数
    const calculateDays = () => {
      const year = currentDate.value.getFullYear()
      const month = currentDate.value.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const totalDays = lastDay.getDate()
      daysInMonth.value = Array.from({ length: totalDays }, (_, i) => i + 1)
      firstDayOfWeek.value = firstDay.getDay()
    }

    // 判断是否签到
    const isSignedIn = (date: number) => {
      return signInDates.value.includes(date)
    }

    // 判断是否为今天
    const isToday = (date: number) => {
      const today = new Date()
      return (
        currentDate.value.getFullYear() === today.getFullYear()
        && currentDate.value.getMonth() === today.getMonth()
        && date === today.getDate()
      )
    }

    // 签到函数
    const handleSignIn = () => {
      const today = currentDate.value.getDate()
      if (!signInDates.value.includes(today)) {
        signInDates.value.push(today)
        signInDays.value = signInDates.value.length
        emit('update:signInDays', signInDays.value)

        // 添加闪光效果
        isFlashing.value = true
        setTimeout(() => {
          isFlashing.value = false
        }, 500) // 动画持续时间 0.5 秒
      }
      else {
        uni.showToast({
          title: '今天已签到',
          icon: 'none',
        })
      }
    }

    // 选择日期（可选功能）
    const selectDate = (date: number) => {
      // 实现点击日期的功能，例如查看当天的详细信息
      uni.showToast({
        title: `选中了日期：${date}`,
        icon: 'none',
      })
    }

    onMounted(() => {
      calculateDays()
    })

    return {
      weekDays,
      daysInMonth,
      firstDayOfWeek,
      signInDays,
      signInDates,
      handleSignIn,
      isSignedIn,
      isToday,
      selectDate,
      isFlashing,
      currentDate,
    }
  },
})
</script>

<template>
  <view class="calendar-container">
    <!-- 日历头部，显示累计签到天数 -->
    <view class="calendar-header items-center justify-between px-4 py-2">
      <text class="text-lg">
        累计签到天数：{{ signInDays }}
      </text>
    </view>
    <!-- 日历主体 -->
    <view class="calendar-body px-4">
      <!-- 周标题 -->
      <view class="week-header flex justify-between">
        <text v-for="(day, index) in weekDays" :key="index" class="w-1/7 text-center">
          {{ day }}
        </text>
      </view>
      <!-- 日期 -->
      <view class="dates flex flex-wrap">
        <!-- 空白填充 -->
        <view
          v-for="n in firstDayOfWeek"
          :key="`empty-${n}`"
          class="h-10 w-1/7"
        />
        <!-- 日期循环 -->
        <view
          v-for="date in daysInMonth"
          :key="date"
          class="h-10 w-1/7 flex items-center justify-center"
          @click="selectDate(date)"
        >
          <view
            class="h-8 w-8 flex items-center justify-center rounded-full"
            :class="[
              isSignedIn(date) ? 'bg-yellow font-bold' : '',
              isToday(date) ? 'border-dashed border-red' : '',
            ]"
          >
            {{ date }}
          </view>
        </view>
      </view>
    </view>

    <!-- 签到按钮，绑定闪光效果的类 -->
    <button
      class="sign-in-button mt-20 px-2"
      :class="{ 'flash': isFlashing, 'signed-in': isSignedIn(currentDate.getDate()) }"
      :disabled="isSignedIn(currentDate.getDate())"
      @click="handleSignIn"
    >
      <view v-if="!isSignedIn(currentDate.getDate())">
        签到
      </view>
      <view v-else class="i-mynaui:check text-3xl" />
    </button>
  </view>
</template>

<style scoped>
/* 闪光动画 */
@keyframes flash {
  0% {
    box-shadow:
      0 0 10px rgba(255, 255, 255, 0.8),
      0 0 20px rgba(255, 255, 255, 0.6),
      0 0 30px rgba(255, 255, 255, 0.4);
    transform: scale(1);
  }
  100% {
    box-shadow:
      0 0 0 rgba(255, 255, 255, 0),
      0 0 0 rgba(255, 255, 255, 0),
      0 0 0 rgba(255, 255, 255, 0);
    transform: scale(1.05);
  }
}

.sign-in-button.flash {
  animation: flash 0.2s forwards;
}

/* 已签到状态的按钮样式 */
.sign-in-button.signed-in {
  background: radial-gradient(circle at center, rgba(173, 216, 230, 0.8), rgba(135, 206, 250, 0.5)); /* 淡蓝色渐变 */
  box-shadow:
    0 0 15px rgba(0, 191, 255, 0.5),   /* 深天蓝阴影 */
    0 0 30px rgba(70, 130, 180, 0.5),  /* 钢青色阴影 */
    0 0 45px rgba(30, 144, 255, 0.5);  /* 道奇蓝阴影 */
  opacity: 0.9;
  color: #fff;
}

/* 禁用按钮样式 */
.sign-in-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
