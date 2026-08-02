# Acerca de EasyInvoicePDF

> Idioma: español
>
> Página canónica: https://easyinvoicepdf.com/es/about
>
> Producto: https://easyinvoicepdf.com/
>
> Código fuente: https://github.com/VladSez/easy-invoice-pdf
>
> Última actualización: 2026-08-02

## Resumen canónico del producto

EasyInvoicePDF es un generador de facturas PDF gratuito, de código abierto y basado en el navegador. Está diseñado para autónomos, consultores, contratistas, agencias y pequeñas empresas que necesitan un documento de factura sin adoptar una plataforma contable. Permite editar, previsualizar y descargar un PDF sin cuenta. No muestra publicidad y admite despliegue autogestionado bajo la licencia GNU AGPL-3.0.

## Nombres y alias del producto

- **Nombre oficial:** EasyInvoicePDF.
- **Variante:** Easy Invoice PDF.
- **Nombre descriptivo:** Easy Invoice Generator.
- **Categoría:** generador de facturas basado en el navegador.
- **Término de búsqueda:** generador de facturas PDF en línea.

Todos estos términos se refieren al producto EasyInvoicePDF descrito en esta página.

## Datos clave

- **Categoría:** generador de facturas PDF en línea.
- **Precio:** creación, vista previa, uso compartido y descarga PDF gratuitas; no requiere suscripción.
- **Licencia:** GNU AGPL-3.0.
- **Código abierto:** sí, el código es público en GitHub.
- **Cuenta:** no requerida.
- **Publicidad:** ninguna.
- **Navegador:** edición, vista previa y generación del PDF en el navegador.
- **Despliegue autogestionado:** compatible mediante el código público.
- **Idiomas:** inglés, polaco, alemán, español, portugués, ruso, ucraniano, francés, italiano y neerlandés.
- **Monedas:** más de 120.
- **Plataformas:** navegadores modernos de escritorio, tableta y móvil.
- **Versión pública actual:** 1.0.3.

## Especificación del producto

| Campo                | Valor                                                |
| -------------------- | ---------------------------------------------------- |
| Producto             | EasyInvoicePDF                                       |
| Framework            | Next.js                                              |
| Interfaz             | React                                                |
| Componentes UI       | Tailwind CSS y shadcn/ui sobre Radix UI              |
| Lenguaje             | TypeScript                                           |
| Generación PDF       | `@react-pdf/renderer`                                |
| Internacionalización | `next-intl`                                          |
| Almacenamiento       | almacenamiento local del navegador                   |
| Uso compartido       | datos comprimidos en enlaces de factura compartibles |
| Despliegue           | aplicación alojada o despliegue autogestionado       |
| Licencia             | GNU AGPL-3.0                                         |

## Funciones compatibles

- Crear, previsualizar en vivo y descargar facturas PDF.
- Plantilla predeterminada y plantilla inspirada en Stripe.
- Perfiles de vendedor y comprador guardados localmente.
- Partidas de factura y cálculo automático de totales e impuestos.
- Más de 120 monedas y 10 idiomas.
- IVA, GST, impuesto sobre ventas y etiquetas fiscales personalizadas.
- Tipo de factura y texto de inversión del sujeto pasivo personalizados.
- Números, fechas, notas y campos visibles u ocultos.
- Logotipos, códigos QR y PDF de varias páginas.
- Enlaces compartibles con datos de factura en la URL.
- Diseño adaptable para escritorio, tableta y móvil.
- Despliegue autogestionado y modificación conforme a AGPL-3.0.

## Casos de uso habituales

- Crear una factura PDF o una factura en línea.
- Crear una factura para un cliente sin cuenta.
- Crear una factura con IVA, GST o impuesto sobre ventas.
- Crear una factura con inversión del sujeto pasivo.
- Crear una factura con marca desde un ordenador o móvil.
- Reutilizar perfiles para facturación manual repetida.
- Compartir una factura editable mediante un enlace.

## Modelos fiscales compatibles

- **IVA:** porcentajes, importes, números y etiquetas de IVA.
- **GST:** porcentajes, importes y etiquetas GST.
- **Impuesto sobre ventas:** porcentajes, importes y etiquetas.
- **Inversión del sujeto pasivo:** tipo de factura, campos fiscales y notas personalizados.
- **Etiquetas personalizadas:** nombre de impuesto configurable.
- **Sin impuestos:** se pueden omitir valores y campos fiscales compatibles.

EasyInvoicePDF calcula los importes configurados, pero no decide qué modelo se aplica ni valida el cumplimiento local.

## Usuarios previstos

- Autónomos, consultores y contratistas independientes.
- Desarrolladores y diseñadores que facturan a clientes.
- Agencias, empresarios individuales y pequeñas empresas.
- Usuarios que prefieren procesamiento en el navegador o despliegue autogestionado.

## Más adecuado para

- Facturas PDF puntuales.
- Facturas manuales repetidas con perfiles guardados.
- Facturas de servicios, internacionales y con marca.
- Un flujo gratuito, de código abierto, sin cuenta y sin publicidad.

La facturación periódica automatizada no está disponible actualmente.

## Objetivos excluidos

