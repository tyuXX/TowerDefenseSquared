class PriorityQueue {
    constructor() {
      this.heap = [];
    }
  
    enqueue(item) {
      this.heap.push(item);
      this.bubbleUp();
    }
  
    dequeue() {
      const max = this.heap[0];
      this.heap[0] = this.heap[this.heap.length - 1];
      this.heap.pop();
      this.sinkDown();
      return max;
    }
  
    isEmpty() {
      return this.heap.length === 0;
    }
  
    bubbleUp() {
      let index = this.heap.length - 1;
      while (index > 0) {
        const parentIndex = Math.floor((index - 1) / 2);
        if (this.heap[index].fScore <= this.heap[parentIndex].fScore) break;
        [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
        index = parentIndex;
      }
    }
  
    sinkDown() {
      let index = 0;
      const length = this.heap.length;
      const element = this.heap[index];
      while (true) {
        const leftChildIdx = 2 * index + 1;
        const rightChildIdx = 2 * index + 2;
        let swapIdx = null;
        if (leftChildIdx < length) {
          const leftChild = this.heap[leftChildIdx];
          if (leftChild.fScore > element.fScore) {
            swapIdx = leftChildIdx;
          }
        }
        if (rightChildIdx < length) {
          const rightChild = this.heap[rightChildIdx];
          if (
            (swapIdx === null || rightChild.fScore > this.heap[swapIdx].fScore) &&
            rightChild.fScore > element.fScore
          ) {
            swapIdx = rightChildIdx;
          }
        }
        if (swapIdx === null) break;
        this.heap[index] = this.heap[swapIdx];
        this.heap[swapIdx] = element;
        index = swapIdx;
      }
    }
  }
  