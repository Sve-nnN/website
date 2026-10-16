// Tipos de los JSON de copy de la home (forma fijada por 52-02; la validan scripts/check-copy.mjs y su selftest).
// Solo tipos: sin valores, sin importaciones.

/** Una rama por idioma. Las dos tienen el mismo arbol de claves (regla V09 del lint). */
export type Localized<T> = { es: T; en: T };

/** Cifra del copy con su fuente. Es la unica forma de que una cifra pase la regla V07. */
export type NumberSource = {
  /** Solo digitos, sin separadores: "86000". */
  value: string;
  /** Texto o URL no vacio que respalda la cifra. */
  source: string;
};

/** Excepcion justificada. Solo las reglas heuristicas la admiten; las demas ignoran _allow. */
export type AllowEntry = {
  rule: 'V04' | 'V13' | 'V15' | 'V16';
  /** Ruta a la cadena, por ejemplo "es.faq.2.answer". */
  path: string;
  reason: string;
};

/** Archivo de copy: src/home/copy/<seccion>.json. */
export type CopyFile<T> = Localized<T> & {
  _numbers?: NumberSource[];
  _allow?: AllowEntry[];
  /** Rutas (sin el idioma) de cadenas que pueden ser iguales en ES y EN: nombres propios, comandos. */
  _sameAllowed?: string[];
};
