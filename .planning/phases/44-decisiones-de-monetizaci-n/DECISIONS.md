# Decisiones de Monetización — Milestone v2.1

**Fase:** 44 — Decisiones de Monetización
**Escrito:** 2026-08-13
**Cubre:** DEC-01, DEC-02, DEC-03, DEC-04, DEC-05

**Regla de procedencia:** toda comisión, umbral y cita de política de este documento sale del research del 2026-08-13, verificado contra la página del propio proveedor. Cada afirmación lleva su fuente. Lo que no está verificado se marca como no verificado, no se rellena con una estimación.

---

## DEC-01 — Estado de Amazon Associates

### El dato

La cuenta **existe y está creada**. Juan reaplicó el 2026-08-13, después de que la anterior se cerrara por no alcanzar ventas calificadas.

| Campo | Valor |
|-------|-------|
| ID de asociado | `juantech02-20` |
| Fecha de alta | 2026-08-13 |
| Estado | Acceso completo a Associates Central, **solicitud pendiente de revisión** |
| Vencimiento del plazo | **2027-02-09** (180 días) |
| Punto de control sugerido | 2026-11-11 (mitad del plazo) |

Texto del correo de alta, textual: *"Your application will be reviewed shortly after you've referred qualified sales to Amazon.com. […] If your affiliate links have not referred qualified sales after 180 days, your application and access to Associates Central will be withdrawn."*

### Qué significa realmente

**El requisito no es facturación, son 3 ventas calificadas.** Esa distinción cambia por completo qué es "éxito" en los próximos seis meses. No hace falta que Amazon rinda dinero — hace falta que tres personas distintas compren algo, cualquier cosa, después de hacer clic en un link de la web. El monto es irrelevante para sobrevivir el plazo.

Esto también significa que el valor de Amazon en este milestone **no es económico sino de continuidad**: mantener la cuenta viva cuesta poco y deja la puerta abierta para cuando el tráfico crezca. Ver DEC-02 para por qué el ingreso en sí es marginal.

### Dependencia dura

Ningún link de Amazon puede publicarse antes de que el disclosure esté en el aire (Phase 46, LEG-01 y LEG-02). El propio correo de alta lo repite: *"you must transparently disclose your relationship with us to customers when using Amazon links."* Es una confirmación independiente del requisito que el research ya había sacado del Operating Agreement.

### Efecto sobre el roadmap

Este dato **resuelve** la pregunta abierta que `research/SUMMARY.md` había marcado como capaz de invertir el orden de fases. El reloj corre, así que la página de stack (Phase 48) queda con deadline duro.

**No se reordenan las fases.** Razón: el orden actual ya le da a la página de stack todo el margen disponible, y adelantarla exigiría saltear el baseline (Phase 45) o el disclosure (Phase 46). El primero es el único mecanismo que detecta si la monetización daña el clúster de servicios que ya rankea; el segundo es obligación legal y además prerequisito de Kinsta. Los dos son más caros de romper que este plazo de seis meses.

### Riesgo real, dicho sin adornos

Cruzando el plazo con el modelo de DEC-02: si el tráfico a la página de stack queda en el orden de 1.000 visitas mensuales, alcanzar 3 ventas calificadas toma entre **1,2 y 7,5 meses**. El plazo es de 6. Es decir: en el extremo pesimista de las tasas de conversión, **el plazo no alcanza**. No es una certeza de fracaso, es un riesgo real que se dimensiona recién cuando Phase 45 entregue el número de tráfico.

Mitigación disponible si a mitad de camino (2026-11-11) no hay ventas: los links de Amazon no tienen que vivir solo en la página de stack. Un post de comparación o una reseña con intención de compra convierte mejor que una página de referencia. Decisión a tomar en el punto de control, con datos, no ahora.

---

## DEC-02 — Modelo de ingresos

### Advertencia de método

Esto es un modelo **paramétrico, no una medición**. La única entrada real que falta es `V`, y llega en Phase 45. Todo lo demás son tasas tomadas del research o rangos declarados como supuesto.

### La multiplicación

