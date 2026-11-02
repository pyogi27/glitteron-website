/**
 * Queue an analytics event on window.dataLayer. No analytics tool is installed yet;
 * GTM or GA4 read entries queued before they load. Does nothing on the server.
 */
export function track(event: string, params: Record<string, string | number> = {}): void {
  if (typeof window === 'undefined') return
  const w = window as typeof window & { dataLayer?: unknown[] }
  w.dataLayer = w.dataLayer ?? []
  w.dataLayer.push({ event, ...params })
}
