class StackNode<T> {
  constructor(
    readonly value: T,
    readonly next: StackNode<T> | null,
  ) {}
}

export class Stack<T> {
  private top: StackNode<T> | null = null;
  private count = 0;

  get size(): number {
    return this.count;
  }

  isEmpty(): boolean {
    return this.top === null;
  }

  push(value: T): void {
    this.top = new StackNode(value, this.top);
    this.count += 1;
  }

  pop(): T | undefined {
    if (this.top === null) {
      return undefined;
    }

    const value = this.top.value;
    this.top = this.top.next;
    this.count -= 1;
    return value;
  }

  peek(): T | undefined {
    return this.top?.value;
  }

  clear(): void {
    this.top = null;
    this.count = 0;
  }
}
