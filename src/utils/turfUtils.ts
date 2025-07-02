import * as turf from "@turf/turf";
import type { FeatureCollection, LineString, Plottable, Point, Polygon, Vector } from "./plotUtils";
// geometries
export const ellipse = (center: turf.helpers.Coord, xSemiAxis: number, ySemiAxis: number, options?:{}={})=>{
    return turf.ellipse(center, xSemiAxis, ySemiAxis, {units:"degrees",...options})
}
// affinity
export const translate = (geojson_: LineString, xDelta=0, yDelta=0, {mutate}: {mutate?:boolean} ={})=>{
    let geojson = geojson_
    if (mutate === false || mutate === undefined) geojson = turf.clone(geojson);
    turf.coordEach(geojson, function(pointCoords){
        pointCoords[0] = pointCoords[0]+xDelta
        pointCoords[1] = pointCoords[1]+yDelta
    })
    return geojson
}
export const scale = (geojson: LineString, scaleX=1, scaleY=1, {mutate, pivot}: {pivot?:[number, number]|Position,mutate?:boolean} ={})=>{
    if (mutate === false || mutate === undefined) geojson =  turf.clone(geojson);
    const pivotCoord = pivot? (Array.isArray(pivot)? turf.point(pivot): pivot) : turf.centroid(geojson);
    turf.coordEach(geojson, function(pointCoords){
        let v = vectorBetween(pivotCoord.geometry.coordinates,pointCoords)
        let [vx,vy] = v
        pointCoords[0] = pivotCoord.geometry.coordinates[0]+vx*scaleX
        pointCoords[1] = pivotCoord.geometry.coordinates[1]+vy*scaleY
    })
    return geojson
}
/*
let line = lineString([[1,1],[5,5]])
let line2 = tu.translate(line,-0.5)
line2 = tu.scale(line2, 0.25,0.25)
return featureCollection([line,line2])
*/
export const triangleDistance = (center:Vector, closer:Vector, further:Vector)=>{
  return distance(center, closer)<distance(center,further)
}
export const distance = (a:Vector, b:Vector)=>{
    return turf.distance(a,b,{units:"degrees"})
}
export const vectorBetween = (p1:Vector,p2:Vector)=>{
    return [p2[0]-p1[0], p2[1]-p1[1]]
}
export const paintObj = (color?:string)=>{
    return color?{ strokeStyle: color }:{}
}
export const paint = (feature: Plottable, color: string)=>{
    feature.properties = {...(feature.properties||{}), ...paintObj(color)}
    return feature
}
export const circle = (origin:any, radius:number=0.1, color?:string)=>{
    return turf.circle(origin, radius, { units: "degrees", properties: paintObj(color)})
}
export const rectangle = ([minX, minY, maxX, maxY]: [number, number, number, number],epsilon:number=0.000000001) => {
    let [cellHeight, cellWidth] = [maxY - minY - epsilon, maxX - minX - epsilon]
    return turf.rectangleGrid([minX, minY, maxX, maxY], cellWidth, cellHeight, { units: "degrees" })
  }
export const rotate = <T extends LineString|[number,number]>(geojson: T, angle=0, {pivot, mutate}:{pivot?:[number, number]|Position, mutate?:boolean} = {}):T=>{
    let returnArray = false
    if (Array.isArray(geojson)){
        geojson = turf.lineString([[0,0],geojson])
        pivot = turf.point([0,0])
        returnArray=true
    }
    if (mutate === false || mutate === undefined) geojson =  turf.clone(geojson) as T;
    
    const pivotCoord = pivot? (Array.isArray(pivot)? turf.point(pivot): pivot) : turf.centroid(geojson);
    turf.coordEach(geojson, function(pointCoords){
        // Translate point to origin
        const translatedX = pointCoords[0] - pivotCoord.geometry.coordinates[0];
        const translatedY = pointCoords[1] - pivotCoord.geometry.coordinates[1];
         // Rotate the point
        const rotatedX = translatedX * Math.cos(angle) - translatedY * Math.sin(angle);
        const rotatedY = translatedX * Math.sin(angle) + translatedY * Math.cos(angle);

        // Translate back
        const finalX = rotatedX +  pivotCoord.geometry.coordinates[0];
        const finalY = rotatedY + pivotCoord.geometry.coordinates[1];   
        pointCoords[0] = finalX
        pointCoords[1] = finalY
    })
    if (returnArray){
        return lastCoord(geojson)
    }
    return geojson
}
export const rewindLine = (line:LineString)=>{
    // if (line.type === "Feature") return rewindLine(line.geometry)
    let values =[...line.geometry.coordinates].reverse()
    console.log(line.geometry.coordinates, values)
    return turf.lineString(values)
}
export const firstCoord = (lineS:FeatureCollection|LineString):[number,number]=>{
    if (lineS.type==="FeatureCollection"){
        return firstCoord(lineS.features[0] as LineString)
    }
    let geometry;
    if (lineS.coordinates){
        geometry = lineS
    }else{
        geometry = lineS.geometry
    }
    return geometry.coordinates[0] as [number,number]
  }
  export const lastCoord = (lineS:FeatureCollection|LineString):[number,number]=>{
    if (lineS.type==="FeatureCollection"){
        return lastCoord(lineS.features[lineS.features.length-1] as LineString)
    }
    let geometry;
    if (lineS.coordinates){
        geometry = lineS
    }else{
        geometry = lineS.geometry
    }
    return geometry.coordinates[geometry.coordinates.length-1] as [number,number]
  }
