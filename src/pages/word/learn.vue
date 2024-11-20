<script>
export default {
  data() {
    return {
      word: 'hybrid',
      pronunciation: '/ˈhaɪbrɪd/',
      definitions: [
        'n. 杂交动物或植物；合成物',
        'adj. 杂交的；合成的；混合动力的',
      ],
      example: 'In biology, a hybrid is an animal or a plant produced from two different species.',
      exampleTranslation: '在生物学上，“杂种”就是由两种不同的物种繁殖出的动物或植物。',
    }
  },
  methods: {
    onNextWord() {
      // eslint-disable-next-line no-alert
      alert('Next Word button clicked')
      // Placeholder logic for "Next Word"
    },
    onForgot() {
      // eslint-disable-next-line no-alert
      alert('Forgot button clicked')
      // Placeholder logic for "Forgot"
    },
  },
}
</script>

<template>
  <view class="learn-container">
    <!-- Wordcard Header -->
    <WordCardHeader :current-card="5" :total-cards="10" />
    <!-- Wordcard Content -->
    <scroll-view class="content" scroll-y>
      <view class="word">
        <text>{{ word }}</text>
      </view>
      <view class="pronunciation">
        <text>{{ pronunciation }}</text>
      </view>
      <view v-for="(definition, index) in definitions" :key="index" class="definition">
        <text>{{ definition }}</text>
      </view>
      <view class="example-container">
        <text class="example">
          {{ example }}
        </text>
        <br>
        <text class="example-translation">
          {{ exampleTranslation }}
        </text>
      </view>
    </scroll-view>

    <!-- Wordcard Footer -->
    <view class="footer">
      <view class="button-container" @click="onNextWord">
        <text class="button-text">
          下一词
        </text>
        <view class="indicator" style="background-color: #4CAF50;" />
      </view>

      <!-- Forgot Button -->
      <view class="button-container" @click="onForgot">
        <text class="button-text">
          记错了
        </text>
        <view class="indicator" style="background-color: #F44336;" />
      </view>
    </view>
  </view>
</template>

<style scoped>
.learn-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(to bottom, rgb(27, 71, 97), rgb(14, 39, 62));
  padding: 0;
  box-sizing: border-box;
}

.px-5.py-10 {
  padding: 0 !important; /* 强制移除 padding */
}

.content {
  flex: 1; /* Allow this area to grow and fill remaining space */
  overflow-y: auto; /* Enable vertical scrolling */
  width: 100%;
  padding: 0px 20px;
  box-sizing: border-box; /* Prevent overflow caused by padding */
}

.word {
  font-family: Verdana, sans-serif;
  text-align: left;
  font-size: 36px;
  font-weight: bold;
  color: rgb(223, 229, 234);
  margin-bottom: 10px;
}

.pronunciation {
  text-align: left;
  font-size: 18px;
  color: rgb(128, 155, 174);
  margin-bottom: 15px;
}

.definition {
  font-family: Verdana, sans-serif;
  text-align: left;
  font-size: 18px;
  color: rgb(214, 230, 238);
  margin-bottom: 5px;
}

.example-container {
  font-family: Arial, sans-serif;
  text-align: left;
  margin-top: 20px;
  background-color: rgba(255, 255, 255, 0.2); /* Semi-transparent background */
  border-radius: 10px;
  padding: 10px;
}

.example {
  font-size: 20px;
  color: rgb(214, 230, 238);
}

.example-translation {
  font-size: 18px;
  color: rgb(214, 230, 238);
}

.footer {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 30px 0; /* Add vertical padding */
}

.button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.button-text {
  font-family: Arial, sans-serif;
  font-size: 16px;
  color: #fff; /* White text color */
}

.indicator {
  width: 20px;
  height: 4px;
  border-radius: 2px;
  margin-top: 5px;
}
</style>
