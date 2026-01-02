# Patrones de Arquitectura y Código

## Principios Fundamentales

1. **SRP** - Cada archivo tiene UNA responsabilidad
2. **Límite 300 líneas** - Si supera, refactorizar
3. **Custom Hooks** - Lógica de estado en `src/hooks/`
4. **Composición** - Componentes pequeños que se componen

## Estructura por Feature

```
src/
├── components/
│   └── [feature]/           # Componentes agrupados
│       ├── index.js         # Exports centralizados
│       ├── MainComponent.js
│       └── SubComponent.js
├── hooks/
│   ├── index.js             # Exports centralizados
│   └── use[Feature].js      # Hooks por feature
├── screens/
│   └── [Name]Screen.js      # Orquestadores (~400 líneas máx)
└── services/
    └── [entity]Service.js   # Servicios por entidad
```

## Patrones de Hooks

```javascript
// Hook para datos
export function useFeatureData(params) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => { ... }, [params]);
  useEffect(() => { cargar(); }, [cargar]);

  return { data, loading, cargar };
}

// Hook para acciones
export function useFeatureActions(onSuccess) {
  const crear = async (data) => { ... };
  const eliminar = async (id) => { ... };
  return { crear, eliminar };
}

// Hook para modal
export function useFeatureModal() {
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState({});
  return { visible, state, abrir: () => setVisible(true), cerrar: () => setVisible(false) };
}
```

## Patrón de Screen (Orquestador)

```javascript
export default function FeatureScreen() {
  const { data, loading } = useFeatureData();
  const actions = useFeatureActions();
  const modal = useFeatureModal();

  return (
    <View>
      <FeatureList data={data} onAction={actions.doSomething} />
      <FeatureModal {...modal} />
    </View>
  );
}
```

## Convenciones de Nombres

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Hook | `use[Feature]` | `useBloqueos` |
| Componente | `PascalCase` | `HorarioChip` |
| Carpeta | feature name | `home/`, `partidas/` |
| Callback prop | `on[Acción]` | `onPress`, `onChange` |

## Anti-patrones a Evitar

1. Archivos > 300 líneas
2. Lógica en el render
3. Props drilling excesivo
4. Código duplicado
5. Componentes que hacen demasiado
6. Estado mezclado
7. Añadir features sin refactorizar

## Checklist de Refactorización

- [ ] ¿Archivo < 300 líneas?
- [ ] ¿Una sola responsabilidad?
- [ ] ¿Lógica en hooks separados?
- [ ] ¿Componentes reutilizables?
- [ ] ¿Sin código duplicado?
- [ ] ¿index.js para exports?

## Cuándo Refactorizar

1. Archivo supera 400 líneas
2. Más de 5 useState en componente
3. return() > 100 líneas de JSX
4. Antes de añadir feature a archivo complejo
