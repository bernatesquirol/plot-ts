export const filterAgg =<T>(list:T[], func:(item:T)=>number, funcAgg = Math.max, filterFunc:(valueSelected:number, valueItem:number, item:T)=>boolean = (valueSelected, valueItem)=>valueSelected!==valueItem )=>{
  let values = list.map(func)
  let valueSelected = funcAgg(...values)
  return list.filter((a,i)=>filterFunc(valueSelected, values[i], a))
}
export const getRandomBetween = (minSize:number, maxSize:number)=>{
   return Math.random()*(maxSize-minSize)+minSize
}
export const cumsum = (arrayToSum:number[])=>{
    let total = 0
    return arrayToSum.map(i=>{
        total += i
        return total
    })
}
export function normalSample(mu = 0, sigma = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mu + z0 * sigma;
}
export const listSummingUpTo = (total:number, n:number, sample=()=>Math.random())=>{
    let distribution = newArray(n).map(()=>sample())
    let sum = distribution.reduce((acc,i)=>acc+i,0)
    distribution = distribution.map(i=>total*i/sum)
    return distribution
}
export const newArray = (lengthArray:number, value:number=1)=>{
    return (new Array(lengthArray)).fill(value)
}