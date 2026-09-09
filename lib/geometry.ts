export type Settings = { width: number; height: number; maxKB: number; zoom: number; x: number; y: number; rotation: number; printWidth: number; copies: number };
export const DEFAULT: Settings = { width: 413, height: 531, maxKB: 100, zoom: 1, x: 50, y: 50, rotation: 0, printWidth: 35, copies: 6 };
export type Preset = { id: string; name: string; settings: Settings };
export const PRESETS: Preset[] = [
  { id: 'photo', name: 'Photo · 35 × 45 mm', settings: DEFAULT },
  { id: 'square', name: 'Photo · 2 × 2 inch', settings: { ...DEFAULT, width: 600, height: 600, printWidth: 50.8, maxKB: 200, copies: 4 } },
  { id: 'signature', name: 'Signature · 600 × 200 px', settings: { ...DEFAULT, width: 600, height: 200, printWidth: 60, maxKB: 50, copies: 1 } },
];
export const SHEETS = { a4: { width: 210, height: 297, name: 'A4 · 210 × 297 mm' }, small: { width: 101.6, height: 152.4, name: '4 × 6 inch' } };
export const LIMITS: Record<keyof Settings, [number, number]> = { width:[32,2400], height:[32,2400], maxKB:[5,5000], zoom:[1,4], x:[0,100], y:[0,100], rotation:[0,270], printWidth:[5,190], copies:[1,40] };
export function validateSettings(value: unknown): Settings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid settings.');
  const obj = value as Record<string, unknown>;
  for (const [key, [min,max]] of Object.entries(LIMITS)) {
    const n = obj[key];
    if(typeof n !== 'number' || !Number.isFinite(n) || n < min || n > max) throw new Error(`${key} must be between ${min} and ${max}.`);
  }
  if (![0,90,180,270].includes(obj.rotation as number)) throw new Error('Rotation must be a quarter turn.');
  for(const key of ['width','height','copies']) if(!Number.isInteger(obj[key])) throw new Error(`${key} must be a whole number.`);
  return Object.fromEntries(Object.keys(LIMITS).map(key=>[key,obj[key]])) as Settings;
}
export function cropRect(width: number, height: number, s: Settings) {
  const ratio = s.width / s.height;
  const w = Math.min(width, height * ratio) / s.zoom;
  const h = w / ratio;
  return { x: (width-w)*s.x/100, y:(height-h)*s.y/100, width:w, height:h };
}
export type Placement = { id: string; x:number; y:number; width:number; height:number; page:number };
export function arrange(items: {id:string; settings:Settings}[], sheet: {width:number;height:number}, margin=5, gap=2): Placement[] {
  const result: Placement[]=[];
  let x=margin,y=margin,rowHeight=0,page=0;
  for(const item of items) {
    const s=validateSettings(item.settings), w=s.printWidth, h=w*s.height/s.width;
    if(w>sheet.width-2*margin || h>sheet.height-2*margin) throw new Error('An image is too large for this sheet. Reduce its print width or choose A4.');
    for(let n=0;n<s.copies;n++) {
      if(x+w>sheet.width-margin+1e-8) {x=margin;y+=rowHeight+gap;rowHeight=0;}
      if(y+h>sheet.height-margin+1e-8) {page++;x=margin;y=margin;rowHeight=0;}
      result.push({id:item.id,x,y,width:w,height:h,page});
      x+=w+gap; rowHeight=Math.max(rowHeight,h);
    }
  }
  return result;
}
