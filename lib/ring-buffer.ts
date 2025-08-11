export class RingBuffer<T> {
  private buffer: T[]
  private head = 0
  private tail = 0
  private size = 0
  private readonly capacity: number

  constructor(capacity: number) {
    this.capacity = capacity
    this.buffer = new Array(capacity)
  }

  push(item: T): void {
    this.buffer[this.tail] = item
    this.tail = (this.tail + 1) % this.capacity

    if (this.size < this.capacity) {
      this.size++
    } else {
      this.head = (this.head + 1) % this.capacity
    }
  }

  getLatest(count: number = this.size): T[] {
    if (count <= 0 || this.size === 0) return []

    const result: T[] = []
    const actualCount = Math.min(count, this.size)

    for (let i = 0; i < actualCount; i++) {
      const index = (this.tail - 1 - i + this.capacity) % this.capacity
      result.unshift(this.buffer[index])
    }

    return result
  }

  getAll(): T[] {
    return this.getLatest()
  }

  clear(): void {
    this.head = 0
    this.tail = 0
    this.size = 0
  }

  get length(): number {
    return this.size
  }

  get isFull(): boolean {
    return this.size === this.capacity
  }
}
