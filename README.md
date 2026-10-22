# A.E.G.I.S. - Sistema de Monitorización de Salud en Vuelo Espacial

## 🚀 Descripción

A.E.G.I.S. (Adaptive Environmental & Guardian Intelligence System) es un prototipo funcional de sistema de monitorización de salud para tripulación en vuelo espacial. Implementa las 7 etapas del plan técnico con detección de anomalías en tiempo real, protocolos de acción automáticos y visualización del cuerpo humano.

## ✨ Características Principales

### 1. **Motor de Procesamiento en 7 Etapas**
- **Captura de datos**: Sensores simulados con marca temporal
- **Control de calidad**: Validación y detección de fallos
- **Referencia individual**: Baseline personalizado por tripulante
- **Análisis de anomalías**: Detección por Z-score y tendencias
- **Reglas de seguridad independientes**: Umbrales críticos que no dependen de IA
- **Interfaz de tripulación**: Dashboard interactivo
- **Almacenamiento offline-first**: Funciona sin conexión a Tierra

### 2. **Cuerpo Humano Virtual Interactivo**
- Visualización SVG del cuerpo humano con zonas señalables
- Las zonas se iluminan según la anomalía detectada (rojo=critical, naranja=high, amarillo=medium)
- Click en cualquier zona para ver detalles de parámetros y anomalías relacionadas
- Zonas: Cerebro, Corazón, Pulmones, Temperatura, Sistema Óseo, Entorno

### 3. **Protocolos de Acción Paso a Paso**
Cuando se detecta un problema crítico, el sistema activa automáticamente un protocolo específico:

- **Emergencia Cardíaca** (FC > 180 o < 40 bpm): 8 pasos en 5-10 min
- **Crisis Hipertensiva** (PA > 200/130): 8 pasos en 10-15 min
- **Hipoxia** (SpO2 < 90%): 7 pasos en 3-5 min
- **Fiebre** (Temp > 38.5°C): 8 pasos en 15-30 min
- **Estrés Psicológico** (Estrés > 70/100): 8 pasos en 1-2h
- **CO2 Elevado** (> 2000 ppm): 8 pasos en 10-20 min

Cada paso incluye:
- Acción específica
- Responsable (Médico, Comandante, Ingeniero, etc.)
- Límite de tiempo
- Detalles de ejecución

### 4. **4 Tripulantes con Perfiles Diferentes**
- Cmdr. Elena Vasquez (Comandante)
- Dr. James Okafor (Médico de Vuelo)
- Ing. Yuki Tanaka (Ingeniera de Sistemas)
- Dra. Amara Diallo (Científica - baseline en establecimiento)

### 5. **Paneles Interactivos**

#### Sensores y Análisis
- Gráficos en tiempo real: FC, PA, Temperatura, Estrés/Sueño
- Áreas de vigilancia: Cardiovascular, Inmunitario, Psicológico, Ambiental, Óseo
- Anomalías detectadas con confianza y calidad de datos

#### Alertas
- **Reglas de Seguridad Independientes**: No dependen de IA, respuesta inmediata
- **Anomalías del Motor Predictivo**: Requieren revisión humana
- Botón para reconocer alertas

#### Calidad de Datos
- Score de calidad (0-100%)
- Fallos de sensor detectados
- Señales degradadas
- Estado del pipeline de procesamiento

#### Control del Sistema
- Pausar/iniciar motor
- Modo online/offline (simula pérdida de conexión con Tierra)
- Ajustar ruido de sensores y tasa de fallos
- **Inyección de anomalías**: Simular condiciones para probar el sistema

## 🎮 Cómo Usar el Sistema

### Probar Detección de Anomalías

1. **Selecciona un tripulante** en el panel izquierdo
2. Ve a la pestaña **"Control del Sistema"**
3. En **"Inyección de Anomalías"**, haz clic en cualquier condición:
   - FC Alta → Activará protocolo de emergencia cardíaca
   - PA Alta → Activará protocolo de crisis hipertensiva
   - SpO2 Baja → Activará protocolo de hipoxia
   - Fiebre → Activará protocolo de fiebre
   - CO2 Alto → Activará protocolo de CO2 elevado
   - Estrés Alto → Activará protocolo de estrés psicológico

