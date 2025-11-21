/**
 * localStorage 工具函数
 * 提供类型安全的存储/读取，支持 SSR 环境（服务端返回 null）
 */

/**
 * 从 localStorage 读取数据
 * @param key 存储键名
 * @returns 解析后的数据，失败或不存在返回 null
 */
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

/**
 * 写入数据到 localStorage
 * @param key 存储键名
 * @param value 要存储的数据（会自动 JSON 序列化）
 */
export const setLocalStorageItem = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 忽略存储异常（如存储空间已满），保持前端离线可用
  }
}

