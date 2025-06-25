import {featureCollection, feature, lineString, lineStrings, point, points, polygon} from '@turf/helpers'
import { scale } from './turfUtils'
export type FeatureCollection = ReturnType<typeof featureCollection>
export type Polygon = ReturnType<typeof polygon>
export type Feature = ReturnType<typeof feature>
export type LineString = ReturnType<typeof lineString>
export type LineStrings = ReturnType<typeof lineStrings>
export type Point = ReturnType<typeof point>
export type Points = ReturnType<typeof points>
export type Plottable = FeatureCollection | Feature | LineString | LineStrings | Point | Points
export type Plot = (...args: any)=>Plottable
export type Vector = [number,number]|number[]




const createMovementCoords = (coordinates:any[])=>{
    return coordinates.map((c,i)=>{
        let val:any = null
        if (i==0){
            val = {type:"moveTo", value:c}
        }else{
            val = {type:"lineTo", value:c}
        }
        // ls.values.push(val)
        return val
    })
}

export const plot2instruct = (plot:Plottable, properties={}, depth=0)=>{
    let returnList: any[] = []
    let propertiesInherit = {...properties, ...(plot.properties||{})}
    // if (plot?.properties?.id=='bezier'){
    //     debugger
    // }
    if (plot.type==='FeatureCollection'){
        returnList = [...returnList, ...plot.features.flatMap(f=>plot2instruct(f, propertiesInherit, depth+1))]
    }else if (plot.type==="Feature"){
        returnList = [...returnList, ...plot2instruct(plot.geometry, propertiesInherit, depth+1)]
    }else if (plot.type==="LineString"){
        let values = createMovementCoords(plot.coordinates)
        let ls = {properties, values}
        returnList.push(ls)
        
    }else if (plot.type==="Polygon"){
        plot.coordinates.forEach(coords=>{
            let values = createMovementCoords(coords)
            let ls = {properties, values}
            returnList.push(ls)
        })
        
        
        
    }
    return returnList
}

const a5 = [21.0,14.8]
export const paperSizeFromDimensions = (settings:{dimensions:string, orientation:string})=>{
    let [dina, orientation] = [settings.dimensions, settings.orientation]
 let [a,size] = dina.split("")
 let duplicateLog = 5-parseInt(size)
 let duplicateTimes = Math.pow(2,duplicateLog)
 let [width,height]=[a5[0]*duplicateTimes,a5[1]*duplicateTimes]
 if (orientation=="portrait"){
    return [height,width] 
 }
 return [width,height]
}
export const translateRelative = (geometry,config)=>{
    let [width, height] = paperSizeFromDimensions(config)
    console.log(width, height)
    return scale(geometry, width, height, {pivot:[0,0]})
}
