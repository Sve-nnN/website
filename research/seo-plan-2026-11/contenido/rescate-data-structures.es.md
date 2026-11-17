## Paradigmas para diseñar algoritmos sobre estas estructuras

Una estructura de datos resuelve cómo guardas la información. El paradigma resuelve cómo la recorres para llegar a una respuesta. Estos son los cuatro que más uso:

- Divide y vencerás parte el problema en mitades o trozos independientes, resuelve cada uno y combina los resultados. Merge sort y la búsqueda binaria siguen este esquema.
- La programación dinámica sirve cuando los subproblemas se repiten: guarda cada resultado para no recalcularlo. La explico en detalle en mi guía de [programación dinámica](/blog/cs-fundamentals/dynamic-programming).
- Un algoritmo voraz toma la mejor decisión local en cada paso. Es rápido, pero solo da el óptimo global en problemas que lo garantizan, como Dijkstra con pesos positivos.
- El backtracking prueba caminos y retrocede cuando uno no lleva a una solución. Es la base de los resolvedores de sudoku y de los problemas de permutaciones.

Elegir bien la pareja estructura y paradigma pesa más que optimizar el código después. Una búsqueda binaria sobre un arreglo ordenado le gana a cualquier búsqueda lineal bien escrita en cuanto los datos crecen.

## Dónde aparece cada estructura en software real

- Colas: planificación de procesos en el sistema operativo, buffers de streaming y colas de trabajos en segundo plano.
- Pilas: la función deshacer de un editor, la validación de paréntesis y el historial de navegación.
- Listas enlazadas: gestores de memoria, listas de reproducción y cualquier colección donde insertas y borras mucho en el medio.
- Árboles: sistemas de archivos, índices de bases de datos y el árbol sintáctico que arma un compilador.
- Tablas hash: cachés, bases de datos clave valor y tablas de símbolos.
- Grafos: redes sociales, cálculo de rutas en mapas, análisis de dependencias y sistemas de recomendación.

## Las mismas estructuras en cuatro lenguajes

Los conceptos son universales, pero cada lenguaje te da un nivel distinto de control y de ayuda. Ver la misma idea en varios lenguajes es, para mí, la forma más rápida de entender qué está pasando en memoria.

### C y los punteros

En C no hay listas ni diccionarios de serie. Las estructuras se arman a mano con struct y punteros, y la memoria la reservas y la liberas tú. Esta lista enlazada simple muestra el patrón completo:

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct Nodo {
    int dato;
    struct Nodo* siguiente;
} Nodo;

void insertar_al_final(Nodo** cabeza, int dato) {
    Nodo* nuevo = malloc(sizeof(Nodo));
    nuevo->dato = dato;
    nuevo->siguiente = NULL;
    if (*cabeza == NULL) {
        *cabeza = nuevo;
        return;
    }
    Nodo* ultimo = *cabeza;
    while (ultimo->siguiente != NULL) {
        ultimo = ultimo->siguiente;
    }
    ultimo->siguiente = nuevo;
}

int main(void) {
    Nodo* cabeza = NULL;
    insertar_al_final(&cabeza, 10);
    insertar_al_final(&cabeza, 20);
    insertar_al_final(&cabeza, 30);
    for (Nodo* n = cabeza; n != NULL; n = n->siguiente) {
        printf("%d -> ", n->dato);
    }
    printf("NULL\n");
    while (cabeza != NULL) {
        Nodo* tmp = cabeza;
        cabeza = cabeza->siguiente;
        free(tmp);
    }
    return 0;
}
```

La ventaja es el control total y el rendimiento. El costo es que una fuga de memoria o un puntero colgado son tu responsabilidad.

### Java y el Collections Framework

Java encapsula cada estructura en una clase y trae implementaciones probadas en el Java Collections Framework: ArrayList, LinkedList, ArrayDeque para pilas y colas, HashMap y TreeMap, entre otras. En el día a día casi nunca implementas una estructura desde cero. Lo que sí tienes que saber es qué hay debajo de cada interfaz, porque un LinkedList y un ArrayList implementan la misma interfaz List con costos muy distintos para acceder por índice.

### Python con listas diccionarios y conjuntos

Python trae las estructuras más usadas integradas en el lenguaje. La lista sirve como arreglo dinámico y como pila, el diccionario es una tabla hash y el conjunto guarda elementos únicos. Para colas uso collections.deque, porque sacar del inicio de una lista cuesta O(n).

```python
from collections import deque

pila = [1, 2, 3]
pila.append(4)        # apilar
pila.pop()            # desapilar, queda [1, 2, 3]

precios = {"a": 1, "b": 2}
print(precios["a"])   # 1, búsqueda promedio O(1)

unicos = {1, 2, 3, 2}
print(unicos)         # {1, 2, 3}

cola = deque([1, 2, 3])
cola.append(4)
cola.popleft()        # 1, en O(1)
```

### JavaScript con arreglos objetos y Map

En JavaScript el arreglo hace de pila con push y pop. Para pares clave valor tienes los objetos y, desde ES6, Map y Set, que conviene preferir cuando las claves no son strings fijos o cuando agregas y borras claves seguido.

```javascript
const pila = [1, 2, 3];
pila.push(4);
pila.pop(); // [1, 2, 3]

const precios = new Map();
precios.set("c", 3);
console.log(precios.get("c")); // 3

const unicos = new Set([1, 2, 3, 2]);
console.log(unicos.size); // 3
```

Un detalle que veo seguido en código de producción: usar shift() sobre un arreglo grande como si fuera una cola. Cada shift() mueve todos los elementos, así que una cola de miles de elementos se vuelve O(n) por operación.