4. **Observa el cuerpo humano**: La zona afectada se iluminará
5. **Observa el protocolo**: Aparecerá automáticamente el paso a paso
6. **Revisa las alertas**: En la pestaña "Alertas" verás las reglas de seguridad activadas

### Probar Modo Offline

1. En "Control del Sistema", haz clic en **"En línea (Tierra)"**
2. El sistema cambiará a modo offline
3. Las funciones críticas siguen operando
4. Se acumula cola de sincronización
5. Vuelve a hacer clic para reconectar

### Ajustar Configuración

- **Ruido de sensores**: Aumenta para simular sensores degradados
- **Tasa de fallo**: Aumenta para inyectar fallos aleatorios de sensores
- El sistema detecta automáticamente datos degradados y ajusta la confianza

## 🏗️ Arquitectura Técnica

### Motor (src/engine/)
- **aegisEngine.ts**: Motor principal con las 7 etapas
- **types.ts**: Definiciones de tipos TypeScript

### Componentes (src/components/)
- **Dashboard.tsx**: Contenedor principal
- **CrewOverview.tsx**: Panel de tripulación
- **SensorPanel.tsx**: Gráficos y análisis
- **AlertPanel.tsx**: Alertas y anomalías
- **QualityPanel.tsx**: Control de calidad
- **ControlPanel.tsx**: Configuración y pruebas
- **HumanBody.tsx**: Cuerpo humano virtual SVG
- **ActionProtocol.tsx**: Protocolos de acción paso a paso

### Hooks (src/hooks/)
- **useAEGIS.ts**: Hook React para acceder al motor

## 🔬 Detalles Técnicos

### Detección de Anomalías
- **Z-score**: Desviación respecto a baseline individual (umbral: |z| > 2.5)
- **Tendencias**: 5 lecturas consecutivas en misma dirección
- **Contextual**: Factores ambientales (CO2, radiación)
- **Confianza**: Basada en magnitud de desviación × calidad de datos

### Reglas de Seguridad (Independientes de IA)
```
- FC > 180 bpm o < 40 bpm → CRÍTICO
- PA sistólica > 200 mmHg → CRÍTICO
- PA diastólica > 130 mmHg → CRÍTICO
- SpO2 < 90% → CRÍTICO
- Temperatura > 39.5°C → WARNING
- CO2 > 5000 ppm → WARNING
- Radiación > 0.5 mSv/h → WARNING
```

### Control de Calidad
- Score 0-100 basado en:
  - Fallos de sensor (valores imposibles)
  - Señales degradadas (valores extremos)
  - Errores de timestamp
- Datos con score < 70 no actualizan baseline
- Datos con score < 50 no se analizan para anomalías

## ⚠️ Limitaciones y Consideraciones

Este es un **prototipo de investigación** con las siguientes limitaciones:

1. **Datos simulados**: Los sensores son generados algorítmicamente, no son mediciones reales
2. **No validado clínicamente**: Los umbrales y protocolos son ilustrativos, no certificados
3. **No para uso operativo**: Requiere validación exhaustiva antes de cualquier uso real
4. **Modelos simplificados**: La detección de anomalías usa Z-score básico, no ML avanzado
5. **Sin certificación de vuelo**: No cumple requisitos de seguridad espacial

## 🎯 Próximos Pasos (Según Plan Técnico)

1. Matriz de riesgo y acción (completada en este prototipo)
2. Revisión clínica con asesor médico
3. Selección de datos reales apropiados
4. Implementar modelo de referencia más sofisticado
5. Definir criterios de éxito y métricas de aceptación

## 📊 Tecnologías Utilizadas

- **React 18** con TypeScript
- **Vite** para build
- **Tailwind CSS** para estilos
- **Recharts** para gráficos
- **SVG** para cuerpo humano virtual

## 🚀 Ejecutar el Proyecto

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## 📝 Licencia

Prototipo de investigación. No equivale a validación clínica o certificación de vuelo.

---

**Desarrollado como demostración del Plan Técnico A.E.G.I.S.**
