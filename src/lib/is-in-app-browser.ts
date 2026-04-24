export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Instagram|FBAN|FBAV|FB_IAB|FB4A|FBIOS|Twitter|TikTok|BytedanceWebview|Line\/|KAKAOTALK|Snapchat/i.test(ua);
}
