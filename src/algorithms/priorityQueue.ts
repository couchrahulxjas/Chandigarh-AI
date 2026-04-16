export class MinHeap<T> {
  private items: T[] = [];
  private prio: number[] = [];

  size() {
    return this.items.length;
  }

  push(item: T, priority: number) {
    const i = this.items.length;
    this.items.push(item);
    this.prio.push(priority);
    this.bubbleUp(i);
  }

  pop(): { item: T; priority: number } | null {
    if (this.items.length === 0) return null;
    const item = this.items[0];
    const priority = this.prio[0];
    const lastItem = this.items.pop()!;
    const lastPrio = this.prio.pop()!;
    if (this.items.length > 0) {
      this.items[0] = lastItem;
      this.prio[0] = lastPrio;
      this.bubbleDown(0);
    }
    return { item, priority };
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.prio[p] <= this.prio[i]) break;
      this.swap(i, p);
      i = p;
    }
  }

  private bubbleDown(i: number) {
    const n = this.items.length;
    while (true) {
      const l = i * 2 + 1;
      const r = l + 1;
      let m = i;
      if (l < n && this.prio[l] < this.prio[m]) m = l;
      if (r < n && this.prio[r] < this.prio[m]) m = r;
      if (m === i) break;
      this.swap(i, m);
      i = m;
    }
  }

  private swap(a: number, b: number) {
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
    [this.prio[a], this.prio[b]] = [this.prio[b], this.prio[a]];
  }
}

