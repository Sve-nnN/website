## Hash tables and how they handle collisions

A hash table stores key-value pairs and uses a hash function to turn each key into a position in an array. That's why search, insertion and deletion take constant time on average: you compute the position and go straight there, without walking through the other elements.

The catch is collisions, when two different keys land on the same position. There are two common ways to resolve them:

- Chaining: each position holds a small list, and colliding keys pile up in it.
- Open addressing: when a position is taken, the table probes other positions following a fixed rule until it finds a free one.

With a decent hash function and a load factor under control, both stay close to O(1). When the table fills up too much, it resizes and redistributes every key, which costs O(n) at that moment but averages out across many insertions. In practice you rarely build one yourself: Python's dict, JavaScript's Map and Java's HashMap are hash tables.

## Algorithm design paradigms for these structures

A data structure settles how you store information. A paradigm settles how you traverse it to reach an answer. These are the four I use most:

- Divide and conquer splits the problem into halves or independent pieces, solves each one and combines the results. Merge sort and binary search follow this pattern.
- Dynamic programming fits when subproblems repeat: it stores each result so it never recomputes it. I cover it in detail in my [dynamic programming guide](/blog/cs-fundamentals/dynamic-programming).
- A greedy algorithm takes the best local decision at each step. It's fast, but it only reaches the global optimum on problems that guarantee it, like Dijkstra with positive weights.
- Backtracking tries paths and backs out when one doesn't lead to a solution. It's the basis of sudoku solvers and permutation problems.

Choosing the right pairing of structure and paradigm matters more than optimizing the code afterwards. Binary search over a sorted array beats any well-written linear search as soon as the data grows.

## The same structures in four languages

The concepts are universal, but each language gives you a different level of control and help. Seeing the same idea in several languages is, for me, the fastest way to understand what's happening in memory.

### C and pointers

C has no built-in lists or dictionaries. You build structures by hand with structs and pointers, and you allocate and free memory yourself. This singly linked list shows the full pattern:

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node* next;
} Node;

void append(Node** head, int value) {
    Node* node = malloc(sizeof(Node));
    node->value = value;
    node->next = NULL;
    if (*head == NULL) {
        *head = node;
        return;
    }
    Node* last = *head;
    while (last->next != NULL) {
        last = last->next;
    }
    last->next = node;
}

int main(void) {
    Node* head = NULL;
    append(&head, 10);
    append(&head, 20);
    append(&head, 30);
    for (Node* n = head; n != NULL; n = n->next) {
        printf("%d -> ", n->value);
    }
    printf("NULL\n");
    while (head != NULL) {
        Node* tmp = head;
        head = head->next;
        free(tmp);
    }
    return 0;
}
```

The upside is full control and performance. The cost is that a memory leak or a dangling pointer is on you.

### Java and the Collections Framework

Java wraps each structure in a class and ships tested implementations in the Java Collections Framework: ArrayList, LinkedList, ArrayDeque for stacks and queues, HashMap and TreeMap, among others. Day to day you almost never implement a structure from scratch. What you do need to know is what sits under each interface, because LinkedList and ArrayList implement the same List interface with very different costs for index access.

### Python and its built-in collections

Python builds the most common structures into the language. A list works as a dynamic array and as a stack, a dict is a hash table and a set stores unique elements. For queues I use collections.deque, because removing from the front of a list costs O(n).

```python
from collections import deque

stack = [1, 2, 3]
stack.append(4)       # push
stack.pop()           # pop, leaves [1, 2, 3]

prices = {"a": 1, "b": 2}
print(prices["a"])    # 1, average O(1) lookup

unique = {1, 2, 3, 2}
print(unique)         # {1, 2, 3}

queue = deque([1, 2, 3])
queue.append(4)
queue.popleft()       # 1, in O(1)
```

### JavaScript arrays and the Map type

In JavaScript the array acts as a stack with push and pop. For key-value pairs you have objects and, since ES6, Map and Set, which are the better choice when keys aren't fixed strings or when you add and remove keys often.

```javascript
const stack = [1, 2, 3];
stack.push(4);
stack.pop(); // [1, 2, 3]

const prices = new Map();
prices.set("c", 3);
console.log(prices.get("c")); // 3

const unique = new Set([1, 2, 3, 2]);
console.log(unique.size); // 3
```

One thing I see often in production code: calling shift() on a large array as if it were a queue. Every shift() moves all the elements, so a queue with thousands of items turns into O(n) per operation.
