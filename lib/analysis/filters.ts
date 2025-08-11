// analysis/filters.ts
export class OneEuro {
  private xPrev = 0
  private dxPrev = 0
  private tPrev = 0
  private has = false
  constructor(
    private minCut = 1.0,
    private beta = 0.007,
    private dCut = 1.0,
  ) {}

  private alpha(cut: number, dt: number) {
    const r = 2 * Math.PI * cut * dt
    return r / (r + 1)
  }

  next(t: number, x: number) {
    if (!this.has) {
      this.has = true
      this.xPrev = x
      this.tPrev = t
      return x
    }
    const dt = Math.max(1e-3, t - this.tPrev)
    const dx = (x - this.xPrev) / dt
    const aD = this.alpha(this.dCut, dt)
    const dxHat = aD * dx + (1 - aD) * this.dxPrev
    const cut = this.minCut + this.beta * Math.abs(dxHat)
    const aX = this.alpha(cut, dt)
    const xHat = aX * x + (1 - aX) * this.xPrev
    this.tPrev = t
    this.xPrev = xHat
    this.dxPrev = dxHat
    return xHat
  }
}
