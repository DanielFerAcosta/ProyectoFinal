export class MinHeap<T> {
  private readonly items: T[] = [];

  constructor(
    private readonly compare: (first: T, second: T) => number,
  ) {}

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  peek(): T | undefined {
    return this.items[0];
  }

  insert(value: T): void {
    this.items.push(value);
    this.siftUp(this.items.length - 1);
  }

  extractMin(): T | undefined {
    if (this.items.length === 0) {
      return undefined;
    }

    const minimum = this.items[0];
    const last = this.items.pop()!;

    if (this.items.length > 0) {
      this.items[0] = last;
      this.siftDown(0);
    }

    return minimum;
  }

  clear(): void {
    this.items.length = 0;
  }

  private siftUp(startIndex: number): void {
    let index = startIndex;

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);

      if (
        this.compare(
          this.items[index],
          this.items[parentIndex],
        ) >= 0
      ) {
        break;
      }

      this.swap(index, parentIndex);
      index = parentIndex;
    }
  }

  private siftDown(startIndex: number): void {
    let index = startIndex;

    while (true) {
      const leftIndex = index * 2 + 1;
      const rightIndex = index * 2 + 2;

      let smallestIndex = index;

      if (
        leftIndex < this.items.length &&
        this.compare(
          this.items[leftIndex],
          this.items[smallestIndex],
        ) < 0
      ) {
        smallestIndex = leftIndex;
      }

      if (
        rightIndex < this.items.length &&
        this.compare(
          this.items[rightIndex],
          this.items[smallestIndex],
        ) < 0
      ) {
        smallestIndex = rightIndex;
      }

      if (smallestIndex === index) {
        break;
      }

      this.swap(index, smallestIndex);
      index = smallestIndex;
    }
  }

  private swap(firstIndex: number, secondIndex: number): void {
    const temporary = this.items[firstIndex];

    this.items[firstIndex] = this.items[secondIndex];
    this.items[secondIndex] = temporary;
  }
}