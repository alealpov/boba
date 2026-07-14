# Simulador personal Saber 11 — dos simulacros

Aplicación web estática para estudio personal. No utiliza cuentas, cronómetro ni servidor de base de datos.

## Contenido

- **2 simulacros fijos** de **254 preguntas** cada uno.
- **508 preguntas únicas**; una pregunta no aparece en ambos simulacros.
- Distribución por simulacro: 41 de Lectura Crítica, 50 de Matemáticas, 50 de Sociales y Ciudadanas, 58 de Ciencias Naturales y 55 de Inglés.
- Los textos, tablas, gráficas y situaciones compartidas permanecen unidos a sus preguntas.
- Guardado automático independiente para cada simulacro.
- Puntaje estimado por materia y global de 0 a 500.
- Revisión posterior con clave, justificación, pasos, distractores y mini guía.

## Calidad de las soluciones

Las 508 preguntas tienen una solución estructurada. La procedencia se muestra dentro de la revisión:

- **93 explicaciones oficiales** adaptadas de guías incorporadas.
- **100 soluciones verificadas específicamente**.
- **315 soluciones guiadas revisadas**, construidas con el enunciado y la clave; no se presentan como oficiales.

## Uso local

### Windows

1. Descomprime la carpeta completa.
2. Ejecuta `start_local.bat`.
3. Abre `http://localhost:8080`.

### Linux o macOS

```bash
./start_local.sh
```

También se puede ejecutar:

```bash
python -m http.server 8080
```

## Archivos de auditoría

- `data/integrity_audit.json`: integridad del banco, cuotas, recursos y soluciones.
- `data/browser_test_report.json`: prueba integral en navegador.
- `data/questions_inventory.csv`: inventario de las 508 preguntas.
- `data/groups_inventory.csv`: inventario de bloques de contexto.
- `data/semantic_duplicate_audit.json`: auditoría de similitud.
- `data/solution_audit.json`: clasificación de soluciones.

## Limitaciones

El puntaje TRI es una aproximación pedagógica; no usa los parámetros psicométricos privados del ICFES. El progreso se guarda en el navegador, por lo que puede perderse al borrar los datos del sitio o cambiar de dispositivo.

La publicación por enlace público queda como última etapa.
