/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// Generated by vite-plugin-uni-pages

interface NavigateToOptions {
  url: "/pages/user/login" |
       "/pages/home/home" |
       "/pages/community/community" |
       "/pages/community/post" |
       "/pages/community/posteditor" |
       "/pages/learn/learnsettings" |
       "/pages/lexicon/createuserlexicon" |
       "/pages/lexicon/lexicondetail" |
       "/pages/lexicon/userlexicondetail" |
       "/pages/user/findfriends" |
       "/pages/user/mychallengeinfo" |
       "/pages/user/myclockin" |
       "/pages/user/mycontent" |
       "/pages/user/mydata" |
       "/pages/user/myinfo" |
       "/pages/user/mylexicon" |
       "/pages/user/myuserlexicon" |
       "/pages/user/selectlexicon" |
       "/pages/user/settings" |
       "/pages/user/totallearned" |
       "/pages/word/learn" |
       "/pages/word/review";
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
