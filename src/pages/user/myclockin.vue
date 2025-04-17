<script lang="ts">
import BackButton from '@/components/BackButton.vue'
import { API_BASE_URL } from '@/config/api'
import { computed, defineComponent, onMounted, ref } from 'vue'

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

// 更新好友接口定义，移除streak字段
interface Friend {
  friendshipId: number
  friendId: string
  username: string
  nickname: string | null
  avatar: string | null
  email: string
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

// 定义打卡响应接口
interface ClockInResponse {
  streakDays: number
  reviewWordsTarget: number
  success: boolean
  newWordsCompleted: number
  reviewWordsCompleted: number
  newWordsTarget: number
}

// 用户挑战接口定义
interface UserChallenge {
  challengeId: number
  name: string
  description: string
  dailyWordsTarget: number
  wordsCompleted: number
  startDate: string
  endDate: string
  status: string // 'active', 'rejected', etc.
  streakDays: number
  partnerId: string
  partnerUsername: string
  partnerAvatar: string | null
  partnerTodayClockInStatus: boolean
  todayClockInStatus: boolean
  isCreator: boolean
}

// 挑战打卡响应接口
interface ChallengeClockInResponse {
  streakDays: number
  dailyWordsTarget: number
  success: boolean
  partnerAchieved: boolean
  bothAchieved: boolean
  wordsCompleted: number
  achieved: boolean
}

// 挑战结果接口定义
interface ChallengeResult {
  dailyWordsTarget: number
  endDate: string
  successDays: number
  successRate: number
  userTotalWords: number
  streakDays: number
  dailyRecords: Array<{
    date: string
    bothCompleted: boolean
  }>
  challengeId: number
  totalDays: number
  partnerTotalWords: number
  name: string
  startDate: string
  status: string
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

    // 活动挑战列表
    const challenges = ref<UserChallenge[]>([])

    // 挑战标签状态
    const challengeTab = ref('active') // 'active' 或 'completed'

    // 挑战结果相关状态
    const showResultModal = ref(false)
    const currentChallengeResult = ref<ChallengeResult | null>(null)

    // 计算属性：进行中的挑战
    const activeChallenges = computed(() => {
      const today = new Date().toISOString().split('T')[0]
      return challenges.value.filter(challenge =>
        challenge.status === 'active'
        && new Date(challenge.endDate) >= new Date(today), // 恢复为大于等于今天的是进行中
      )
    })

    // 计算属性：已结束的挑战
    const completedChallenges = computed(() => {
      const today = new Date().toISOString().split('T')[0]
      return challenges.value.filter(challenge =>
        challenge.status === 'active'
        && new Date(challenge.endDate) < new Date(today), // 恢复为小于今天的是已结束
      )
    })

    // 打卡按钮状态
    const isClockingIn = ref(false)

    // 添加挑战打卡状态
    const isChallengeClockingIn = ref<Record<number, boolean>>({})

    // 创建挑战相关状态
    const showChallengeModal = ref(false)
    const selectedFriend = ref<Friend | null>(null)
    const challengeForm = ref({
      name: '',
      description: '',
      dailyWordsTarget: 20,
      durationDays: 7,
    })
    const isCreatingChallenge = ref(false)

    // 切换标签页
    const switchTab = (tab: string) => {
      activeTab.value = tab
    }

    // 切换挑战标签
    const switchChallengeTab = (tab: string) => {
      challengeTab.value = tab
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

    // 获取好友列表 - 使用实际API
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

        // 使用真实API获取好友列表
        const url = `${API_BASE_URL}/api/v1/friends/list`

        // eslint-disable-next-line no-console
        console.log('获取好友列表:', url)

        const response = await uni.request({
          url,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200 && Array.isArray(response.data)) {
          friends.value = response.data as Friend[]

          // eslint-disable-next-line no-console
          console.log('获取到的好友列表:', friends.value)
        }
        else {
          console.error('获取好友列表失败:', response)
        }
      }
      catch (error) {
        console.error('获取好友列表错误:', error)
      }
    }

