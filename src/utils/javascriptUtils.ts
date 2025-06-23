export const filterAgg =<T>(list:T[], func:(item:T)=>number, funcAgg = Math.max, filterFunc:(valueSelected:number, valueItem:number, item:T)=>boolean = (valueSelected, valueItem)=>valueSelected!==valueItem )=>{
  let values = list.map(func)
  let valueSelected = funcAgg(...values)
  return list.filter((a,i)=>filterFunc(valueSelected, values[i], a))
}