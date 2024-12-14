import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages'

export default defineUniPages({
  pages: [
    {
      path: 'pages/user/login',
      type: 'home',
    },
    {
      path: 'pages/home/home',
      type: 'home',
    },
    {
      path: 'pages/community/community',
      type: 'page',
    },
    {
      path: 'pages/community/post',
      type: 'page',
    },
    {
      path: 'pages/community/posteditor',
      type: 'page',
    },
    {
      path: 'pages/user/mycontent',
      type: 'page',
    },
    {
      path: 'pages/user/mydata',
      type: 'page',
    },
    {
      path: 'pages/user/settings',
      type: 'page',
    },
    {
      path: 'pages/word/wordcards',
      type: 'page',
    },
  ],
  globalStyle: {
    backgroundColor: '@bgColor',
    backgroundColorBottom: '@bgColorBottom',
    backgroundColorTop: '@bgColorTop',
    backgroundTextStyle: '@bgTxtStyle',
    navigationBarBackgroundColor: '#000000',
    navigationBarTextStyle: '@navTxtStyle',
    navigationBarTitleText: 'Vitesse-Uni',
    navigationStyle: 'custom',
  },
  // tabBar: {
  //   backgroundColor: "@tabBgColor",
  //   borderStyle: "@tabBorderStyle",
  //   color: "@tabFontColor",
  //   selectedColor: "@tabSelectedColor",
  // },
})
