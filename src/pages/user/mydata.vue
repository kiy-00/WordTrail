<script lang="ts">
import type { EChartOption } from 'echarts'
import { API_BASE_URL } from '@/config/api'
import * as echarts from 'echarts'
import { defineComponent, onMounted, ref, watch } from 'vue'

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

    // 添加用于存储和显示API返回数据的ref
    const weeklyStats = ref<any>(null)
    const debugVisible = ref(true)

    // 添加一个 DOM 引用用于图表容器
    const chartRef = ref<HTMLDivElement | HTMLCanvasElement | null>(null)

    // 图表实例
    let chartInstance: echarts.ECharts | null = null

    // 处理后的图表数据
    const chartData = ref({
      dates: [] as string[],
      learnCounts: [] as number[],
      reviewCounts: [] as number[],
    })

    // 定义更新图表的函数，提前放在调用之前
    const updateChart = () => {
      if (chartInstance) {
        const option: EChartOption = {
          tooltip: {
            trigger: 'axis',
          },
          legend: {
            data: ['学习', '复习'],
          },
          xAxis: [{
            type: 'category',
            data: chartData.value.dates,
          }],
          yAxis: [{
            type: 'value',
            min: 0,
            max: 20,
            interval: 5,
          }],
          series: [
            {
              name: '学习',
              type: 'bar',
              data: chartData.value.learnCounts,
              itemStyle: {
                color: '#FFCB00', // 学习的柱状显示为黄色
              },
            },
            {
              name: '复习',
              type: 'bar',
              data: chartData.value.reviewCounts,
              itemStyle: {
                color: '#4B99FF', // 复习的柱状显示为蓝色
              },
            },
          ],
        }
        chartInstance.setOption(option)
      }
    }

    // 监听 weeklyStats 的变化，更新 chartData
    watch(weeklyStats, (newStats) => {
      if (newStats && Array.isArray(newStats)) {
        chartData.value.dates = newStats.map(item => item.date)
        chartData.value.learnCounts = newStats.map(item => item.reviewCount1)
        chartData.value.reviewCounts = newStats.map(item => item.reviewCountGreater1)
        updateChart()
      }
    })

    // 初始化图表
    const initChart = () => {
      const chartDom = chartRef.value
      if (chartDom) {
        chartInstance = echarts.init(chartDom as HTMLDivElement)
        updateChart()
      }
    }

    // 获取每周统计数据
    const fetchWeeklyStats = async () => {
      try {
        const token = uni.getStorageSync('token')
        const response = await uni.request({
          url: `${API_BASE_URL}/api/statistics/weekly`,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200) {
          weeklyStats.value = response.data
        }
        else {
          throw new Error(`请求失败: ${response.statusCode}`)
        }
      }
      catch {
        uni.showToast({
          title: '获取统计数据失败',
          icon: 'none',
        })
      }
    }

    onMounted(() => {
      checkDays.value = 100
      todayLearned.value = 100
      totalLearned.value = 1000
      todayTime.value = 60
      totalTime.value = 1000
      fetchWeeklyStats()
      // 初始化图表
      initChart()
    })

    // 返回逻辑
    const handleBack = () => {
      // 实现返回逻辑，例如跳转到上一页
      uni.navigateTo({
        url: '/pages/home/home',
      })
    }

    const handleSwitchLexicon = () => {
      uni.navigateTo({
        url: '/pages/user/selectlexicon',
      })
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
      handleSwitchLexicon,
      weeklyStats,
      debugVisible,
      chartRef,
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
    <button
      class="action-button mr-0 h-8 rounded-lg bg-yellow p-2 text-align-center text-sm font-bold"
      @click="handleSwitchLexicon"
    >
      换本词书
    </button>
  </view>
  <!-- <view class="content">
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
    </view> -->
  <text class="my-data-text absolute mt-12 text-left -ml-40">
    我的数据
  </text>

  <!-- <view class="box relative my-4 ml-1 mt-22 flex flex-col rounded-md p-5 frosted-glass">
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
    </view> -->

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

  <!-- 在合适的位置添加图表容器 -->
  <div ref="chartRef" class="chart-container" style="width: 100%; height: 300px;" />
<!--
  <view v-if="debugVisible" class="fixed right-4 top-20 z-50 max-h-100 w-80 overflow-auto rounded bg-white/80 p-4 shadow-lg">
    <view class="mb-2 flex items-center justify-between">
      <text class="font-bold">
        每周统计数据(调试)
      </text>
    </view>
    <view v-if="weeklyStats" class="text-xs">
      <pre class="whitespace-pre-wrap break-all">{{ JSON.stringify(weeklyStats, null, 2) }}</pre>
    </view>
    <view v-else class="text-gray-500">
      加载中...
    </view>
  </view> -->
</template>

<style scoped>
/* 添加必要的样式 */
.chart-container {
  margin-top: 20px;
}
</style>

<route lang="json">
  {
    "layout": "default"
  }
</route>