    // 获取用户参与的挑战
    const fetchUserChallenges = async () => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        // 调用API获取用户的所有挑战
        const url = `${API_BASE_URL}/api/v1/team-challenges/user`

        // eslint-disable-next-line no-console
        console.log('获取用户挑战:', url)

        const response = await uni.request({
          url,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200 && Array.isArray(response.data)) {
          // 获取所有挑战，不再过滤
          challenges.value = response.data as UserChallenge[]

          // eslint-disable-next-line no-console
          console.log('获取到的所有挑战:', challenges.value)
          // eslint-disable-next-line no-console
          console.log('进行中的挑战:', activeChallenges.value)
          // eslint-disable-next-line no-console
          console.log('已结束的挑战:', completedChallenges.value)
        }
        else {
          console.error('获取用户挑战失败:', response)
        }
      }
      catch (error) {
        console.error('获取用户挑战错误:', error)
      }
    }

    // 执行打卡操作
    const handleClockIn = async () => {
      if (isClockingIn.value)
        return

      isClockingIn.value = true

      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        const url = `${API_BASE_URL}/api/v1/clock-in/try`

        // eslint-disable-next-line no-console
        console.log('发送打卡请求:', url)

        const response = await uni.request({
          url,
          method: 'POST',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200) {
          const data = response.data as ClockInResponse

          if (data.success) {
            // 打卡成功
            uni.showToast({
              title: '打卡成功！',
              icon: 'success',
            })

            // 更新今日完成状态
            clockInData.value.todayCompleted = true

            // 更新学习目标
            clockInData.value.learningGoal.dailyNewWords = data.newWordsTarget
            clockInData.value.learningGoal.dailyReviewWords = data.reviewWordsTarget

            // 更新今日学习数据
            const today = new Date().toISOString().split('T')[0]
            const todayIndex = clockInData.value.weeklyData.findIndex(day => day.date === today)

            if (todayIndex !== -1) {
              clockInData.value.weeklyData[todayIndex].completed = true
              clockInData.value.weeklyData[todayIndex].newWordsLearned = data.newWordsCompleted
              clockInData.value.weeklyData[todayIndex].wordsReviewed = data.reviewWordsCompleted
            }

            // 重新获取一周数据以确保显示最新状态
            await fetchWeeklyClockIn()
          }
          else {
            // 打卡失败
            uni.showToast({
              title: '打卡失败: 学习任务未完成',
              icon: 'none',
            })
          }

          // eslint-disable-next-line no-console
          console.log('打卡响应:', data)
        }
        else {
          uni.showToast({
            title: '打卡失败，请稍后重试',
            icon: 'none',
          })
          console.error('打卡失败:', response)
        }
      }
      catch (error) {
        console.error('打卡请求错误:', error)
        uni.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none',
        })
      }
      finally {
        isClockingIn.value = false
      }
    }

    // 挑战打卡函数 - 修正打卡逻辑
    const handleChallengeClockIn = async (challengeId: number) => {
      // 防止重复点击
      if (isChallengeClockingIn.value[challengeId])
        return

      // 设置打卡中状态
      isChallengeClockingIn.value[challengeId] = true

      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        const url = `${API_BASE_URL}/api/v1/team-challenges/${challengeId}/clock-in`

        // eslint-disable-next-line no-console
        console.log('挑战打卡请求:', url)

        const response = await uni.request({
          url,
          method: 'POST',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200) {
          const data = response.data as ChallengeClockInResponse

          // 调试输出
          // eslint-disable-next-line no-console
          console.log('挑战打卡响应:', data)

          // 修改逻辑：检查achieved字段而不是success字段
          if (data.achieved) {
            // 真正完成了打卡任务
            // 更新本地挑战状态
            const challenge = activeChallenges.value.find(c => c.challengeId === challengeId)
            if (challenge) {
              challenge.todayClockInStatus = true
              challenge.wordsCompleted = data.wordsCompleted
              challenge.streakDays = data.streakDays
            }

            // 显示打卡结果
            let message = '挑战打卡成功！'
            if (data.bothAchieved) {
              message = '双方都已完成打卡，获得额外奖励！'
            }
            else if (data.partnerAchieved) {
              message = '打卡成功！你的伙伴也已打卡'
            }

            uni.showToast({
              title: message,
              icon: 'success',
              duration: 2000,
            })
          }
          else {
            // 未完成打卡任务
            uni.showToast({
              title: '打卡失败：未完成挑战目标',
              icon: 'none',
              duration: 2000,
            })
          }
        }
        else {
          uni.showToast({
            title: '打卡失败，请稍后重试',
            icon: 'none',
          })
          console.error('挑战打卡失败:', response)
        }
      }
      catch (error) {
        console.error('挑战打卡请求错误:', error)
        uni.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none',
        })
      }
      finally {
        // 重置打卡中状态
        isChallengeClockingIn.value[challengeId] = false
      }
    }

    // 获取挑战结果
    const fetchChallengeResult = async (challengeId: number) => {
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return null
        }

        const url = `${API_BASE_URL}/api/v1/team-challenges/${challengeId}/result`

        // eslint-disable-next-line no-console
        console.log('获取挑战结果:', url)

        const response = await uni.request({
          url,
          method: 'GET',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200) {
          // eslint-disable-next-line no-console
          console.log('获取到的挑战结果:', response.data)
          return response.data as ChallengeResult
        }
        else {
          console.error('获取挑战结果失败:', response)
          return null
        }
      }
      catch (error) {
        console.error('获取挑战结果错误:', error)
        return null
      }
    }

    // 处理查看挑战结果
    const handleViewResult = async (challengeId: number) => {
      const result = await fetchChallengeResult(challengeId)
      if (result) {
        // 找到对应的挑战以获取伙伴用户名
        const challenge = challenges.value.find(c => c.challengeId === challengeId)
        if (challenge) {
          // 合并挑战结果和伙伴信息
          currentChallengeResult.value = {
            ...result,
            partnerUsername: challenge.partnerUsername,
          } as ChallengeResult & { partnerUsername: string }
        }
        else {
          currentChallengeResult.value = result
        }
        showResultModal.value = true
      }
      else {
        uni.showToast({
          title: '获取挑战结果失败',
          icon: 'none',
        })
      }
    }

    // 关闭结果模态框
    const closeResultModal = () => {
      showResultModal.value = false
      currentChallengeResult.value = null
    }

    // 发起组队挑战 - 更新为显示挑战创建模态框
    const initiateChallenge = (friendId: string, friendName: string) => {
      // 查找选中的好友
      const friend = friends.value.find(f => f.friendId === friendId)
      if (friend) {
        selectedFriend.value = friend

        // 预填挑战名称
        challengeForm.value.name = `与 ${friendName} 的单词挑战`

        // 显示创建挑战模态框
        showChallengeModal.value = true
      }
      else {
        uni.showToast({
          title: '好友信息获取失败',
          icon: 'none',
        })
      }
    }

    // 关闭挑战模态框
    const closeChallengeModal = () => {
      showChallengeModal.value = false
      selectedFriend.value = null
      // 重置表单
      challengeForm.value = {
        name: '',
        description: '',
        dailyWordsTarget: 20,
        durationDays: 7,
      }
    }

    // 创建挑战
    const createChallenge = async () => {
      if (!selectedFriend.value)
        return

      // 基本表单验证
      if (!challengeForm.value.name) {
        uni.showToast({
          title: '请输入挑战名称',
          icon: 'none',
        })
        return
      }

      if (challengeForm.value.dailyWordsTarget < 1) {
        uni.showToast({
          title: '每日目标必须大于0',
          icon: 'none',
        })
        return
      }

      if (challengeForm.value.durationDays < 1) {
        uni.showToast({
          title: '挑战天数必须大于0',
          icon: 'none',
        })
        return
      }

      isCreatingChallenge.value = true

      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          uni.showToast({
            title: '请先登录',
            icon: 'none',
          })
          return
        }

        // 构建请求参数
        const params = new URLSearchParams()
        params.append('partnerId', selectedFriend.value.friendId)
        params.append('name', challengeForm.value.name)
        if (challengeForm.value.description) {
          params.append('description', challengeForm.value.description)
        }
        params.append('dailyWordsTarget', challengeForm.value.dailyWordsTarget.toString())
        params.append('durationDays', challengeForm.value.durationDays.toString())

        // 调用创建挑战API
        const url = `${API_BASE_URL}/api/v1/team-challenges/create?${params.toString()}`

        const response = await uni.request({
          url,
          method: 'POST',
          header: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.statusCode === 200) {
          uni.showToast({
            title: '挑战创建成功！',
            icon: 'success',
          })

          // 关闭模态框
          closeChallengeModal()
        }
        else {
          let errorMessage = '创建挑战失败'

          if (response.data && typeof response.data === 'object' && 'message' in response.data) {
            errorMessage = (response.data as any).message || errorMessage
          }

          uni.showToast({
            title: errorMessage,
            icon: 'none',
          })

          console.error('创建挑战失败:', response.data)
        }
      }
      catch (error) {
        console.error('创建挑战请求错误:', error)
        uni.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none',
        })
      }
      finally {
        isCreatingChallenge.value = false
      }
    }

    // 跳转到挑战信息页面
    const navigateToChallengeInfo = () => {
      uni.navigateTo({
        url: '/pages/user/mychallengeinfo',
      })
    }

    // 初始化数据
    const initData = async () => {
      isLoading.value = true
      errorMessage.value = ''

      try {
        await Promise.all([
          fetchClockInData(),
          fetchFriends(),
          fetchUserChallenges(), // 添加获取挑战数据
        ])
      }
      catch (error) {
        errorMessage.value = '获取数据失败，请重试'
        console.error('初始化数据失败:', error)
      }
      finally {
        isLoading.value = false
      }
    }

    // 格式化日期范围显示
    const formatDateRange = (startDate: string, endDate: string) => {
      return `${startDate.split('T')[0]} 至 ${endDate.split('T')[0]}`
    }

    // 返回上一页
    const handleBack = () => {
      uni.navigateBack()
    }

    // 跳转到查找好友页面
    const navigateToFindFriends = () => {
      uni.navigateTo({
        url: '/pages/user/findfriends',
      })
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
      challenges,
      activeChallenges,
      completedChallenges,
      challengeTab,
      switchTab,
      switchChallengeTab,
      handleBack,
      initiateChallenge,
      getDayOfWeek,
      handleClockIn,
      isClockingIn,
      navigateToFindFriends,
      showChallengeModal,
      challengeForm,
      selectedFriend,
      isCreatingChallenge,
      closeChallengeModal,
      createChallenge,
      navigateToChallengeInfo,
      formatDateRange,
      handleChallengeClockIn,
      isChallengeClockingIn,
      showResultModal,
      currentChallengeResult,
      handleViewResult,
      closeResultModal,
    }
  },
})
</script>

