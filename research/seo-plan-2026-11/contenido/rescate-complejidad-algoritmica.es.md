## Cómo crece cada orden con números concretos

Las curvas de complejidad se entienden mejor con números que con gráficas. Estas son las operaciones aproximadas que hace un algoritmo de cada orden para tres tamaños de entrada:

- O(log n): unas 3 operaciones con n = 10, 7 con n = 100 y 10 con n = 1.000.
- O(n): 10, 100 y 1.000.
- O(n log n): unas 33, 664 y 9.966.
- O(n²): 100, 10.000 y 1.000.000.
- O(2ⁿ): 1.024 con n = 10, y con n = 100 ya pasa de 10 elevado a 30.
- O(n!): 3.628.800 con n = 10. Con n = 20 supera los dos trillones.

La diferencia entre O(n log n) y O(n²) parece chica con 10 elementos y se vuelve de cien veces con 1.000. Por eso un algoritmo cuadrático pasa todas las pruebas en desarrollo y se cae en producción cuando llegan los datos reales. Y por eso O(2ⁿ) y O(n!) solo sirven para entradas muy pequeñas, por mucho hardware que tengas.

## Ejercicios resueltos de notación Big O

Estos son los ejercicios que uso para practicar el cálculo de complejidad. Primero intenta resolverlos tú y después lee la respuesta.

### Ejercicio 1 con un bucle simple

```python
def suma(lista):
    total = 0
    for x in lista:
        total += x
    return total
```

El bucle recorre cada elemento una vez y hace una operación constante en cada vuelta. La complejidad es O(n) en tiempo y O(1) en memoria, porque solo guarda la variable total.

### Ejercicio 2 con bucles anidados

```python
def hay_duplicados(lista):
    for i in range(len(lista)):
        for j in range(i + 1, len(lista)):
            if lista[i] == lista[j]:
                return True
    return False
```

El bucle interno corre n - 1 veces, después n - 2, y así hasta 1. La suma da n(n - 1)/2 comparaciones, que es O(n²). La versión con un conjunto baja a O(n) en tiempo a cambio de O(n) en memoria:

```python
def hay_duplicados_rapido(lista):
    vistos = set()
    for x in lista:
        if x in vistos:
            return True
        vistos.add(x)
    return False
```

Es el intercambio entre tiempo y memoria más común que encuentro en código real.

### Ejercicio 3 con búsqueda lineal y binaria

Buscar un valor en un arreglo desordenado obliga a revisar, en el peor caso, todos los elementos: O(n). Si el arreglo está ordenado, la búsqueda binaria descarta la mitad en cada paso:

```python
def busqueda_binaria(arr, objetivo):
    izq, der = 0, len(arr) - 1
    while izq <= der:
        medio = (izq + der) // 2
        if arr[medio] == objetivo:
            return medio
        if arr[medio] < objetivo:
            izq = medio + 1
        else:
            der = medio - 1
    return -1
```

Cada vuelta divide el rango a la mitad, así que el número de vueltas es log₂ n: O(log n). Con un millón de elementos son unas 20 comparaciones.

### Ejercicio 4 con un bucle que se divide

```python
def contar_divisiones(n):
    pasos = 0
    while n > 1:
        n //= 2
        pasos += 1
    return pasos
```

Aunque parece un bucle normal, n se divide a la mitad en cada vuelta. Es O(log n). La pista para reconocerlo es que la variable de control no crece de uno en uno, se multiplica o se divide.

## Dos casos de optimización que vale la pena conocer

El primero es Quicksort. En promedio ordena en O(n log n), pero si eliges siempre el primer elemento como pivote y el arreglo ya viene ordenado, cada partición deja un lado vacío y el algoritmo cae a O(n²). Elegir el pivote al azar o con la mediana de tres elementos evita ese peor caso en la práctica. El análisis completo está en mi guía de [Quicksort en Python](/blog/cs-fundamentals/quicksort-python).

El segundo es el problema del viajante. Probar todas las rutas posibles entre n ciudades cuesta O(n!). El algoritmo de Held-Karp aplica [programación dinámica](/blog/cs-fundamentals/dynamic-programming) sobre subconjuntos de ciudades y baja el costo a O(n²·2ⁿ). Sigue siendo exponencial, pero con 20 ciudades pasa de algo imposible a algo que una computadora resuelve. Es un buen recordatorio de que mejorar el orden de complejidad, aunque no llegues a polinomial, cambia qué problemas puedes atacar.
