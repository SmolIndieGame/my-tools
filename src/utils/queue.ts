class Node<E> {
    value: E;
    next: Node<E> | null;

    constructor(value: E, next: Node<E> | null) {
        this.value = value;
        this.next = next;
    }
}

export default class <E> {
    private head: Node<E> | null;
    private tail: Node<E> | null;
    private _size: number;

    get size() {
        return this._size;
    }

    constructor() {
        this.head = null;
        this.tail = null;
        this._size = 0;
    }

    enqueue(item: E): void {
        const newNode = new Node(item, null);
        this._size++;
        if (this.tail === null) {
            this.head = newNode;
            this.tail = newNode;
            return;
        }
        this.tail.next = newNode;
        this.tail = newNode;
    }
    dequeue(): E | undefined {
        if (this.head === null) { return undefined; }
        const val = this.head.value;
        this.head = this.head.next;
        this._size--;
        if (this.head === null) { this.tail = null; }
        return val;
    }
    peek(): E | undefined {
        return this.head?.value;
    }
}