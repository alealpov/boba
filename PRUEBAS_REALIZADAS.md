# Pruebas realizadas

## Auditoría estática

Resultado: **aprobado**.

- 508 preguntas y 508 identificadores únicos.
- 354 bloques.
- Simulacro 1: 254 preguntas, distribución 41/50/50/58/55.
- Simulacro 2: 254 preguntas, distribución 41/50/50/58/55.
- Cruce entre simulacros: 0.
- Pares semánticos repetidos al umbral configurado: 0.
- Textos de pregunta vacíos: 0.
- Claves inválidas: 0.
- Textos de respuesta correcta vacíos: 0.
- Soluciones sin campos obligatorios: 0.
- Soluciones con menos de tres pasos: 0.
- Recursos visuales faltantes: 0.

El detalle está en `data/integrity_audit.json`.

## Prueba integral en navegador

Resultado: **aprobado** en Chromium.

Se verificó:

1. carga de las dos tarjetas de simulacro;
2. composición exacta de 254 preguntas;
3. cero cruces de preguntas;
4. guardado y reanudación;
5. habilitación del botón de finalizar después de responder todas;
6. calificación independiente de ambos simulacros;
7. visualización de soluciones verificadas;
8. puntuación alta al responder todas correctamente;
9. pantalla inicial y resultados en tamaño móvil;
10. ausencia de errores JavaScript y recursos fallidos en la prueba principal.

En la prueba de todas las respuestas correctas, cada simulacro produjo 495/500 debido al escalamiento aproximado del modelo, no 500 exactos.
