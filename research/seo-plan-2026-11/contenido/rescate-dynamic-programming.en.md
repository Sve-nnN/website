## Fibonacci from naive recursion to constant memory

Fibonacci is the example I use to show what really changes when you apply dynamic programming, because the same problem goes through four versions with very different costs. The definition is F(0) = 0, F(1) = 1 and F(n) = F(n-1) + F(n-2) for n greater than 1.

The direct recursive version copies the definition as is. It works, but it recomputes the same values over and over: F(35) takes millions of calls.

```python
def fibonacci_naive(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci_naive(n - 1) + fibonacci_naive(n - 2)
```

This version runs in O(2^n) time and uses O(n) memory for the depth of the call stack.

With memoization I store each result the first time I compute it and return it directly after that. The code barely changes and the time drops to O(n).

```python
def fibonacci_memo(n: int, memo: dict | None = None) -> int:
    if memo is None:
        memo = {}
    if n in memo:
        return memo[n]
    if n <= 1:
        return n
    memo[n] = fibonacci_memo(n - 1, memo) + fibonacci_memo(n - 2, memo)
    return memo[n]
```

With tabulation I build the solution bottom-up in an array, with no recursion. It stays at O(n) time and O(n) memory, but it no longer depends on the stack, so it won't blow up for large values of n.

```python
def fibonacci_table(n: int) -> int:
    if n <= 1:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]
```

The last step is noticing that each value only depends on the previous two. If I keep those two and drop the rest, memory falls to O(1).

```python
def fibonacci_constant(n: int) -> int:
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b
```

That same reasoning, looking at which earlier states each cell depends on, is what I apply to any dynamic programming problem to cut memory.

## The 0/1 knapsack in code

The 0/1 knapsack has a maximum capacity W and a list of n items, each with a weight and a value. Each item goes in whole or not at all, hence 0/1, and the goal is to maximize total value without exceeding the capacity.

The table dp[i][w] holds the best value you can get using the first i items with capacity w. The recurrence compares two options: leave item i out, which gives dp[i-1][w], or put it in if it fits, which gives its value plus dp[i-1][w - weight_i].

```python
def knapsack_01(weights: list[int], values: list[int], capacity: int) -> int:
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        weight, value = weights[i - 1], values[i - 1]
        for w in range(1, capacity + 1):
            dp[i][w] = dp[i - 1][w]
            if weight <= w:
                dp[i][w] = max(dp[i][w], value + dp[i - 1][w - weight])
    return dp[n][capacity]

# weights [1, 2, 3], values [6, 10, 12], capacity 5
# result 22: the items weighing 2 and 3
```

It runs in O(n·W) time and memory. Since each row only uses the previous one, you can keep a single row and drop memory to O(W), iterating w from high to low so you don't overwrite values you still need.

## How I design a dynamic programming solution

When a problem smells like dynamic programming I always follow the same steps:

1. I define the state: which parameters describe a subproblem. In the knapsack, that's the item index and the remaining capacity.
2. I write the recurrence, the relation that says how a state's solution comes from smaller states. In optimal control this relation is known as the Bellman equation.
3. I set the base cases, the states I know without computing anything.
4. I pick the computation order: recursive with memoization if the problem is easier to think about top-down, a table if I want control over memory and to avoid the stack.
5. I check which states each cell depends on to see how much memory I can cut.

If I can't write step 2 clearly, the problem usually lacks optimal substructure and another technique fits better, like a greedy algorithm or backtracking.

## Other problems where it shows up

Beyond the classics above, dynamic programming sits behind algorithms I use as references:

- Bellman-Ford computes shortest paths from a node even with negative edge weights, and it detects negative cycles. Dijkstra doesn't work in that case because it's greedy.
- Matrix chain multiplication finds the multiplication order that minimizes scalar operations by splitting the problem into subchains.
- Needleman-Wunsch and Smith-Waterman align DNA or protein sequences, the first globally and the second locally, with a table very similar to the edit distance one.

## Practicing on LeetCode

These three problems are the ones I'd start with if you're practicing for interviews, because each one forces a different part of the design process:

- Climbing Stairs: counting the distinct ways to climb a staircase is Fibonacci in disguise, and it's a good place to practice going from recursion to constant memory.
- Coin Change: the minimum number of coins for an amount is a clean tabulation exercise where the state is the remaining amount.
- Edit Distance: the minimum operations to turn one string into another trains you to think in a two-dimensional table.

## Memoization or tabulation in practice

- Memoization only computes the subproblems the recursion needs, and it's usually quicker to write if the problem is already recursive. Its risk is stack depth: Python's default limit is around a thousand calls.
- Tabulation computes every subproblem in order, even ones you don't need, but it doesn't use the stack and makes it more obvious where to cut memory.

My rule of thumb is to start with memoization to validate the recurrence and switch to a table once input size or memory starts to matter.
