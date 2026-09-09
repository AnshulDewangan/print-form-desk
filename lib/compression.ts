/** Keep the highest tested quality that satisfies a strict byte ceiling. */
export async function compressToLimit<T extends {size:number}>(encode:(quality:number)=>Promise<T>,limit:number):Promise<T>{
  if(!Number.isFinite(limit)||limit<=0)throw new Error('Invalid file-size limit.');
  let low=.05,high=.95;
  const full=await encode(high);if(full.size<=limit)return full;
  let best=await encode(low);
  if(best.size>limit)throw new Error('Cannot meet the file-size limit at these dimensions. Increase the limit or reduce the pixel dimensions.');
  for(let i=0;i<9;i++){const mid=(low+high)/2,encoded=await encode(mid);if(encoded.size<=limit){best=encoded;low=mid;}else high=mid;}
  return best;
}
