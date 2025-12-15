// Importación dinámica de Fabric.js para compatibilidad con Next.js
let fabricModule: any = null;

// Función para obtener la instancia de Fabric.js
export async function getFabric() {
  if (fabricModule) return fabricModule;
  fabricModule = await import('fabric');
  return fabricModule;
}

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 600;
export const GRID_SIZE = 10;
export const SNAP_THRESHOLD = 10;

/**
 * Crear un canvas con Fabric.js
 */
export async function createFabricCanvas(
  canvasElement: HTMLCanvasElement,
  options?: any
) {
  const fabric = await getFabric();
  return new fabric.Canvas(canvasElement, {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    backgroundColor: '#ffffff',
    preserveObjectStacking: true,
    ...options,
  });
}

/**
 * Agregar guías de alineación al canvas
 */
export async function setupAlignmentGuides(canvas: any) {
  const fabric = await getFabric();
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  canvas.on('object:moving', (e: any) => {
    const obj = e.target;
    if (!obj) return;

    const objCenterX = obj.left + (obj.width * obj.scaleX) / 2;
    const objCenterY = obj.top + (obj.height * obj.scaleY) / 2;

    // Snap to center X
    if (Math.abs(objCenterX - centerX) < SNAP_THRESHOLD) {
      obj.set({ left: centerX - (obj.width * obj.scaleX) / 2 });
    }

    // Snap to center Y
    if (Math.abs(objCenterY - centerY) < SNAP_THRESHOLD) {
      obj.set({ top: centerY - (obj.height * obj.scaleY) / 2 });
    }

    // Snap to edges
    if (obj.left < SNAP_THRESHOLD) obj.set({ left: 0 });
    if (obj.top < SNAP_THRESHOLD) obj.set({ top: 0 });
    if (obj.left + obj.width * obj.scaleX > canvas.width - SNAP_THRESHOLD) {
      obj.set({ left: canvas.width - obj.width * obj.scaleX });
    }
    if (obj.top + obj.height * obj.scaleY > canvas.height - SNAP_THRESHOLD) {
      obj.set({ top: canvas.height - obj.height * obj.scaleY });
    }

    canvas.renderAll();
  });
}

/**
 * Dibujar guías visuales
 */
export async function drawAlignmentGuides(canvas: any, obj: any) {
  const fabric = await getFabric();
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const objCenterX = obj.left + (obj.width * obj.scaleX) / 2;
  const objCenterY = obj.top + (obj.height * obj.scaleY) / 2;

  const guides: any[] = [];

  // Línea vertical central
  if (Math.abs(objCenterX - centerX) < SNAP_THRESHOLD * 2) {
    const line = new fabric.Line([centerX, 0, centerX, canvas.height], {
      stroke: '#FF0000',
      strokeWidth: 1,
      selectable: false,
      evented: false,
    });
    guides.push(line);
    canvas.add(line);
  }

  // Línea horizontal central
  if (Math.abs(objCenterY - centerY) < SNAP_THRESHOLD * 2) {
    const line = new fabric.Line([0, centerY, canvas.width, centerY], {
      stroke: '#FF0000',
      strokeWidth: 1,
      selectable: false,
      evented: false,
    });
    guides.push(line);
    canvas.add(line);
  }

  return guides;
}

/**
 * Limpiar guías visuales
 */
export function clearAlignmentGuides(canvas: any) {
  canvas.getObjects().forEach((obj: any) => {
    if (obj.type === 'line' && obj.stroke === '#FF0000') {
      canvas.remove(obj);
    }
  });
  canvas.renderAll();
}

/**
 * Agregar texto al canvas
 */
export async function addTextToCanvas(canvas: any, text: string, options?: any) {
  const fabric = await getFabric();
  const fabricText = new fabric.IText(text, {
    left: canvas.width / 2,
    top: canvas.height / 2,
    fontSize: 24,
    fontFamily: 'Arial',
    fill: '#000000',
    originX: 'center',
    originY: 'center',
    ...options,
  });

  canvas.add(fabricText);
  canvas.setActiveObject(fabricText);
  canvas.renderAll();

  return fabricText;
}

/**
 * Agregar imagen al canvas
 */
export async function addImageToCanvas(canvas: any, imageUrl: string, options?: any) {
  const fabric = await getFabric();
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(
      imageUrl,
      (img: any) => {
        // Escalar imagen para que quepa en el canvas
        const maxWidth = canvas.width * 0.8;
        const maxHeight = canvas.height * 0.8;
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);

        img.set({
          left: canvas.width / 2,
          top: canvas.height / 2,
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          ...options,
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();

        resolve(img);
      },
      { crossOrigin: 'anonymous' },
      { crossOrigin: 'anonymous' }
    );
  });
}

/**
 * Exportar canvas a imagen
 */
export function exportCanvasToImage(canvas: any, format: 'png' | 'jpg' = 'png'): string {
  return canvas.toDataURL({
    format,
    quality: 0.95,
    multiplier: 2,
  });
}

/**
 * Exportar canvas a JSON
 */
export function exportCanvasToJSON(canvas: any): string {
  return JSON.stringify(canvas.toJSON());
}

/**
 * Cargar canvas desde JSON
 */
export function loadCanvasFromJSON(canvas: any, json: string): Promise<void> {
  return new Promise((resolve) => {
    canvas.loadFromJSON(json, () => {
      canvas.renderAll();
      resolve();
    });
  });
}