```
V                = visitas mensuales a la página de stack        [INCÓGNITA → Phase 45]
CTR de link      = 2% a 5%          (supuesto, rango de industria)
Conversión       = 2% a 5%          (supuesto, ventana de cookie de 24h de Amazon)
Ticket promedio  = $100 a $200      (supuesto, accesorios de escritorio y hardware de dev)
Tasa de Amazon   = 2,50%            (VERIFICADO: rate card, categoría "PC & PC Components")

Ventas/mes    = V × CTR × Conversión        = V × 0,0004 a V × 0,0025
Comisión/vta  = Ticket × 0,025              = $2,50 a $5,00
Ingreso/mes   = Ventas/mes × Comisión/vta
```

### Tramos

| `V` (visitas/mes) | Ventas/mes | Ingreso/mes | Tiempo hasta 3 ventas |
|---|---|---|---|
| **1.000** | 0,4 – 2,5 | **$1 – $12** | 1,2 – 7,5 meses |
| **10.000** | 4 – 25 | **$10 – $125** | 4 – 22 días |

El research modeló la banda central en **$2–$9/mes con V=1.000**, que cae dentro de este rango y es la cifra a citar si hace falta una sola.

La ventana de cookie de Amazon es de **24 horas**, no 30 días como en la mayoría de los programas. Eso comprime fuerte la conversión: el visitante tiene que comprar prácticamente el mismo día.

### El punto de equilibrio, que es lo que importa

Una conversión de **DinoRANK** paga 40% del primer mes más **10% de cada renovación hasta que el cliente cancele** (VERIFICADO). Un suscriptor que se queda 12 meses, sobre un plan hipotético de €30/mes, rinde ≈ €12 + €33 = **€45**.

Eso equivale a **unas 12 ventas de Amazon**.

> ⚠️ El precio de €30/mes es un **supuesto ilustrativo, no verificado**. Confirmar el precio real de los planes de DinoRANK al momento de postular y actualizar este cálculo.

**Conclusión operativa:** un solo suscriptor recurrente vale más que un año entero de Amazon a tráfico bajo. El esfuerzo editorial debe concentrarse donde están los programas recurrentes (SEO tools, hosting), no en acumular links de hardware. Amazon se mantiene por continuidad de cuenta y porque el hardware es genuinamente parte del stack, no porque mueva la aguja.

### Qué actualizar en Phase 45

Sustituir `V` por el número real y recalcular la tabla de tramos. Nada más de este documento cambia.

---

## DEC-03 — Plataforma de pagos

### Decisión

**Polar**, como merchant of record. Registrada ahora, implementada en **v2.2**. En v2.1 no se escribe una línea de código de pagos.

### Por qué, en orden de peso

**1. Stripe no opera en Perú.** Verificado contra `stripe.com/global`: de los ~50 países soportados, en Latinoamérica solo figuran Brasil y México. Eso elimina de un solo golpe cuatro opciones que de otro modo serían las obvias: Stripe directo, Stripe Managed Payments, `@payloadcms/plugin-stripe` y `@payloadcms/plugin-ecommerce` (cuyo adapter es Stripe-only).

**2. Sin merchant of record, el IVA europeo es responsabilidad de Juan desde la primera venta.** El umbral de €10.000 que suele citarse aplica **únicamente a vendedores establecidos en un país de la UE**. Un vendedor establecido en Perú entra por el esquema *non-Union OSS*, que **no tiene mínimo**: un checklist de €29 vendido a un consumidor en Madrid debe IVA español del 21% desde esa venta, con declaraciones trimestrales y dos pruebas no contradictorias de ubicación por comprador. Fuente: EC VAT One Stop Shop, esquema non-Union.

Esto convierte al merchant of record en **obligatorio, no en una comodidad**. Polar declara: *"we take on the liability for international sales taxes."*

**3. Polar llega a Perú.** Lista Perú 🇵🇪 y España 🇪🇸 explícitamente (cross-verificado en dos URLs distintas del propio Polar). Llega porque paga vía Stripe Connect Express (~150 países), no vía cuentas de comerciante de Stripe (~50).

**4. Entrega de archivos incluida.** 10 GB por archivo, URLs firmadas por cliente, checksums SHA-256. No hay que escribir endpoint de descarga.

**Costo:** 5% + $0,50, más 1,5% en tarjetas no estadounidenses.

### Descartadas

