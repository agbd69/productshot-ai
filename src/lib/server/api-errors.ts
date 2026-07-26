export function getErrorStatus(message: string, fallbackStatus = 500) {
  return message.includes("Sign in") || message.includes("请先登录") ? 401 : fallbackStatus;
}
