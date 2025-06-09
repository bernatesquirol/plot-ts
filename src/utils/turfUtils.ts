import * as turf from "@turf/turf";
import type { LineString, Vector } from "./plotUtils";
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
export const vectorBetween = (p1:Vector,p2:Vector)=>{
    return [p2[0]-p1[0], p2[1]-p1[1]]
}
export const rotate = (geojson: LineString, angle=0, {pivot, mutate}:{pivot?:[number, number]|Position, mutate?:boolean} = {})=>{
    if (mutate === false || mutate === undefined) geojson =  turf.clone(geojson);
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
    return geojson
}

export const unitVector = (vector:Vector)=>{
    let [nx,ny] = vector
    // Calculate the magnitude
    const magnitude = Math.sqrt(nx * nx + ny * ny);

    // Return the unit normal vector
    return [nx / magnitude, ny / magnitude] as Vector;
}
export const lineToVector = (line: LineString,unitary:boolean=false)=>{
    const coords = line.geometry.coordinates;
    const dx = coords[coords.length-1][0] - coords[0][0];
    const dy = coords[coords.length-1][1] - coords[0][1];
    if (unitary){
        return unitVector([dx,dy])
    }
    return [dx,dy]
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
    const nx = dy;
    const ny = -dx;

    return [nx,ny]
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

export const iterateChunks = (line:LineString, cuts:number|number[], transform:(l:Pick<LineString,"geometry">, i:number, totalList:LineString[])=>LineString)=>{
    let lines = lineChunkQ(line, cuts)
    let newFeatures = lines.features.map((line, i, totalList)=>transform(line.geometry, i, totalList))
    return turf.featureCollection(newFeatures)
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
/*
let line = lineString([[1,1],[5,5]])
let line2 = lineString([[1,1],[1,7]])
let angle = tu.angleBetween(tu.lineToVector(line), tu.lineToVector(line2))
let line3 = tu.rotate(line, angle, {pivot:[1,1]})
// return featureCollection([line, line2])
return featureCollection([line, line3])
*/