| Opción | Por qué no |
|--------|-----------|
| Stripe (directo o Managed Payments) | No opera en Perú. Managed Payments además cobra 3,5% de recargo de MoR sobre las comisiones normales |
| Lemon Squeezy | No cerró — los registros siguen abiertos — pero su SDK está congelado desde el 2024-11-05 y su camino declarado converge a Stripe Managed Payments, que Perú no alcanza. Sería construir una integración sabiendo que hay que rehacerla |
| Gumroad | ~12,9% + $0,80 efectivo. Peor integración y sin ventaja que lo compense |
| `@payloadcms/plugin-ecommerce` | En beta, Stripe-only, sin manejo de impuestos |

### Pasos para Juan (acción manual)

1. Crear cuenta en `polar.sh` con la identidad fiscal correcta (persona natural, Perú).
2. Completar KYC y conectar la cuenta de pagos (usa Stripe Connect Express por debajo — es distinto de tener una cuenta de comerciante de Stripe, que es lo que Perú no soporta).
3. **No crear productos todavía.** El primer producto se define en v2.2.
4. Anotar acá el estado del alta cuando esté: `[ ] cuenta Polar creada — fecha: ____`

### Pendiente que no resuelve este documento

**Tratamiento impositivo peruano.** Un merchant of record elimina la obligación de IVA extranjero, no el impuesto a la renta doméstico. El research lo dejó explícitamente sin verificar. Es un prerequisito de v2.2 con dueño nombrado: **consultar con un contador antes de la primera venta.**

---

## DEC-04 — Programas de afiliados

### Orden de postulación

**1. DinoRANK** — primero, sin discusión.

- **Paga:** 40% del primer mes + **10% de cada renovación hasta que el cliente cancele** (VERIFICADO)
- **Umbral de tráfico:** ninguno
- **Por qué primero:** es el único con recurrencia sin techo y sin puerta de entrada, y Juan tiene credencial genuina — el taller que dio en Lima con Arianna Lupi usando DinoRANK. Eso es exactamente el tipo de prueba de uso real que estos programas valoran.
- **Qué poner en el formulario:** el taller como antecedente concreto, la web como plataforma, y el ángulo de SEO técnico en español.

**2. DigitalOcean** — segundo, sin fricción esperada.

- **Paga:** 10% mensual durante 12 meses
- **Umbral:** ninguno declarado; la propia página dice *"anyone can join"*
- **Ojo:** la red es contradictoria. La página de DigitalOcean dice CJ / Commission Junction; fuentes de terceros dicen Impact con $25 de CPA y cookie de 90 días. **Se resuelve al registrarse**, no antes.

**3. Kinsta** — tercero, **bloqueado hasta la Phase 46**.

- **Paga:** hasta $500 de bounty + **10% vitalicio recurrente**
- **Bloqueo:** exige que el disclosure de afiliación **ya esté publicado** en el sitio para aceptar la solicitud. Por eso el trabajo legal de la Phase 46 no es un trámite: bloquea ingresos reales.
- Es el de mayor valor por conversión de los tres. Vale la pena esperar a tenerlo bien.

### Retenidos por umbral — no postular todavía

| Programa | Umbral | Nota |
|----------|--------|------|
| **Semrush** | ~1.000 visitas mensuales | El pago real es un bounty de **$50–$450 por venta vía Impact**, no "33%/40% recurrente" como se repite en todos lados. Ese dato circulante es falso |
| **Hostinger (afiliados)** | ~1.000 visitas mensuales | El programa **Referral** de Hostinger no tiene mínimo y es el sustituto honesto mientras tanto |

Confirmar el número real en Phase 45 antes de postular. Un rechazo temprano puede ser difícil de revertir.

### Sin programa usable — no perder tiempo buscándolos

Verificado contra la página del propio proveedor el 2026-08-13. Esta lista existe para que dentro de seis meses nadie vuelva a investigarlo.

| Herramienta | Situación |
|-------------|-----------|
| **Ahrefs** | **Programa cerrado.** `ahrefs.com/affiliate` devuelve 404, y el fundador explicó públicamente el cierre |
| **Cloudflare** | `/partners` es solo para agencias |
| **Payload** | Programa limitado a ~30 agencias |
| **Neon** | El referral exige un proyecto open source aceptado en GitHub Sponsors |
| **Cloudinary** | Sin programa |
| **Resend** | Sin programa |
| **Cursor** | Sin programa |
| **Claude / OpenAI / GitHub Copilot** | Sin programa |
| **Screaming Frog** | Solo una cláusula de reventa sin comisión |
| **Sitebulb** | Sin programa público. Es una empresa chica — un correo directo podría conseguir un arreglo privado |
| **DataForSEO** | Sin programa público encontrable |