<template>
  <view class="clock-in-page px-4 py-4">
    <BackButton @back="handleBack" />

    <!-- 铃铛图标 - 添加在右上角，固定位置 -->
    <view
      class="fixed right-4 top-4 z-50 h-12 w-12 flex items-center justify-center rounded-full shadow-sm frosted-glass"
      @click="navigateToChallengeInfo"
    >
      <view class="i-carbon:notification text-xl" />
    </view>

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

        <!-- 添加打卡按钮 -->
        <view class="mt-4 flex justify-center">
          <button
            class="flex items-center justify-center rounded-lg px-6 py-3 transition-all active:scale-98"
            :class="[
              clockInData.todayCompleted
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-yellow text-white font-medium shadow-sm',
            ]"
            :disabled="clockInData.todayCompleted || isClockingIn"
            @click="handleClockIn"
          >
            <view v-if="isClockingIn" class="i-carbon:progress-bar mr-2 animate-spin text-xl" />
            <text>{{ isClockingIn ? '打卡中...' : '立即打卡' }}</text>
          </button>
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
      <!-- 好友列表 - 修改为固定高度和滚动条 -->
      <view class="rounded-xl bg-white/70 p-5 shadow-sm backdrop-blur-sm">
        <text class="mb-4 block text-lg text-gray-800 font-medium">
          好友列表
        </text>

        <view v-if="friends.length === 0" class="py-8 text-center text-gray-500">
          暂无好友，快去添加好友一起学习吧！
        </view>
        <view v-else class="h-56 overflow-y-auto pr-2">
          <view
            v-for="friend in friends"
            :key="friend.friendId"
            class="mb-3 flex items-center justify-between rounded-lg bg-gray-50 p-3"
          >
            <view class="flex items-center">
              <!-- 头像 -->
              <view class="h-12 w-12 overflow-hidden rounded-full bg-gray-300">
                <image
                  v-if="friend.avatar"
                  :src="friend.avatar"
                  mode="aspectFill"
                  class="h-full w-full object-cover"
                />
                <text v-else class="text-xl text-white font-bold">
                  {{ friend.username.charAt(0).toUpperCase() }}
                </text>
              </view>
              <!-- 名字 -->
              <view class="ml-3">
                <text class="block text-gray-800 font-medium">
                  {{ friend.nickname || friend.username }}
                </text>
              </view>
            </view>
            <!-- 发起挑战按钮 -->
            <view
              class="cursor-pointer rounded-lg bg-yellow px-3 py-2 text-white font-medium shadow-sm transition-all active:scale-98"
              @click="initiateChallenge(friend.friendId, friend.nickname || friend.username)"
            >
              发起挑战
            </view>
          </view>
        </view>
      </view>

      <!-- 活动挑战列表 -->
      <view class="rounded-xl bg-white/70 p-5 shadow-sm backdrop-blur-sm">
        <!-- 挑战标签页切换 -->
        <view class="mb-4">
          <text class="block text-lg text-gray-800 font-medium">
            我的挑战
          </text>
          <view class="mt-3 flex rounded-full bg-gray-100 p-1">
            <view
              class="flex-1 rounded-full py-2 text-center transition-all"
              :class="[
                challengeTab === 'active' ? 'bg-white shadow-sm text-yellow font-medium' : 'text-gray-600',
              ]"
              @click="switchChallengeTab('active')"
            >
              进行中的挑战
            </view>
            <view
              class="flex-1 rounded-full py-2 text-center transition-all"
              :class="[
                challengeTab === 'completed' ? 'bg-white shadow-sm text-yellow font-medium' : 'text-gray-600',
              ]"
              @click="switchChallengeTab('completed')"
            >
              已结束的挑战
            </view>
          </view>
        </view>

        <!-- 进行中的挑战列表 -->
        <view v-if="challengeTab === 'active'">
          <view v-if="activeChallenges.length === 0" class="py-8 text-center text-gray-500">
            暂无进行中的挑战
          </view>
          <view v-else class="text-yellow space-y-3">
            <view
              v-for="challenge in activeChallenges"
              :key="challenge.challengeId"
              class="rounded-lg bg-gray-50 p-4"
            >
              <view class="mb-2">
                <text class="text-lg font-medium">
                  {{ challenge.name }}
                </text>
              </view>

              <view v-if="challenge.description" class="mb-2 rounded-lg bg-gray-100 p-2">
                <text class="text-sm text-gray-700">
                  {{ challenge.description }}
                </text>
              </view>

              <view class="grid grid-cols-2 gap-2">
                <view class="text-sm">
                  <text class="text-gray-500">
                    挑战对象:
                  </text>
                  <text>{{ challenge.partnerUsername }}</text>
                </view>
                <view class="text-sm">
                  <text class="text-gray-500">
                    每日目标:
                  </text>
                  <text>{{ challenge.dailyWordsTarget }}词</text>
                </view>
                <view class="text-sm">
                  <text class="text-gray-500">
                    连续天数:
                  </text>
                  <text>{{ challenge.streakDays }}天</text>
                </view>
                <view class="text-sm">
                  <text class="text-gray-500">
                    已完成:
                  </text>
                  <text>{{ challenge.wordsCompleted }}词</text>
                </view>
                <view class="col-span-2 text-sm">
                  <text class="text-gray-500">
                    挑战期间:
                  </text>
                  <text>{{ formatDateRange(challenge.startDate, challenge.endDate) }}</text>
                </view>
              </view>

              <view class="mt-3 flex items-center justify-between">
                <view class="flex items-center">
                  <view
                    class="h-4 w-4 rounded-full"
                    :class="challenge.todayClockInStatus ? 'bg-green-500' : 'bg-gray-300'"
                  />
                  <text class="ml-1 text-xs">
                    {{ challenge.todayClockInStatus ? '今日已打卡' : '今日未打卡' }}
                  </text>
                </view>
                <view class="flex items-center">
                  <view
                    class="h-4 w-4 rounded-full"
                    :class="challenge.partnerTodayClockInStatus ? 'bg-green-500' : 'bg-gray-300'"
                  />
                  <text class="ml-1 text-xs">
                    {{ challenge.partnerTodayClockInStatus ? '对方已打卡' : '对方未打卡' }}
                  </text>
                </view>
              </view>

              <!-- 添加挑战打卡按钮 -->
              <view class="mt-4 flex justify-center">
                <button
                  class="flex items-center justify-center rounded-lg px-6 py-1 transition-all active:scale-98"
                  :class="[
                    challenge.todayClockInStatus
                      ? 'bg-purple text-white cursor-not-allowed'
                      : 'bg-yellow text-white font-medium shadow-sm',
                  ]"
                  :disabled="challenge.todayClockInStatus || !!isChallengeClockingIn[challenge.challengeId]"
                  @click="handleChallengeClockIn(challenge.challengeId)"
                >
                  <view v-if="isChallengeClockingIn[challenge.challengeId]" class="i-carbon:progress-bar mr-2 animate-spin text-xl" />
                  <text>{{ isChallengeClockingIn[challenge.challengeId] ? '打卡中...' : (challenge.todayClockInStatus ? '已打卡' : '挑战打卡') }}</text>
                </button>
              </view>
            </view>
          </view>
        </view>

        <!-- 已结束的挑战列表 -->
        <view v-else-if="challengeTab === 'completed'">
          <view v-if="completedChallenges.length === 0" class="py-8 text-center text-gray-500">
            暂无已结束的挑战
          </view>
          <view v-else class="text-yellow space-y-3">
            <view
              v-for="challenge in completedChallenges"
              :key="challenge.challengeId"
              class="rounded-lg bg-gray-50 p-4"
            >
              <view class="mb-2">
                <text class="text-lg font-medium">
                  {{ challenge.name }}
                </text>
                <text class="ml-2 text-xs text-gray-500">
                  (已结束)
                </text>
              </view>

              <view v-if="challenge.description" class="mb-2 rounded-lg bg-gray-100 p-2">
                <text class="text-sm text-gray-700">
                  {{ challenge.description }}
                </text>
              </view>

              <!-- 修改这里：改为每行一个信息，只保留三项 -->
              <view class="mb-3 space-y-2">
                <view class="text-sm">
                  <text class="text-gray-500">
                    挑战对象:
                  </text>
                  <text>{{ challenge.partnerUsername }}</text>
                </view>
                <view class="text-sm">
                  <text class="text-gray-500">
                    每日目标:
                  </text>
                  <text>{{ challenge.dailyWordsTarget }}词</text>
                </view>
                <view class="text-sm">
                  <text class="text-gray-500">
                    挑战期间:
                  </text>
                  <text>{{ formatDateRange(challenge.startDate, challenge.endDate) }}</text>
                </view>
              </view>

              <!-- 添加查看结果按钮 -->
              <view class="mt-4 flex justify-center">
                <button
                  class="rounded-lg bg-blue-500 px-6 py-1 text-white font-medium shadow-sm"
                  @click="handleViewResult(challenge.challengeId)"
                >
                  查看结果
                </button>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 组队介绍 -->
      <view class="mt-4 border border-yellow/30 rounded-xl bg-yellow/10 p-4">
        <view class="flex">
          <view class="i-carbon:idea text-xl text-yellow" />
          <text class="ml-2 text-sm">
            <text class="font-medium">
              组队学习小贴士:
            </text>
            和好友一起打卡学习，互相监督，共同进步！
          </text>
        </view>
      </view>

      <!-- 添加"去添加好友"按钮 -->
      <view
        class="fixed bottom-24 right-6 z-10 h-14 w-14 flex cursor-pointer items-center justify-center rounded-full bg-yellow shadow-lg transition-transform active:scale-95"
        @click="navigateToFindFriends"
      >
        <view class="i-carbon:user-follow text-2xl text-white" />
      </view>
    </view>

    <!-- 挑战创建模态框 -->
    <view v-if="showChallengeModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <view class="max-w-sm w-4/5 rounded-lg p-6 frosted-glass">
        <text class="mb-4 block text-center text-xl font-bold">
          创建组队挑战
        </text>

        <view v-if="selectedFriend" class="mb-4 flex items-center rounded-lg bg-gray-50 p-2">
          <!-- 对方头像 -->
          <view class="h-12 w-12 overflow-hidden rounded-full bg-gray-300">
            <image
              v-if="selectedFriend.avatar"
              :src="selectedFriend.avatar"
              mode="aspectFill"
              class="h-full w-full object-cover"
            />
            <text v-else class="text-xl text-white font-bold">
              {{ selectedFriend.username.charAt(0).toUpperCase() }}
            </text>
          </view>
          <!-- 用户名 -->
          <view class="ml-3">
            <text class="block text-gray-800 font-medium">
              {{ selectedFriend.nickname || selectedFriend.username }}
            </text>
            <text class="text-xs text-gray-500">
              {{ selectedFriend.email }}
            </text>
          </view>
        </view>

        <!-- 挑战表单 -->
        <view class="space-y-4">
          <!-- 挑战名称 -->
          <view>
            <text class="mb-1 block text-sm font-medium">
              挑战名称 <text class="text-red-500">
                *
              </text>
            </text>
            <input
              v-model="challengeForm.name"
              placeholder="输入挑战名称"
              class="w-full border border-gray-300 rounded p-2"
            >
          </view>

          <!-- 挑战描述 -->
          <view>
            <text class="mb-1 block text-sm font-medium">
              挑战描述
            </text>
            <textarea
              v-model="challengeForm.description"
              placeholder="简要描述这个挑战（可选）"
              class="w-full border border-gray-300 rounded p-2"
              :maxlength="100"
            />
          </view>

          <!-- 每日单词目标 -->
          <view>
            <text class="mb-1 block text-sm font-medium">
              每日单词目标 <text class="text-red-500">
                *
              </text>
            </text>
            <input
              v-model.number="challengeForm.dailyWordsTarget"
              type="number"
              placeholder="每日需要学习的单词数"
              class="w-full border border-gray-300 rounded p-2"
              min="1"
            >
          </view>

          <!-- 挑战天数 -->
          <view>
            <text class="mb-1 block text-sm font-medium">
              挑战天数（实际挑战天数为输入的数字加一） <text class="text-red-500">
                *
              </text>
            </text>
            <input
              v-model.number="challengeForm.durationDays"
              type="number"
              placeholder="挑战持续天数"
              class="w-full border border-gray-300 rounded p-2"
              min="1"
              max="30"
            >
          </view>
        </view>

        <!-- 操作按钮 - 修改布局使按钮居中均匀分布 -->
        <view class="mt-6 flex justify-center space-x-4">
          <button
            class="w-1/2 rounded-lg bg-gray-200 py-2 text-center text-gray-700"
            @click="closeChallengeModal"
          >
            取消
          </button>
          <button
            class="w-1/2 flex items-center justify-center rounded-lg bg-yellow py-2 text-white"
            :disabled="isCreatingChallenge"
            @click="createChallenge"
          >
            <view v-if="isCreatingChallenge" class="i-carbon:progress-bar mr-2 animate-spin" />
            <text>{{ isCreatingChallenge ? '创建中...' : '创建挑战' }}</text>
          </button>
        </view>
      </view>
    </view>

    <!-- 挑战结果模态框 -->
    <view v-if="showResultModal && currentChallengeResult" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <view class="max-h-[80vh] w-4/5 overflow-y-auto rounded-lg p-6 frosted-glass">
        <text class="mb-4 block text-center text-xl font-bold">
          挑战结果
        </text>

        <view class="space-y-4">
          <!-- 修改这里：改为垂直排列 -->
          <view class="space-y-2">
            <view class="text-sm">
              <text class="text-yellow">
                挑战对象:
              </text>
              <text>{{ (currentChallengeResult as any).partnerUsername || '未知' }}</text>
            </view>
            <view class="text-sm">
              <text class="text-yellow">
                挑战期间:
              </text>
              <text>{{ formatDateRange(currentChallengeResult.startDate, currentChallengeResult.endDate) }}</text>
            </view>
          </view>

          <view class="mt-3 rounded-lg bg-gray-50 p-3">
            <text class="mb-2 block text-center font-medium">
              挑战结果
            </text>
            <view class="grid grid-cols-2 gap-2 text-yellow">
              <view class="text-sm">
                <text class="text-gray-500">
                  成功天数:
                </text>
                <text>{{ currentChallengeResult.successDays }}/{{ currentChallengeResult.totalDays }}天</text>
              </view>
              <view class="text-sm">
                <text class="text-gray-500">
                  成功率:
                </text>
                <text>{{ Math.round(currentChallengeResult.successRate * 100) }}%</text>
              </view>
              <view class="text-sm">
                <text class="text-gray-500">
                  您完成单词:
                </text>
                <text>{{ currentChallengeResult.userTotalWords }}词</text>
              </view>
              <view class="text-sm">
                <text class="text-gray-500">
                  对方完成单词:
                </text>
                <text>{{ currentChallengeResult.partnerTotalWords }}词</text>
              </view>
            </view>
          </view>

          <!-- 每日记录 -->
          <view class="mt-2">
            <text class="mb-2 block text-gray-700 font-medium">
              每日完成情况:
            </text>
            <view class="max-h-[25vh] overflow-y-auto">
              <view
                v-for="(record, index) in currentChallengeResult.dailyRecords"
                :key="index"
                class="mb-1 flex items-center justify-between rounded-lg p-2"
                :class="record.bothCompleted ? 'bg-green' : 'bg-red'"
              >
                <text>{{ record.date }}</text>
                <text>{{ record.bothCompleted ? '双方完成' : '未同时完成' }}</text>
              </view>
            </view>
          </view>
        </view>

        <view class="mt-6 flex justify-center">
          <button
            class="rounded-lg bg-blue-500 px-6 py-2 text-white font-medium"
            @click="closeResultModal"
          >
            关闭
          </button>
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
