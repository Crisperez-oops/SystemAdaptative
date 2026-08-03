export const STORE_TYPES = {
  abarrotes: {
    id: "abarrotes",
    name: "Abarrotes / Minimarket",
    description: "Comida, bebidas y productos del día a día",
    icon: "🛒",
    categories: ["Abarrotes", "Bebidas", "Lácteos", "Snacks", "Limpieza", "Otros"],
    units: ["unidad", "kg", "lt", "paquete"],
  },
  ropa: {
    id: "ropa",
    name: "Ropa / Boutique",
    description: "Prendas, calzado y accesorios",
    icon: "👕",
    categories: ["Hombre", "Mujer", "Niños", "Calzado", "Accesorios", "Otros"],
    units: ["unidad"],
  },
  electronica: {
    id: "electronica",
    name: "Electrónica",
    description: "Celulares, computadoras y gadgets",
    icon: "📱",
    categories: ["Celulares", "Computación", "Audio", "Accesorios", "Otros"],
    units: ["unidad"],
  },
  restaurante: {
    id: "restaurante",
    name: "Restaurante / Cafetería",
    description: "Comidas, bebidas y menú del día",
    icon: "🍽️",
    categories: ["Entradas", "Platos fuertes", "Bebidas", "Postres", "Combos", "Otros"],
    units: ["unidad", "porción"],
  },
  farmacia: {
    id: "farmacia",
    name: "Farmacia",
    description: "Medicamentos y cuidado personal",
    icon: "💊",
    categories: ["Medicamentos", "Cuidado personal", "Vitaminas", "Primeros auxilios", "Otros"],
    units: ["unidad", "caja", "frasco"],
  },
  ferreteria: {
    id: "ferreteria",
    name: "Ferretería",
    description: "Herramientas, materiales y construcción",
    icon: "🔧",
    categories: ["Herramientas", "Electricidad", "Plomería", "Pintura", "Materiales", "Otros"],
    units: ["unidad", "kg", "m", "caja"],
  },
  belleza: {
    id: "belleza",
    name: "Belleza / Estética",
    description: "Cosméticos, peluquería y spa",
    icon: "💅",
    categories: ["Cabello", "Uñas", "Maquillaje", "Cuidado facial", "Servicios", "Otros"],
    units: ["unidad", "servicio"],
  },
  general: {
    id: "general",
    name: "Tienda general",
    description: "Cualquier otro tipo de negocio",
    icon: "🏪",
    categories: ["General", "Promociones", "Otros"],
    units: ["unidad", "kg", "lt", "paquete", "servicio"],
  },
};

export function getStoreType(id) {
  return STORE_TYPES[id] || null;
}