**El hallazgo incómodo:** casi todo el stack sobre el que Juan realmente construye es immonetizable. Eso no es un fallo del plan, es la realidad del nicho — y refuerza DEC-02: el dinero está en las pocas herramientas recurrentes que sí pagan, no en cubrir el stack entero de links.

**Sin datos públicos:** Vercel no publica ni comisión ni ventana de cookie en ningún lado; solo se ven después de registrarse vía Dub. **SE Ranking** se promociona como "recurrente vitalicio" en todas partes, pero sus términos legales **no dicen nada sobre renovaciones** — mandar un correo a su equipo de afiliados antes de escribir copy que prometa algo.

---

## DEC-05 — Mitigaciones descartadas

Cuatro cosas que la asesoría popular recomienda y que en este proyecto **no se hacen**, con su razón.

### 1. Subdominio de afiliados

**Descartada.** La idea de aislar el contenido comercial en `tools.juan-tech.com` para proteger el dominio principal es contraproducente: la propia documentación de remediación de Google advierte que mover contenido a un subdominio *"puede parecer un intento de eludir las políticas de spam"*. Además partiría la autoridad del dominio en dos justo cuando el objetivo es que la página de stack **refuerce** el clúster de servicios (STACK-06).

### 2. `noindex` en las páginas de ingresos

**Descartada.** Una página de stack con `noindex` no puede rankear, y sin tráfico orgánico no hay ni clics de afiliado ni las 3 ventas que Amazon exige. Es autodestructivo. El control correcto sobre las rutas de redirección es `Disallow: /go` en robots.txt **más** `rel="sponsored nofollow"` en cada anchor — ambos ya son requirements (GO-03, AFF-03).

### 3. Banner de consentimiento de cookies

**Descartada por diseño, no por omisión.** El sitio se construye de modo que nunca haga falta: sin GA4, sin píxeles, sin IDs de clic por usuario, sin `document.cookie` ni `localStorage` en la ruta de afiliado. Un `<a>` común y un 302 agregado y sin cookies quedan fuera del art. 5(3) de ePrivacy. Un banner sería, además, el peor contribuyente de CLS e INP en un sitio que ya corre un shader WebGL en el hero. Queda escrito como restricción del milestone en LEG-04.

### 4. Amazon FBA

**Descartada como feature del sitio.** Es un negocio de inventario, logística y capital propio, no algo que se construya en una web. La transcripción de LLM que originó este milestone lo recomendaba junto a colocación genérica de banners — que es, casi textualmente, el patrón de afiliación fina que Google penaliza. Queda diferido a un milestone futuro con evaluación propia y números reales.

---

## Fuentes

Research del 2026-08-13, en `.planning/research/`:

- `FEATURES.md` — tabla de programas verificada contra la página de cada proveedor, con nivel de fuente por fila (PRIMARY / PRIMARY-PARTIAL / SECONDARY / ABSENCE-VERIFIED)
- `STACK.md` — plataformas de pago; `stripe.com/global` para la ausencia de Perú; páginas de Polar cross-verificadas
- `PITFALLS.md` — Amazon Operating Agreement (2025-10-15) y Program Policies (2026-04-14); políticas de spam de Google (2026-05-15); EC VAT One Stop Shop, esquema non-Union
- `SUMMARY.md` — síntesis y conflictos resueltos entre los cuatro investigadores

Correo de alta de Amazon Associates del 2026-08-13, aportado por Juan.

---

## Acciones pendientes de Juan

- [ ] Abrir cuenta en Polar (DEC-03)
- [ ] Postular a DinoRANK
- [ ] Postular a DigitalOcean
- [ ] Postular a Kinsta — **después** de que el disclosure esté publicado (Phase 46)
- [ ] Confirmar el precio real de los planes de DinoRANK y actualizar el punto de equilibrio de DEC-02
- [ ] Consultar con un contador el tratamiento del impuesto a la renta peruano — prerequisito de v2.2
- [ ] Control a mitad de plazo de Amazon: **2026-11-11**