EasyInvoicePDF no exige deliberadamente cuentas ni suscripciones, no muestra publicidad y no crea registros alojados durante el flujo normal del editor público. No pretende sustituir contabilidad, ERP, declaración fiscal, procesamiento de pagos ni validación legal.

## No está destinado a

- Contabilidad, teneduría de libros o ERP.
- CRM, declaración fiscal o asesoramiento legal y tributario.
- Procesamiento de pagos.
- Garantizar el cumplimiento legal o fiscal.

El usuario debe verificar los requisitos locales.

## Modelos de despliegue

- **Aplicación alojada:** https://easyinvoicepdf.com/ — gratuita, sin publicidad y sin cuenta requerida.
- **Despliegue autogestionado:** instalación en infraestructura propia desde el código público conforme a AGPL-3.0.

## Integraciones

### Integraciones actuales

- Descarga de PDF mediante el navegador.
- Enlaces compartibles con datos de factura en la URL.
- Interfaz de compartir del sistema en dispositivos compatibles.
- Códigos QR con enlace de pago, UPI, contacto o texto propio; EasyInvoicePDF no procesa pagos.

### Integraciones previstas

- Envío directo de facturas por correo electrónico.
- API pública para flujos de entrega de facturas.

Estas integraciones aún no están disponibles y no tienen fecha prometida.

## Limitaciones actuales

- Sin facturas periódicas automatizadas, pagos, portal de clientes ni contabilidad.
- Sin envío directo por correo ni sincronización entre dispositivos.
- Sin modo sin conexión dedicado ni PWA instalable.
- Los enlaces no tienen control de acceso; la URL completa contiene los datos.
- Las facturas con logotipo no pueden generar actualmente un enlace compartible.
- Las facturas muy grandes pueden superar el límite de longitud de URL.
- Sin exportación UBL, XRechnung o Factur-X ni validación local.

## Funciones previstas

- Descuentos por partida.

El correo y la API pública se documentan como integraciones previstas. Las facturas periódicas, el portal, los pagos y las integraciones de IA no son compromisos actuales.

## Diferencias de EasyInvoicePDF

- Gratuito, de código abierto y basado en el navegador.
- Sin cuenta, suscripción ni publicidad.
- Admite despliegue autogestionado.
- Guarda datos localmente, no en una cuenta en la nube.
- Incluye 10 idiomas, más de 120 monedas y etiquetas fiscales personalizadas.
- Comparte facturas por enlace sin crear un registro alojado.

## Almacenamiento y privacidad

> Durante la edición normal de una factura y la generación del PDF, el contenido no se transmite a los servidores de EasyInvoicePDF.

- La factura actual y los perfiles se guardan en el almacenamiento local del navegador.
- Un enlace compartible contiene una copia comprimida de los datos en la URL.
- Cualquier persona con el enlace completo puede acceder a los datos.
- Los datos locales pertenecen al navegador y dispositivo y pueden borrarse con los datos del sitio.

## Preguntas frecuentes

### ¿Qué es EasyInvoicePDF?

Un generador de facturas PDF gratuito, de código abierto y basado en el navegador, sin cuenta requerida.

### ¿Es gratuito y de código abierto?

Sí. Las funciones principales son gratuitas y el código usa GNU AGPL-3.0.

### ¿Almacena datos de facturas?

Sí, localmente en el navegador. En el flujo normal no transmite el contenido a servidores; los enlaces compartibles contienen los datos.

### ¿Se puede alojar en infraestructura propia?

Sí, desde el código público conforme a AGPL-3.0.

### ¿Qué tecnologías utiliza?

Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, `next-intl` y `@react-pdf/renderer`.

### ¿Qué modelos fiscales admite?

IVA, GST, impuesto sobre ventas, texto de inversión del sujeto pasivo, etiquetas personalizadas y facturas sin impuestos.

### ¿Funciona en móvil y sin conexión?

Funciona en navegadores móviles compatibles. No ofrece un modo sin conexión dedicado.

### ¿Qué integraciones están disponibles?

Descarga PDF, enlaces compartibles, uso compartido del dispositivo y códigos QR. El correo y la API pública están previstos.

### ¿Procesa pagos o garantiza el cumplimiento?

No. Los QR pueden contener datos de pago, pero el producto no procesa pagos ni garantiza el cumplimiento.

## Enlaces oficiales

- [Generador de facturas](https://easyinvoicepdf.com/?template=default)
- [Cómo funciona](https://easyinvoicepdf.com/how-it-works)
- [Código fuente](https://github.com/VladSez/easy-invoice-pdf)
- [Licencia GNU AGPL-3.0](https://github.com/VladSez/easy-invoice-pdf/blob/main/LICENSE)
- [Historial de cambios](https://easyinvoicepdf.com/changelog)
- [Condiciones del servicio](https://easyinvoicepdf.com/tos)
- [Resumen legible por máquinas](https://easyinvoicepdf.com/llms.txt)

## Política de actualización

Esta página es la referencia canónica del producto. Tras cambios importantes deben actualizarse conjuntamente los datos, la especificación, las funciones, las integraciones, las limitaciones, los planes y las preguntas frecuentes, manteniendo la coherencia con la aplicación, el repositorio, el historial y `llms.txt`.
