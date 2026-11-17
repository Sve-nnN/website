## How to read Big-O notation

Big-O describes how an algorithm's time or memory grows as the input size n grows. It ignores constants and smaller terms because, with large inputs, the dominant term is what decides. An algorithm that does 3n + 20 operations is O(n), and one that does n² + 100n is O(n²).

Reading it comes down to one question: if I double the input, what happens to the cost? With O(n) it doubles, with O(n²) it quadruples, with O(log n) it barely moves and with O(2ⁿ) it squares.

## Worst case average case and best case

The same algorithm can behave differently depending on the input, so it's worth separating three cases:

- The worst case is the maximum cost for any input of size n. Linear search is O(n) in the worst case, when the element is last or missing. It's the one I look at first, because it's the one that brings down production.
- The average case is the expected cost for typical inputs. Quicksort averages O(n log n) even though its worst case is O(n²).
- The best case is the minimum cost, like finding the element at the first position. It rarely helps when making decisions.

## How each class grows with real numbers

Complexity curves make more sense with numbers than with charts. These are the approximate operations an algorithm in each class performs for three input sizes:

- O(log n): about 3 operations for n = 10, 7 for n = 100 and 10 for n = 1,000.
- O(n): 10, 100 and 1,000.
- O(n log n): about 33, 664 and 9,966.
- O(n²): 100, 10,000 and 1,000,000.
- O(2ⁿ): 1,024 for n = 10, and past 10 to the 30th for n = 100.
- O(n!): 3,628,800 for n = 10. For n = 20 it's over two quintillion.

The gap between O(n log n) and O(n²) looks small with 10 items and becomes a hundredfold with 1,000. That's why a quadratic algorithm passes every test in development and falls over in production once real data arrives. It's also why O(2ⁿ) and O(n!) only work on tiny inputs, no matter how much hardware you throw at them.

O(n!) shows up when you try every permutation, as in a brute-force traveling salesman solution. If you see an algorithm generating every ordering of its input, that's the warning sign.

## Big-O exercises with solutions

These are the exercises I use to practice working out complexity. Try each one first, then read the answer.

### Exercise 1 with a single loop

```python
def total(items):
    result = 0
    for x in items:
        result += x
    return result
```

The loop visits each element once and does constant work on every pass. It's O(n) time and O(1) memory, since it only keeps the result variable.

### Exercise 2 with nested loops

```python
def has_duplicates(items):
    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            if items[i] == items[j]:
                return True
    return False
```

The inner loop runs n - 1 times, then n - 2, down to 1. That adds up to n(n - 1)/2 comparisons, which is O(n²). The set-based version drops to O(n) time in exchange for O(n) memory:

```python
def has_duplicates_fast(items):
    seen = set()
    for x in items:
        if x in seen:
            return True
        seen.add(x)
    return False
```

It's the most common time versus memory trade-off I run into in real code.

### Exercise 3 with linear and binary search

Finding a value in an unsorted array means checking every element in the worst case: O(n). If the array is sorted, binary search discards half of it at every step:

```python
def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid
        if arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
```

Each pass halves the range, so the number of passes is log₂ n: O(log n). With a million elements that's about 20 comparisons.

### Exercise 4 with a halving loop

```python
def count_halvings(n):
    steps = 0
    while n > 1:
        n //= 2
        steps += 1
    return steps
```

It looks like an ordinary loop, but n halves on every pass. It's O(log n). The tell is that the control variable doesn't grow one step at a time, it gets multiplied or divided.

## Two optimization cases worth knowing

The first is Quicksort. On average it sorts in O(n log n), but if you always pick the first element as the pivot and the array arrives already sorted, every partition leaves one side empty and the algorithm degrades to O(n²). Picking the pivot at random or with the median of three avoids that worst case in practice.

The second is the traveling salesman problem. Trying every possible route between n cities costs O(n!). The Held-Karp algorithm applies [dynamic programming](/blog/cs-fundamentals/dynamic-programming) over subsets of cities and brings the cost down to O(n²·2ⁿ). It's still exponential, but with 20 cities it goes from impossible to something a computer can solve. It's a good reminder that improving the complexity class, even without reaching polynomial, changes which problems you can take on.
