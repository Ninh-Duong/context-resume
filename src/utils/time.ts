import { useState, useEffect } from 'react'

export function formatRelativeTime(timestamp?: number, nowTimestamp = Date.now()): string {
  if (!timestamp) return ''
  const diff = Math.floor((nowTimestamp - timestamp) / 1000)
  if (diff < 30) return 'Vừa xong'
  if (diff < 60) return `${diff} giây trước`
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`
  return new Date(timestamp).toLocaleDateString('vi-VN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function useRealtimeClock(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [intervalMs])

  return now
}
