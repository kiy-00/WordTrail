<script lang="ts">
import { onMounted, ref } from 'vue'

export default defineComponent({
  name: 'MyData',

  setup() {
    const checkDays = ref(0)
    const todayLearned = ref(9)
    const totalLearned = ref(0)
    const todayTime = ref(0)
    const totalTime = ref(0)
    const bookName = ref('')
    const vocabularyCount = ref(0)
    const bookLearned = ref(0)
    const bookTotal = ref(0)
    const bookUrl = ref('')
    const percent = ref(0)
    const overviewItems = ref([
      { icon: 'i-mynaui:chart-bar-two', content: '今日学习', data: todayLearned, unit: '词', color: 'yellow' },
      { icon: 'i-mynaui:chart-bar-solid', content: '累计学习', data: totalLearned, unit: '词', color: '' },
      { icon: 'i-mynaui:chevron-down-right-circle', content: '今日总时长', data: todayTime, unit: '分钟', color: 'yellow' },
      { icon: 'i-mynaui:chevron-down-left-waves-solid', content: '累计时长', data: totalTime, unit: '分钟', color: '' },
    ])
    const week = ref(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])
    const firstDay = ref(0)

    onMounted(() => {
      checkDays.value = 100
      todayLearned.value = 100
      totalLearned.value = 1000
      todayTime.value = 60
      totalTime.value = 1000
    })

    // 返回逻辑
    const handleBack = () => {
      // 实现返回逻辑，例如跳转到上一页
      uni.navigateBack()
    }

    return {
      checkDays,
      todayLearned,
      totalLearned,
      todayTime,
      totalTime,
      bookName,
      vocabularyCount,
      bookLearned,
      bookTotal,
      bookUrl,
      percent,
      overviewItems,
      week,
      firstDay,
      handleBack,
    }
  },
})
</script>

<template>
  <!-- Back Button -->
  <BackButton @back="handleBack" />

  <view class="header mt-5">
    <text class="header-text z-10 text-sm font-bold">
      Dashboard
    </text>
  </view>
  <view class="body-head mt-5 flex items-center justify-between">
    <text class="ml-2 font-bold">
      正在学习
    </text>
    <button class="action-button mr-0 h-8 rounded-lg bg-yellow p-2 text-align-center text-sm font-bold">
      换本词书
    </button>
  </view>
  <view class="content">
    <view class="box relative my-2 ml-1 flex flex-col rounded-md p-5 frosted-glass">
      <view class="flex items-start">
        <image class="box-image h-16 w-18 rounded-md" :src="bookUrl" />
        <view class="ml-4 h-16 flex flex-col justify-between">
          <text class="book-name text-xl">
            {{ bookName }}
          </text>
          <view class="learned flex items-center">
            <view class="i-mynaui:check-circle-one" />
            <text class="vocabulary text-m mb-0">
              &nbsp;生词本&nbsp;{{ vocabularyCount }}
            </text>
          </view>
        </view>
      </view>
      <progress class="box-progress mt-10" color="#FFCB00FF" :percent="bookLearned / bookTotal * 100" />
      <view class="mt-2 flex justify-between">
        <text class="book-learned ml-0 mt-0">
          已学习{{ bookLearned }}
        </text>
        <text class="book-total mr-0 mt-0">
          总词数{{ bookTotal }}
        </text>
      </view>
    </view>
    <text class="my-data-text absolute mt-12 text-left -ml-40">
      我的数据
    </text>

    <view class="box relative my-4 ml-1 mt-22 flex flex-col rounded-md p-5 frosted-glass">
      <text class="box-text absolute left-2 top-2">
        概览
      </text>
      <view class="i-mynaui:chevron-right absolute right-2 top-2" />
      <view class="boxes grid grid-cols-2 grid-rows-2 mt-4 gap-4">
        <OverviewContent
          v-for="(item, index) in overviewItems"
          :key="index"
          :icon="item.icon"
          :content="item.content"
          :data="item.data.toString()"
          :unit="item.unit"
          :color="item.color"
        />
      </view>
    </view>

    <view class="box relative my-4 ml-1 flex flex-col rounded-md p-5 frosted-glass">
      <view class="flex items-center justify-between">
        <text class="box-text absolute left-2 top-2">
          日历
        </text>
        <view class="absolute right-2 top-2 flex items-center">
          <text class="box-text mr-1 text-xs">
            连续签到{{ checkDays }}天
          </text>
          <view class="i-mynaui:chevron-right" />
        </view>
      </view>
      <view class="calendar-box mt-4 flex">
        <CalendarDate
          v-for="(day, index) in week"
          :key="index"
          :day-of-week="day"
          :date="(firstDay + index).toString()"
          :is-today="index === 2"
          class="custom-calendar-date flex-grow text-center"
        />
      </view>
    </view>
  </view>
</template>

<style scoped>
</style>

<route lang="json">
  {
    "layout": "default"
  }
</route>
