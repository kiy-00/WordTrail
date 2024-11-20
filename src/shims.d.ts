export {}

declare module 'vue' {
  type Hooks = App.AppInstance & Page.PageInstance
  interface ComponentCustomOptions extends Hooks {}
}

declare module '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue' {

  export default component
}

declare module '@dcloudio/uni-ui/uni-icons' {

  export default component
}
