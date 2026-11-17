## Fibonacci de la recursión ingenua a memoria constante

Fibonacci es el ejemplo que uso para mostrar qué cambia de verdad cuando aplicas programación dinámica, porque el mismo problema pasa por cuatro versiones con costos muy distintos. La definición es F(0) = 0, F(1) = 1 y F(n) = F(n-1) + F(n-2) para n mayor que 1.

La versión recursiva directa copia la definición tal cual. Funciona, pero recalcula los mismos valores una y otra vez: para F(35) hace millones de llamadas.

```python
def fibonacci_naive(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci_naive(n - 1) + fibonacci_naive(n - 2)
```

Esta versión tarda O(2^n) en tiempo y usa O(n) de memoria por la profundidad de la pila de llamadas.

Con memoización guardo cada resultado la primera vez que lo calculo y lo devuelvo directo las siguientes veces. El código casi no cambia y el tiempo baja a O(n).

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

Con tabulación construyo la solución de abajo hacia arriba en un arreglo, sin recursión. Sigue en O(n) de tiempo y O(n) de memoria, pero ya no depende de la pila, así que no revienta con valores grandes de n.

```python
def fibonacci_tabla(n: int) -> int:
    if n <= 1:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]
```

El último paso es notar que cada valor solo depende de los dos anteriores. Si guardo esos dos y descarto el resto, la memoria baja a O(1).

```python
def fibonacci_constante(n: int) -> int:
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b
```

Ese mismo razonamiento, mirar de qué estados anteriores depende cada celda, es el que aplico en cualquier problema de programación dinámica para recortar memoria.

## La mochila 0/1 con código

La mochila 0/1 tiene una capacidad máxima W y una lista de n objetos, cada uno con un peso y un valor. Cada objeto entra entero o no entra, de ahí el 0/1, y el objetivo es maximizar el valor total sin pasarte de la capacidad.

La tabla dp[i][w] guarda el mejor valor posible usando los primeros i objetos con una capacidad w. La recurrencia compara dos opciones: dejar fuera el objeto i, que da dp[i-1][w], o meterlo si cabe, que da su valor más dp[i-1][w - peso_i].

```python
def mochila_01(pesos: list[int], valores: list[int], capacidad: int) -> int:
    n = len(pesos)
    dp = [[0] * (capacidad + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        peso, valor = pesos[i - 1], valores[i - 1]
        for w in range(1, capacidad + 1):
            dp[i][w] = dp[i - 1][w]
            if peso <= w:
                dp[i][w] = max(dp[i][w], valor + dp[i - 1][w - peso])
    return dp[n][capacidad]

# pesos [1, 2, 3], valores [6, 10, 12], capacidad 5
# resultado 22: los objetos de peso 2 y 3
```

Tarda O(n·W) en tiempo y en memoria. Como cada fila solo usa la anterior, puedes quedarte con una sola fila y bajar la memoria a O(W), recorriendo w de mayor a menor para no pisar valores que todavía necesitas.

## Cómo diseño una solución de programación dinámica

Cuando un problema me huele a programación dinámica sigo siempre los mismos pasos:

1. Defino el estado: qué parámetros describen un subproblema. En la mochila son el índice del objeto y la capacidad restante.
2. Escribo la recurrencia, la relación que dice cómo sale la solución de un estado a partir de estados más chicos. En control óptimo esta relación se conoce como ecuación de Bellman.
3. Fijo los casos base, los estados que conozco sin calcular nada.
4. Elijo el orden de cálculo: recursivo con memoización si el problema se piensa mejor de arriba hacia abajo, tabla si quiero controlar memoria y evitar la pila.
5. Reviso de qué estados depende cada celda para ver cuánta memoria puedo recortar.

Si no consigo escribir el paso 2 con claridad, normalmente el problema no tiene subestructura óptima y conviene otra técnica, como un algoritmo voraz o backtracking.

## Otros problemas donde aparece

Además de los clásicos de arriba, la programación dinámica está detrás de algoritmos que uso como referencia:

- Bellman-Ford calcula caminos mínimos desde un nodo aunque haya aristas con peso negativo, y detecta ciclos negativos. Dijkstra no sirve en ese caso porque es voraz.
- La multiplicación de cadenas de matrices busca el orden de multiplicación que minimiza el número de operaciones escalares, partiendo el problema en subcadenas.
- Needleman-Wunsch y Smith-Waterman alinean secuencias de ADN o proteínas, el primero de forma global y el segundo local, con una tabla muy parecida a la del edit distance.

## Programación dinámica determinística y probabilística

En la programación dinámica determinística conoces con certeza el resultado de cada decisión. Planificar la producción o el inventario con una demanda conocida es un caso típico: la recurrencia calcula el costo óptimo en cada etapa y el estado siguiente queda determinado por la decisión actual.

En la probabilística, o estocástica, las transiciones dependen de probabilidades y el objetivo pasa a ser optimizar el valor esperado. Los procesos de decisión de Markov, base del aprendizaje por refuerzo, usan esta versión: la ecuación de Bellman suma la recompensa inmediata y el valor esperado de los estados futuros.

## Memoización o tabulación en la práctica

- La memoización solo calcula los subproblemas que la recursión necesita, y suele ser más rápida de escribir si el problema ya es recursivo. Su riesgo es la profundidad de la pila: en Python el límite por defecto ronda las mil llamadas.
- La tabulación calcula todos los subproblemas en orden, aunque algunos no hagan falta, pero no usa la pila y deja más a la vista dónde recortar memoria.

Mi regla práctica es empezar con memoización para validar la recurrencia y pasar a tabla cuando el tamaño de entrada o la memoria empiezan a importar.
