/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// Generated by vite-plugin-uni-pages

interface NavigateToOptions {
  url: "/pages/home/home" |
       "/pages/community/community" |
       "/pages/community/post" |
       "/pages/community/posteditor" |
       "/pages/user/mycontent" |
       "/pages/user/mydata" |
       "/pages/user/settings" |
       "/pages/word/wordcards" |
       "/pages/community/components/Comments" |
       "/pages/community/components/CommunityHeader" |
       "/pages/word/components/WordCardsHeader";
}
interface RedirectToOptions extends NavigateToOptions {}

interface SwitchTabOptions {
  
}

type ReLaunchOptions = NavigateToOptions | SwitchTabOptions;

declare interface Uni {
  navigateTo(options: UniNamespace.NavigateToOptions & NavigateToOptions): void;
  redirectTo(options: UniNamespace.RedirectToOptions & RedirectToOptions): void;
  switchTab(options: UniNamespace.SwitchTabOptions & SwitchTabOptions): void;
  reLaunch(options: UniNamespace.ReLaunchOptions & ReLaunchOptions): void;
}