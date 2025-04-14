<script lang="ts">
import BackButton from '@/components/BackButton.vue'
import { API_BASE_URL } from '@/config/api'
import { defineComponent, onMounted, ref } from 'vue'

// 定义打卡数据接口
interface ClockInData {
  streak: number
  todayCompleted: boolean
  learningGoal: LearningGoal
  weeklyData: WeeklyClockIn[]
}

// 定义学习目标接口
interface LearningGoal {
  dailyNewWords: number
  dailyReviewWords: number
}

// 定义周打卡记录接口
interface WeeklyClockIn {
  date: string
  completed: boolean
  newWordsLearned: number
  wordsReviewed: number
}

// 定义好友接口
interface Friend {
  id: string
  name: string
  avatar: string
  streak: number
}

// 定义学习目标响应接口
interface LearningGoalResponse {
  id: string
  userId: string
  dailyNewWordsGoal: number
  dailyReviewWordsGoal: number
  createdAt: string
  updatedAt: string
}

// 定义周打卡响应接口
interface WeeklyClockInResponse {
  date: string
  newWordsCompleted: number
  reviewWordsCompleted: number
  status: boolean
}

export default defineComponent({
  name: 'MyClockInPage',
  components: {
    BackButton,
  },
  setup() {
    const isLoading = ref(true)
    const activeTab = ref('personal')
    const errorMessage = ref('')
    const userId = ref(uni.getStorageSync('userInfo')?.userId || '')
    // eslint-disable-next-line no-console
    console.log('userId:', userId.value)

    // 打卡数据
    const clockInData = ref<ClockInData>({
      streak: 0,
      todayCompleted: false,
      learningGoal: {
        dailyNewWords: 20,
        dailyReviewWords: 50,
      },
      weeklyData: [],
    })

    // 好友列表
    const friends = ref<Friend[]>([])

    // 切换标签页
    const switchTab = (tab: string) => {
      activeTab.value = tab
    }

    // 获取每日学习目标
    const fetchLearningGoal = async () => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        const url = `${API_BASE_URL}/api/v1/clock-in/goal`

        // eslint-disable-next-line no-console
        console.log('获取学习目标:', url)

        const response = await uni.request({
          url,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200 && response.data) {
          const goalData = response.data as LearningGoalResponse

          // 更新学习目标
          clockInData.value.learningGoal = {
            dailyNewWords: goalData.dailyNewWordsGoal,
            dailyReviewWords: goalData.dailyReviewWordsGoal,
          }

          // eslint-disable-next-line no-console
          console.log('获取到的学习目标:', goalData)
        }
        else {
          console.error('获取学习目标失败:', response)
        }
      }
      catch (error) {
        console.error('获取学习目标错误:', error)
      }
    }

    // 获取星期几 - 修正版
    const getDayOfWeek = (dateString: string) => {
      const days = ['日', '一', '二', '三', '四', '五', '六']

      try {
        // 确保日期字符串格式正确
        const parts = dateString.split('-')
        if (parts.length !== 3) {
          console.error('日期格式不正确:', dateString)
          return '未知'
        }

        // 创建日期对象（使用YYYY-MM-DD格式避免时区问题）
        const year = Number.parseInt(parts[0])
        const month = Number.parseInt(parts[1]) - 1 // 月份从0开始
        const day = Number.parseInt(parts[2])

        const date = new Date(year, month, day)

        // 检查日期是否有效
        if (Number.isNaN(date.getTime())) {
          console.error('无效日期:', dateString)
          return '未知'
        }

        return `周${days[date.getDay()]}`
      }
      catch (e) {
        console.error('计算星期几出错:', e, dateString)
        return '未知'
      }
    }

    // 获取过去一周的打卡记录
    const fetchWeeklyClockIn = async () => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        const url = `${API_BASE_URL}/api/v1/clock-in/weekly`

        // eslint-disable-next-line no-console
        console.log('获取周打卡记录:', url)

        const response = await uni.request({
          url,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200 && Array.isArray(response.data)) {
          // 将API返回的数据转换为组件需要的格式
          clockInData.value.weeklyData = response.data.map((item: WeeklyClockInResponse) => ({
            date: item.date,
            completed: item.status,
            newWordsLearned: item.newWordsCompleted,
            wordsReviewed: item.reviewWordsCompleted,
          }))

          // 确保数据按日期排序（从旧到新）
          clockInData.value.weeklyData.sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime(),
          )

          // 调试输出
          // eslint-disable-next-line no-console
          console.log('排序后的周打卡记录:', clockInData.value.weeklyData.map(day =>
            `${day.date} - ${getDayOfWeek(day.date)}`,
          ))

          // 根据周打卡数据判断今日是否已完成打卡
          const today = new Date().toISOString().split('T')[0] // 格式化为 YYYY-MM-DD
          const todayRecord = clockInData.value.weeklyData.find(day => day.date === today)
          if (todayRecord) {
            clockInData.value.todayCompleted = todayRecord.completed
          }
        }
        else {
          console.error('获取周打卡记录失败:', response)
        }
      }
      catch (error) {
        console.error('获取周打卡记录错误:', error)
      }
    }

    // 获取打卡数据
    const fetchClockInData = async () => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        // 初始化基本数据结构
        clockInData.value = {
          streak: 0, // 会从API获取实际数据
          todayCompleted: false, // 会从周打卡记录中更新
          learningGoal: {
            dailyNewWords: 0, // 会从API获取实际数据
            dailyReviewWords: 0, // 会从API获取实际数据
          },
          weeklyData: [], // 会从API获取实际数据
        }

        // 并行获取学习目标和周打卡记录
        await Promise.all([
          fetchLearningGoal(),
          fetchWeeklyClockIn(),
        ])
      }
      catch (error) {
        errorMessage.value = '获取打卡数据失败'
        console.error('获取打卡数据错误:', error)
      }
    }

    // 获取好友列表
    const fetchFriends = async () => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        // 模拟获取数据，实际项目中应该替换为真实API
        // const url = `${API_BASE_URL}/api/v1/friends/${userId.value}`

        // 模拟数据
        friends.value = [
          {
            id: '1',
            name: '王小明',
            avatar: '/static/avatar1.png',
            streak: 20,
          },
          {
            id: '2',
            name: '李小红',
            avatar: '/static/avatar2.png',
            streak: 15,
          },
          {
            id: '3',
            name: '张三',
            avatar: '/static/avatar3.png',
            streak: 30,
          },
          {
            id: '4',
            name: '赵四',
            avatar: '/static/avatar4.png',
            streak: 5,
          },
        ]
      }
      catch (error) {
        console.error('获取好友列表错误:', error)
      }
    }

    // 初始化数据
    const initData = async () => {
      isLoading.value = true
      errorMessage.value = ''

      try {
        await Promise.all([fetchClockInData(), fetchFriends()])
      }
      catch (error) {
        errorMessage.value = '获取数据失败，请重试'
        console.error('初始化数据失败:', error)
      }
      finally {
        isLoading.value = false
      }
    }

    // 返回上一页
    const handleBack = () => {
      uni.navigateBack()
    }

    // 发起组队挑战
    const initiateChallenge = (friendId: string, friendName: string) => {
      uni.showLoading({
        title: '发送挑战中',
      })

      setTimeout(() => {
        uni.hideLoading()
        uni.showToast({
          title: `已向${friendName}发送组队挑战`,
          icon: 'success',
        })
      }, 1500)
    }

    onMounted(() => {
      initData()
    })

    return {
      isLoading,
      errorMessage,
      activeTab,
      clockInData,
      friends,
      switchTab,
      handleBack,
      initiateChallenge,
      getDayOfWeek,
    }
  },
})
</script>

