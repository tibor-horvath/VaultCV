/** Rejects with a step-labelled error if `promise` has not settled within `timeoutMs`. */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, stepLabel: string): Promise<T> {
  return new Promise((resolve, reject) => {
    let done = false
    const timer = setTimeout(() => {
      if (done) return
      done = true
      reject(new Error(`PDF generation timed out while ${stepLabel}.`))
    }, timeoutMs)
    promise
      .then((value) => {
        if (done) return
        done = true
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        if (done) return
        done = true
        clearTimeout(timer)
        reject(error)
      })
  })
}
