/**
 * How a play() attempt ended. play() rejects in normal operation, so none of
 * these is logged:
 *   blocked     NotAllowedError — autoplay policy, iOS Low Power Mode, or an
 *               unmuted play() on an element WebKit has not unlocked
 *   aborted     AbortError — a pause() or new load landed first (expected)
 *   unsupported anything else — codec or source the browser cannot play
 */
export type PlayResult = 'playing' | 'blocked' | 'aborted' | 'unsupported'

export async function safePlay(video: HTMLVideoElement): Promise<PlayResult> {
  try {
    await video.play()
    return 'playing'
  } catch (err) {
    const name = err instanceof DOMException ? err.name : ''
    if (name === 'NotAllowedError') return 'blocked'
    if (name === 'AbortError') return 'aborted'
    return 'unsupported'
  }
}

/**
 * Muted play, the only kind a browser allows without a gesture. React sets
 * `muted` as a property only on client-created elements, so set it here too.
 */
export function playMuted(video: HTMLVideoElement): Promise<PlayResult> {
  video.muted = true
  video.defaultMuted = true
  return safePlay(video)
}
