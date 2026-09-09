import { cropRect, validateSettings, type Settings } from './geometry.js';
import { compressToLimit } from './compression.js';
export type Asset = { id:string; name:string; url:string; image:HTMLImageElement; settings:Settings };
export async function decode(file:File):Promise<HTMLImageElement> {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error(`${file.name}: use JPG, PNG or WebP.`);
  if(file.size>20*1024*1024) throw new Error(`${file.name}: maximum file size is 20 MB.`);
  const url=URL.createObjectURL(file);
  try {
    const image=new Image(); image.src=url; await image.decode();
    if(image.naturalWidth*image.naturalHeight>40000000) throw new Error(`${file.name}: maximum image size is 40 megapixels.`);
    return image;
  } catch(error) {URL.revokeObjectURL(url);throw error;}
}
export function renderCanvas(image:HTMLImageElement,s:Settings,preview:number|false=false):HTMLCanvasElement {
  validateSettings(s);
  const canvas=document.createElement('canvas');
  const scale=preview?Math.min(1,preview/Math.max(s.width,s.height)):1;
  canvas.width=Math.max(1,Math.round(s.width*scale)); canvas.height=Math.max(1,Math.round(s.height*scale));
  const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('Your browser does not support image processing.');
  const turn=s.rotation%180!==0, w=turn?image.naturalHeight:image.naturalWidth,h=turn?image.naturalWidth:image.naturalHeight;
  const crop=cropRect(w,h,s);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.scale(canvas.width/crop.width,canvas.height/crop.height);ctx.translate(-crop.x,-crop.y);ctx.translate(w/2,h/2);ctx.rotate(s.rotation*Math.PI/180);ctx.drawImage(image,-image.naturalWidth/2,-image.naturalHeight/2);
  return canvas;
}
const jpeg=(canvas:HTMLCanvasElement,quality:number)=>new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not encode this image.')),'image/jpeg',quality));
export async function encodeJPEG(asset:Asset):Promise<Blob> {
  const canvas=renderCanvas(asset.image,asset.settings);
  try{return await compressToLimit(quality=>jpeg(canvas,quality),asset.settings.maxKB*1000);}
  catch(e){throw new Error(`${asset.name}: ${(e as Error).message}`);}
}
export function filename(name:string,index:number){return `${String(index+1).padStart(2,'0')}-${name.replace(/\.[^.]+$/,'').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,70)||'image'}.jpg`;}
export function download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
