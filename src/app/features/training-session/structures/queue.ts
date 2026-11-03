class QueueNode<T> {
  next: QueueNode<T> | null = null;

  constructor(readonly value: T) {}
}

export class Queue<T> {
  private first: QueueNode<T> | null = null;
  private last: QueueNode<T> | null = null;
  private count = 0;

  get size(): number {
    return this.count;
  }

  isEmpty(): boolean {
    return this.first === null;
  }

  enqueue(value: T): void {
    const node = new QueueNode(value);

    if (this.last === null) {
      this.first = node;
      this.last = node;
    } else {
      this.last.next = node;
      this.last = node;
    }

    this.count += 1;
  }

  dequeue(): T | undefined {
    if (this.first === null) {
      return undefined;
    }

    const value = this.first.value;

    this.first = this.first.next;
    this.count -= 1;

    if (this.first === null) {
      this.last = null;
    }

    return value;
  }

  peek(): T | undefined {
    return this.first?.value;
  }

  clear(): void {
    this.first = null;
    this.last = null;
    this.count = 0;
  }
}