export const unitVector = (vector:Vector)=>{
    let [nx,ny] = vector
    // Calculate the magnitude
    const magnitude = Math.sqrt(nx * nx + ny * ny);

    return [nx / magnitude, ny / magnitude] as Vector;
}
export const lineToVector = (line: LineString,unitary:boolean=false)=>{
    const coords = line.geometry.coordinates;
    let firstP = firstCoord(line)
    let lastP = lastCoord(line)
    let v = diff(lastP, firstP)
    // const dx = coords[coords.length-1][0] - coords[0][0];
    // const dy = coords[coords.length-1][1] - coords[0][1];
    if (unitary){
        return unitVector(v)
    }
    return v
}
export const iterateChildren = (geometry:Plottable, func:(a:Plottable)=>any, typeSelected="LineString", depth:number=0):any[]=>{
    let returnVal;
    if (geometry.type==typeSelected){
        returnVal = [func(geometry)] 
    }else if (Array.isArray(geometry)){
        returnVal = geometry.map(g=>iterateChildren(g, func, typeSelected, depth+1)).flat()
    }else if (geometry.type==="Feature"){
        returnVal = iterateChildren(geometry.geometry, func, typeSelected, depth+1)
    }else if (geometry.type==="FeatureCollection"){
        returnVal = geometry.features.map(f=>iterateChildren(f, func, typeSelected, depth+1)).flat()
    }
    if (!returnVal) {
        debugger
    }
    if (depth == 0) {return returnVal!.flat()}
    return returnVal!
}
export const loopLine = (geometry:LineString)=>{
    return turf.lineString([...geometry.geometry.coordinates,geometry.geometry.coordinates[0]])    
}
export const size = (polygon)=>{
    let [minX, minY, maxX, maxY] = turf.bbox(polygon)
    return [maxX-minX, maxY-minY, minX, minY]
}
export const mergeLines = (geometry:Plottable, loop=false)=>{
    let coords = iterateChildren(geometry, (s:LineString)=>s.coordinates, "LineString")
    // debugger
    if (loop){
        coords.push(coords[0])
    }
    return turf.lineString(coords)
}
export const normalVector = ([dx,dy]:Vector)=>{
    const nx = dy;
    const ny = -dx;

    return [nx,ny]
}
export const getBoundaryPolygon = (polygon: Polygon)=>{
  return turf.lineString(polygon.geometry.coordinates[0])
}
export const lineNormalVector = (line: LineString, index: number = 0): Vector => {
    const coords = line.geometry.coordinates;
    if (coords.length < 2) {
        throw new Error('LineString must have at least 2 coordinates');
    }
    if (index >= coords.length - 1) {
        throw new Error('Index must be less than the number of line segments');
    }
    const [dx,dy] = lineToVector(line, true)
    // Get the direction vector of the line segment
    

    // Calculate the normal vector (perpendicular to direction vector)
    // Rotate 90 degrees clockwise: (x,y) -> (y,-x)
    return normalVector([dx,dy])
}
export const lineChunkQ = (line: LineString, cuts:number|number[])=>{
    let lengthLine = turf.length(line,{units:'degrees'})
    if (!Array.isArray(cuts)){
        return turf.lineChunk(line,lengthLine/cuts,{units:'degrees'})
    }else{
        if (cuts[0]!=0) cuts = [0,...cuts]
        if (cuts[cuts.length-1]!=1) cuts = [...cuts,1]
        let lineLength = turf.length(line,{units:'degrees'})
        return turf.featureCollection(cuts.slice(1).map((c2, i)=>{
            let c1 = cuts[i]
            let alongC1 = turf.along(line,lineLength*c1,{units:'degrees'})
            let alongC2 = turf.along(line,lineLength*c2,{units:'degrees'})
            return turf.lineString([alongC1.geometry.coordinates, alongC2.geometry.coordinates])
        }))
        
    }
    
}
export const getPointAlongLine = (line:LineString, prop:number)=>{
    return pointToVec(turf.along(line,turf.length(line, {units:'degrees'})*prop,{units:'degrees'}))
}
export const iterateChunks = (line:LineString, cuts:number|number[], transform:(l:Pick<LineString,"geometry">, i:number, totalList:LineString[])=>Plottable|Plottable[])=>{
    let lines = lineChunkQ(line, cuts)
    return lines.features.map((line, i, totalList)=>transform(line.geometry, i, totalList))
    // return turf.featureCollection(newFeatures)
}
export const add = (v1:Vector, v2:Vector)=>{
    return [v1[0]+v2[0],v1[1]+v2[1]]
}
export const vectFromAToB = (A: Vector, B: Vector)=>{
    return diff(B,A)
}
export const mean = (...vectors:number[][])=>{
    return vectors.reduce((acc,v)=>{
        if (!acc.length){
            return v
        }else{
            let returnVal = acc.map((v2,i)=>{
                return v2+v[i]
            })
            return returnVal
        }
    }, []).map((v:any)=>{
        return v/vectors.length
    })
}
export const diff = (B:Vector, A:Vector)=>{
    return [B[0]-A[0],B[1]-A[1]]
}
export const mult = (v1:Vector, k:number)=>{
    return [v1[0]*k,v1[1]*k]
}
export const angleBetween = (vec1:Vector, vec2:Vector)=>{
    const [x1, y1] = vec1;
    const [x2, y2] = vec2;
    
    // Calculate dot product
    const dotProduct = x1 * x2 + y1 * y2;
    
    // Calculate magnitudes
    const mag1 = Math.sqrt(x1 * x1 + y1 * y1);
    const mag2 = Math.sqrt(x2 * x2 + y2 * y2);
    
    // Calculate angle in radians using arccosine
    let angle = Math.acos(dotProduct / (mag1 * mag2));
    
    // Calculate cross product (2D cross product is a scalar)
    const crossProduct = x1 * y2 - y1 * x2;
    
    // If cross product is negative, the angle should be negative
    if (crossProduct < 0) {
        angle = -angle;
    }
    
    return angle;
}
export const pointToVec = (p: Point)=>{
    if (Array.isArray(p))return p
    let geometry: any = p
    if (p.type == "Feature"){
        geometry = p.geometry
    }
    return geometry.coordinates as [number,number]
}
/*
let line = lineString([[1,1],[5,5]])
let line2 = lineString([[1,1],[1,7]])
let angle = tu.angleBetween(tu.lineToVector(line), tu.lineToVector(line2))
let line3 = tu.rotate(line, angle, {pivot:[1,1]})
// return featureCollection([line, line2])
return featureCollection([line, line3])
*/
// RANDOM
const geoms = (fc: any)=>{
    let returnVal;
    switch(fc.type){
        case "Feature":
            returnVal = [fc.geometry]
            break
        case "FeatureCollection":
            returnVal = fc.features.map(f=>geoms(f)).flat()
            break
        default:
            returnVal =  [fc]
            break
    }
    return returnVal
}
export const gridifyPolygon = (polygon: Polygon, cols:number, rows:number, epsilon:number=0.000000001)=>{
    let bbox = turf.bbox(polygon, {units:"degrees"})
    
    let [minX, minY, maxX, maxY] = bbox
    let cellWidth =(maxX-minX)/cols-epsilon
    let cellHeight =Math.floor((maxY-minY)/rows)-epsilon
    let rectangleGrid = turf.rectangleGrid(bbox, cellWidth, cellHeight, {units:"degrees"})
    
    return turf.featureCollection([...rectangleGrid.features.map(f=>turf.intersect(turf.featureCollection([polygon, f])))])
}
export const getRandomPointFromShape = (includedPolygon: Polygon,excludedShapes?: Polygon)=>{
    let bbox = turf.bbox(includedPolygon)
    let isOk = false
    let maxIter = 1000
    let point;
    let gs = geoms(includedPolygon)
    while(!isOk && maxIter>0){
        let includedOk = true
        point = turf.randomPoint(1, {bbox}).features[0]
        for (let g of gs){
            includedOk &&= turf.booleanContains(g, point)
        }
        let excludedOk = !excludedShapes || !turf.booleanContains(excludedShapes, point)
        isOk = includedOk && excludedOk
        maxIter-=1
    }
    return point!
}