<template>
  <view class="clock-in-page px-4 py-4">
    <BackButton @back="handleBack" />

    <!-- 标题 -->
    <view class="mb-6 mt-10">
      <text class="text-2xl font-bold">
        我的打卡
      </text>
    </view>

    <!-- 标签页切换 -->
    <view class="tab-container mb-6 flex rounded-full bg-gray-100 p-1">
      <view
        class="flex-1 rounded-full py-2 text-center tab transition-all" :class="[
          activeTab === 'personal' ? 'active-tab bg-white shadow-sm text-yellow font-medium' : 'text-gray-600',
        ]"
        @click="switchTab('personal')"
      >
        个人打卡
      </view>
      <view
        class="flex-1 rounded-full py-2 text-center tab transition-all" :class="[
          activeTab === 'team' ? 'active-tab bg-white shadow-sm text-yellow font-medium' : 'text-gray-600',
        ]"
        @click="switchTab('team')"
      >
        组队打卡
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-if="isLoading" class="flex flex-col items-center justify-center py-10">
      <view class="i-carbon:progress-bar animate-spin text-2xl" />
      <text class="mt-2 block text-gray-600">
        加载中...
      </text>
    </view>

    <!-- 错误信息 -->
    <view v-else-if="errorMessage" class="rounded-lg bg-red-50 p-4 text-center text-red-500">
      {{ errorMessage }}
    </view>

    <!-- 个人打卡 -->
    <view v-else-if="activeTab === 'personal'" class="space-y-6">
      <!-- 连续打卡统计 -->
      <view class="relative overflow-hidden rounded-xl from-yellow to-amber-400 bg-gradient-to-r p-5 shadow-md">
        <view class="relative z-10">
          <text class="mb-1 block text-lg font-medium">
            当前连续打卡
          </text>
          <view class="flex items-baseline">
            <text class="text-4xl font-bold">
              {{ clockInData.streak }}
            </text>
            <text class="ml-2 text-xl">
              天
            </text>
          </view>
          <text class="mt-2 block text-sm">
            坚持打卡，保持学习动力！
          </text>
        </view>
        <!-- 背景装饰 -->
        <view class="absolute bottom-0 right-0 opacity-20">
          <view class="i-carbon:calendar-heat-map text-6xl" />
        </view>
      </view>

      <!-- 学习目标 -->
      <view class="rounded-xl bg-white/70 p-5 shadow-sm backdrop-blur-sm">
        <text class="mb-4 block text-lg text-gray-800 font-medium">
          每日学习目标
        </text>

        <view class="grid grid-cols-2 gap-4">
          <!-- 新词目标 -->
          <view class="rounded-lg bg-blue-50 p-4">
            <view class="flex items-center">
              <view class="i-carbon:book text-xl text-blue-500" />
              <text class="ml-2 text-sm text-gray-600">
                新词学习
              </text>
            </view>
            <text class="mt-1 block text-2xl text-gray-800 font-bold">
              {{ clockInData.learningGoal.dailyNewWords }}词/天
            </text>
          </view>

          <!-- 复习目标 -->
          <view class="rounded-lg bg-green-50 p-4">
            <view class="flex items-center">
              <view class="i-carbon:review text-xl text-green-500" />
              <text class="ml-2 text-sm text-gray-600">
                单词复习
              </text>
            </view>
            <text class="mt-1 block text-2xl text-gray-800 font-bold">
              {{ clockInData.learningGoal.dailyReviewWords }}词/天
            </text>
          </view>
        </view>
      </view>

      <!-- 今日打卡状态 -->
      <view class="rounded-xl bg-white/70 p-5 shadow-sm backdrop-blur-sm">
        <text class="mb-4 block text-lg text-gray-800 font-medium">
          今日打卡状态
        </text>

        <view v-if="clockInData.todayCompleted" class="flex items-center justify-center rounded-xl bg-green-50 p-6">
          <view class="i-carbon:checkmark-filled mr-2 text-2xl text-green-500" />
          <text class="text-lg text-green-700 font-medium">
            已完成今日学习任务
          </text>
        </view>
        <view v-else class="flex items-center justify-center rounded-xl bg-yellow-50 p-6">
          <view class="i-carbon:warning mr-2 text-2xl text-yellow" />
          <text class="text-lg text-yellow-700 font-medium">
            今日学习任务未完成
          </text>
        </view>
      </view>

      <!-- 过去一周打卡 -->
      <view class="rounded-xl bg-white/70 p-5 shadow-sm backdrop-blur-sm">
        <text class="mb-4 block text-lg text-gray-800 font-medium">
          过去一周打卡记录
        </text>

        <view class="flex overflow-x-auto py-2 space-x-3">
          <view
            v-for="(day, index) in clockInData.weeklyData"
            :key="index"
            class="min-w-20 flex flex-col items-center"
          >
            <!-- 日期 -->
            <text class="text-sm text-gray-500">
              {{ getDayOfWeek(day.date) }}
            </text>

            <!-- 打卡状态图标 -->
            <view
              class="my-2 h-10 w-10 flex items-center justify-center rounded-full" :class="[
                day.completed ? 'bg-green-500' : 'bg-gray-200',
              ]"
            >
              <view v-if="day.completed" class="i-carbon:checkmark text-lg text-white" />
              <view v-else class="i-carbon:close text-lg text-gray-400" />
            </view>

            <!-- 学习数据 -->
            <view v-if="day.completed" class="text-center">
              <text class="block text-xs text-gray-600">
                新词: {{ day.newWordsLearned }}
              </text>
              <text class="block text-xs text-gray-600">
                复习: {{ day.wordsReviewed }}
              </text>
            </view>
            <view v-else class="text-center">
              <text class="block text-xs text-gray-600">
                未完成
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 组队打卡 -->
    <view v-else class="space-y-4">
      <view class="rounded-xl bg-white/70 p-5 shadow-sm backdrop-blur-sm">
        <text class="mb-4 block text-lg text-gray-800 font-medium">
          好友列表
        </text>

        <view v-if="friends.length === 0" class="py-8 text-center text-gray-500">
          暂无好友，快去添加好友一起学习吧！
        </view>
        <view v-else class="space-y-3">
          <view
            v-for="friend in friends"
            :key="friend.id"
            class="flex items-center justify-between rounded-lg bg-gray-50 p-3"
          >
            <view class="flex items-center">
              <!-- 头像 -->
              <view class="h-12 w-12 overflow-hidden rounded-full bg-gray-300">
                <image
                  :src="friend.avatar"
                  mode="aspectFill"
                  class="h-full w-full object-cover"
                />
              </view>
              <!-- 名字和天数 -->
              <view class="ml-3">
                <text class="block text-gray-800 font-medium">
                  {{ friend.name }}
                </text>
                <text class="text-sm text-gray-500">
                  已坚持 {{ friend.streak }} 天
                </text>
              </view>
            </view>
            <!-- 发起挑战按钮 -->
            <view
              class="cursor-pointer rounded-lg bg-yellow px-3 py-2 text-white font-medium shadow-sm transition-all active:scale-98"
              @click="initiateChallenge(friend.id, friend.name)"
            >
              发起挑战
            </view>
          </view>
        </view>
      </view>

      <!-- 组队介绍 -->
      <view class="mt-4 border border-yellow/30 rounded-xl bg-yellow/10 p-4">
        <view class="flex">
          <view class="i-carbon:idea text-xl text-yellow" />
          <text class="ml-2 text-sm text-gray-700">
            <text class="font-medium">
              组队学习小贴士:
            </text>
            和好友一起打卡学习，互相监督，共同进步！组队挑战成功后双方都将获得额外积分奖励。
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* 渐变背景 */
.bg-gradient-to-r {
  background: linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to));
}

/* 按钮按下效果 */
.active\:scale-98:active {
  transform: scale(0.98);
}
</style>

<route lang="json">
{
  "layout": "default"
}
</route>
