export interface Debounced<Args extends unknown[]> {
  (...args: Args): void
  cancel: () => void
  flush: (...args: Args) => void
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): Debounced<Args> {
  let timer: ReturnType<typeof setTimeout> | null = null

  function clear() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function debounced(...args: Args) {
    clear()
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, delayMs)
  }

  debounced.cancel = clear

  debounced.flush = (...args: Args) => {
    clear()
    fn(...args)
  }

  return debounced
}
