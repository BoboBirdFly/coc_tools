export const getLocalStorageItem = <T>(key: string): T | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export const setLocalStorageItem = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 忽略存储异常，保持前端离线可用
  }
}

