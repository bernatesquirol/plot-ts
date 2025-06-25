import { featureCollection, lineString } from "@turf/helpers";
import * as turf from "@turf/turf";
import { newArray, type LineString, type Plottable, type Vector } from "../utils/plotUtils";
import z from "zod/v4";
import _, { random } from 'lodash'
import LSystem from 'lindenmayer'
import type { Polygon, Position } from "geojson";
import * as tu from '../utils/turfUtils'
import * as pu from '../utils/plotUtils'
// import * as prob from 'probability-distributions';
import seedrandom from 'seedrandom';
import * as ss from 'simple-statistics'
import {Image} from 'image-js'
import p5 from 'p5'
import { generateRandomWalkInPolygon } from "../utils/walks";
import { polygonSlice } from "../utils/polygonSlice";
const rng = seedrandom('my-seed');
// const oldRandom = Math.random;
Math.random = rng;


const lineMergeSchema = z.object({
    lines: z.object()
})
const lineMerge = (params: z.infer<typeof lineMergeSchema>) => {
    let { lines } = lineMergeSchema.parse(params)
    let properties = lines.reduce((acc, item) => {
        return { ...acc, ...(item.properties || {}) }
    }, {})
    let geometry = lineString(features.flatMap(g => g.geometry.coordinates), properties)
    return geometry
}
// const subsampleSchema = {
//     line: z.ZodType<LineString>,
//     simplificationFactor: z.number().default(0.5)
// }
// const subsample = ({subsampleSchema})=>{

//     let coords = geo.geometry.coordinates
//     init, last = 
//     geo.geometry.coordinates = coords
// }
const BballNetParams = z.object({
    radius: z.number().optional().default(5),
    m: z.number().optional().default(0.15),
    n: z.number().optional().default(0.25),
    totalSlices: z.number().optional().default(12),
    lenStraight: z.number().optional().default(4),
    height: z.number().optional().default(0.5)
})
const createUnequalCuts = (line,)=>{
    
}
const translateChunks = (line: LineString, amplitude:number, cuts:number|number[], randomGenerator?: (i?:number)=>number)=>{
    // let lineNormalVectorResult = lineNormalVector(line);
    let lineNormalVectorResult = [1,0]
    let angle = tu.angleBetween( lineNormalVectorResult, tu.lineToVector(line),)
    if (!randomGenerator) randomGenerator = ()=>Math.random()
    return tu.iterateChunks(line, cuts, (subline, i, list)=>{
        let amplitudeChunk = (randomGenerator(i)*amplitude)-amplitude/2
        let newSl = subline
        let centroid = turf.centroid(subline)
        if (i==0){
            centroid = turf.point(subline.coordinates[0])
        }else if (i==list.length-1){
            centroid = turf.point(subline.coordinates[subline.coordinates.length-1])
        }
        newSl =tu.rotate(subline, -angle, {pivot: centroid})
        // newSl = tu.translate(newSl as any, lineNormalVectorResult[0]*amplitudeChunk, lineNormalVectorResult[1]*amplitudeChunk)
        if (i>0 && i<list.length-1){
            newSl = tu.translate(newSl, 0, amplitudeChunk)
        }
        let scaleFactor = Math.cos(angle)
        newSl = tu.scale(newSl,scaleFactor,scaleFactor, {pivot:centroid})
        return newSl
    })
}
// const gradient = (, orientation)=>{

// }
// const z = (x,y)=>{
//     return turf.distance([x,y], [0,0], {units:'degrees'})
// }
const iterGrid = (n:number, m:number, func: (x:number,y:number)=>pu.Plottable, resolution=1)=>{
    let gridReturn: pu.Plottable[][] = []
    let i = 0
    while (i<n){
        let j = 0
        let rowReturn: pu.Plottable[] = []
        while (j<m){
            rowReturn.push(func(i,j))
            j += resolution
        }
        gridReturn.push(rowReturn)
        i += resolution
    }
    
    return gridReturn
}
// TODO profunditat en textures: grid
const com = ()=>{
    
}
const pine = ()=>{
    return tu.ellipse([10,10],0.1,0.1)
    return lineString([
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0]
    ])
}
// const bezierSpline = (line, {resolution, sharpness})=>{
// }
const bballNet = (params: z.infer<typeof BballNetParams>) => {
    params = BballNetParams.parse(params)
    const { radius, m, n, totalSlices, lenStraight, height } = params
    // TODO: no es fiable
    const curve = turf.bezierSpline(lineString([[1, 1], [5, 5], [3, 5]]), {
        // resolution: 10000
    })
    const line = lineString([
        [-n / 3, -n / lenStraight],
        [0, 0]
    ])
    // return curve
    let lineMerged = lineMerge(line, curve)
    return lineMerged
    // lineMerged = turf.transformTranslate(lineMerged, 500, 50)

    // return turf.transformScale(lineMerged, 10)
    // a,b,c,d = l.bounds
    // x_dist = c-a
    // y_dist = d-b
    // w_line,h_line = shu.size(line)

    // p = lineMerge([l,sh.affinity.translate(sh.affinity.scale(l, -1, 1),x_dist)])
    // w,h = shu.size(p)
    // scale_prop = radius/w
    // p = sh.affinity.scale(p, scale_prop, scale_prop)
    // p2 = sh.affinity.translate(sh.affinity.scale(p, 1, -1),0,- h * scale_prop + h_line*scale_prop*2)
    // lip = GeometryCollection([p,p2])
    // # return lip
    // # return lip
    // # return lip
    // tots_lips = []
    // mergers_entre_lips = []
    // def getLines(last_line, new_line):
    //     line = LineString([list(list(new_line.geoms)[1].coords)[0],list(list(last_line.geoms)[0].coords)[0]])
    //     line2 = LineString([list(list(new_line.geoms)[0].coords)[-1],list(list(last_line.geoms)[1].coords)[-1]])
    //     return [line, line2]
    // first_line = None
    // for i in range(int(total_slices/2)):
    //     new_line = sh.affinity.rotate(lip, i*(360/total_slices))
    //     if (i>0):
    //         mergers_entre_lips += getLines(last_line, new_line)
    //     else:
    //         first_line = new_line
    //     tots_lips.append(new_line)
    //     last_line = new_line
    // # inverse
    // line = LineString([list(list(first_line.geoms)[1].coords)[0],list(list(last_line.geoms)[1].coords)[-1]])
    // line2 = LineString([list(list(first_line.geoms)[0].coords)[-1],list(list(last_line.geoms)[0].coords)[0]])
    // mergers_entre_lips += [line, line2]
}
const createKoch = () => {
    var rotationRelative = 0
    let pointer = [0,0]
    let allLs: LineString[] = []
    var koch = new LSystem({
        axiom: 'F++F++F',
        productions: { 'F': 'F-F++F-F' },
        finals: {
            '+': () => {
                rotationRelative += (Math.PI / 180) * 60
            },
            '-': () => {
                rotationRelative -= (Math.PI / 180) * 60
            },
            'F': () => {
                let ls = lineString([
                    [0, 0],
                    [0, 4 / (koch.iterations + 1)]
                ])
                let lsTranslated = translate(ls, pointer[0], pointer[1])
                // debugger
                let lsRotated = rotate(lsTranslated, rotationRelative, {pivot:ls.geometry.coordinates[0], })
                // debugger
                pointer = lsRotated.geometry.coordinates[1]
                allLs.push(lsRotated)
            }
        }
    })
    koch.iterate(4)
    koch.final()
    return scale(featureCollection(allLs),0.25, 0.25)
}
const mergeLine = (features:any[])=>{
    return lineString(features.map(f=>f.coordinates).flat())
}

const lineFromPointAndVector = (p:pu.Vector, v:pu.Vector, length_?:number, center:boolean=false)=>{
    let initialP = p
    let length = length_
    if (length==null){
        length = 1
    }
    if (center){
        length /= 2
    }
    v = tu.mult(tu.unitVector(v),length)
    
    let finalP = [p[0]+v[0],p[1]+v[1]]
    if (center){
        initialP = [initialP[0]-v[0],initialP[1]-v[1]]
    }
    return lineString([initialP, finalP])
}


const getLineEndings = (line)=>{
    let coords = line.geometry.coordinates
    return [coords[0],coords[coords.length-1]]

}
// function createParticleScribble({origin, destination, options}) {
//     const {
//         steps = 50,
//         noiseStrength = 3,
//         dampening = 0.95,
//         timeStep = 0.1
//     } = options||{};

//     const path = [origin];
//     let currentPoint = origin.slice();
//     let velocity = [0, 0];

//     for (let i = 0; i < steps; i++) {
//         // Calculate direct force towards target
//         const targetForce = [
//             (destination[0] - currentPoint[0]) * 0.02,
//             (destination[1] - currentPoint[1]) * 0.02
//         ];

//         // Add random noise forces
//         const noiseForce = [
//             (Math.random() - 0.5) * noiseStrength,
//             (Math.random() - 0.5) * noiseStrength
//         ];

//         // Update velocity with forces
//         velocity[0] += targetForce[0] + noiseForce[0];
//         velocity[1] += targetForce[1] + noiseForce[1];

//         // Apply dampening
//         velocity[0] *= dampening;
//         velocity[1] *= dampening;

//         // Update position
//         currentPoint[0] += velocity[0] * timeStep;
//         currentPoint[1] += velocity[1] * timeStep;

//         path.push([currentPoint[0], currentPoint[1]]);

//         // Stop if we're very close to the target
//         const distance = turf.distance(
//             turf.point(currentPoint), 
//             turf.point(destination), 
//             { units: 'degrees' }
//         );
        
//         if (distance < 0.0001) break;
//     }

//     // Ensure we end at the target point
//     path.push(destination);

//     return turf.lineString(path);
// }
const lissajousParametric = (center, height,width,frequencyRatio)=>{
    let parametric = (t:number)=>{
        return [center[0] + a * Math.sin(t),center[1] + b * Math.sin(n * t)]
    }
    return parametric
} 
// const lissajous = (center) => {
//     const points: Position[] = [];
//     const steps = 100;
//     const a = 2; // horizontal amplitude
//     const b = 1; // vertical amplitude
//     const n = 2; // frequency ratio for figure-8
    
//     return parametric
//     for (let i = 0; i <= steps; i++) {
//         const t = (i / steps) * 2 * Math.PI/2;
//         const x = center[0] + a * Math.sin(t);
//         const y = center[1] + b * Math.sin(n * t);
//         points.push([x, y]);
//     }
//     console.log(turf.bbox(lineString(points)))
//     return featureCollection([turf.circle(center, 0.1, {units:"degrees"}),lineString(points)]);
// // }
// type ParametricFunc = (t)=>[number,number]
// function cutPolygon(polygon, line, direction=1) {
//     var j;
//     var polyCoords = [];
//     var cutPolyGeoms = [];
//     var retVal = null;
  
//     if ((polygon.type != 'Polygon') || (line.type != 'LineString')) return retVal;
  
//     var intersectPoints = turf.lineIntersect(polygon, line);
//     var nPoints = intersectPoints.features.length;
//     if ((nPoints == 0) || ((nPoints % 2) != 0)) return retVal;
  
//     var offsetLine = turf.lineOffset(line, (0.01 * direction), {units: 'kilometers'});
  
//     for (j = 0; j < line.coordinates.length; j++) {
//       polyCoords.push(line.coordinates[j]);
//     }
//      for (j = (offsetLine.geometry.coordinates.length - 1); j >= 0; j--) {
//       polyCoords.push(offsetLine.geometry.coordinates[j]);
//     }
//     polyCoords.push(line.coordinates[0]);
//     var thickLineString = turf.lineString(polyCoords);
//     var thickLinePolygon = turf.lineToPolygon(thickLineString);   
  
//     var clipped = turf.difference(featureCollection([polygon, thickLinePolygon.geometry]));  
//     for (j = 0; j < clipped.geometry.coordinates.length; j++) {
//       var polyg = turf.polygon(clipped.geometry.coordinates[j]);
//       var overlap = turf.lineOverlap(polyg, line, {tolerance: 0.005});
//       if (overlap.features.length > 0) {
//         cutPolyGeoms.push(polyg.geometry.coordinates);
//       };
//     };
  
//     if (cutPolyGeoms.length == 1)
//       retVal = turf.polygon(cutPolyGeoms[0],);
//     else if (cutPolyGeoms.length > 1) {
//       retVal = turf.multiPolygon(cutPolyGeoms);
//     }
  
//     return retVal;
// };

const bezierLoops = (i:number)=>{
    
    let split = createCircleScribble([3,3], 1, [Math.random()*5,Math.random()*5]).circleLine
    let connection = bezierCurveFromAngles([1,1],[4,4], 0,- Math.PI/2, {curviness:0.45})
    // 0 -> 0
    // entenem que el range es 0 a 1 per cada parametric Func
    // let lineSpline = turf.lineString((new Array(i)).fill(0).map((_,j)=>[[1,j+1], [2,j+1], [0.5,j]]).flat())
    // turf.bezierSpline(lineSpline),
    // return lineSplinesplit
    return featureCollection([connection,split ].filter(d=>d))
}
const create2dProbabilityGrid = (polygon, width, height)=>{
    turf.rectangleGrid()
}
const randomWalkerCircles = ({
    origin,
    // originInertia,
    destination,
    // destinationInertia,
    polygon, 
    steps=2,
    targets = 4
})=>{
    
    let startingPoint = origin;
    let debugFeatures: Plottable[] = []
    let lines: Plottable[] = []
    // let skipPoints = null
    // let circleBuffer = Math.sqrt(turf.area(polygon)/steps)*0.01
    let skipArc = null
    // debugFeatures.push(turf.circle(origin, 0.1, {units:"degrees"}),)
    // debugFeatures.push(turf.circle(destination, 0.1, {units:"degrees"}),)
    debugFeatures.push(turf.circle(origin, 0.1, {units:"degrees", properties:{strokeStyle:"blue"}}))
    debugFeatures.push(turf.circle(destination, 0.1, {units:"degrees", properties:{strokeStyle:"blue"}}))
    for (let targetIndex=0;targetIndex<targets;targetIndex++){
        let targetPoint;
        if (targetIndex<targets-1){
            targetPoint =  tu.pointToVec(getRandomPointFromShape(polygon)!)
        }else{
            targetPoint = destination
        }
        debugFeatures.push(turf.circle(targetPoint, 0.1, {units:"degrees", properties:{strokeStyle:"purple"}}))
        for (let i=0;i<steps;i++){
            let line = lineString([startingPoint, targetPoint])
            let buffer = turf.buffer(line, 1)
            // debugFeatures.push(buffer)
            let bufferNPolygon = turf.intersect(featureCollection([buffer, polygon]))
            let choosenArc = null
            
            while(choosenArc==null){
                let endPoint;
                endPoint =  tu.pointToVec(getRandomPointFromShape(bufferNPolygon)!)
                if (i==steps-1){
                    endPoint = targetPoint
                }
                
                // = tu.pointToVec(getRandomPointFromShape(bufferNPolygon)!)
                // if (skipPoints && turf.booleanIntersects(turf.point(endPoint), skipPoints)){
                //     console.log("skipped",endPoint)
                //     continue
                // }
                // let radius = turf.circle(endPoint, circleBuffer, {units:"degrees"})
                // if (!skipPoints){
                //     skipPoints = radius
                // }else{
                //     skipPoints = turf.union(featureCollection([skipPoints, radius]))
                // }
                
                
                let line = lineString([startingPoint, endPoint])
                let middlePoint = turf.centroid(line)
                
                let bbox = turf.bbox(polygon,{units:"degrees"})
                
                let normalVector = tu.lineNormalVector(line)
                
                let maxLength = Math.sqrt(bbox[0]**2+bbox[2]**2)*2 //(segur k talla 2 cops)
                let lineNormal = lineFromPointAndVector(middlePoint.geometry.coordinates, normalVector, maxLength, true)
                
                // let [startLineNormal, endLineNormal] = getLineEndings(lineNormal)
                // INTERSECT with bounds of polygon & invert, pick random point
                let tryArc = createArc({
                    center: tu.add(tu.pointToVec(middlePoint),tu.mult(tu.unitVector(normalVector),Math.random()*3*(-1))),
                    pointA: startingPoint,
                    pointB: endPoint,
                })
                
                // if (skipArc && turf.booleanIntersects(tryArc, skipArc)){
                //     console.log("skipping arc")
                //     continue
                // }
                if (!turf.booleanIntersects(turf.polygonToLine(polygon),tryArc)){
                    if (i<steps-1)debugFeatures.push(turf.circle(endPoint, 0.1, {units:"degrees"}))
                    choosenArc = tryArc
                    lines.push(choosenArc)
                    startingPoint = endPoint
                    skipArc=choosenArc
                }
                
                // let geo = turf.lineIntersect(lineNormal, polygon)
                // let trials = 10
                // while(){
                    
                // }
                
                // pointA.coordinates
                // la distancia del punt que escullo a points 
                // ha de ser mes gran que del punt que escullo a la interseccio
                // a partir de quin punt de la linia puc fer una circumferencia que entri?
                // midpoint +
                // dist(newpoint, edge) < dist(newpoint, initialPoint)
                // d(mid, init) < d(mid, edge) -> tot ok, tota la linia available
                // d(mid, init) < d(mid, edge) -> tot ok, tota la linia available
                // edge with vector
    
                // let d1 = tu.distance(middlePoint, edge)
                // let d2 = tu.distance(middlePoint, initPoint)
                // if (d1>d2){
                //     // no restriiction
                // }else{
                //     let c = (d2**2-d1**2)/(2*d1)
                //     // add middlePoint
                //     let vector = tu.mult(tu.unitVector(tu.vectFromAToB(edge,middlePoint)),c)
                //     let startingPoint = tu.add(tu.pointToVec(middlePoint), vector)
                // }
                // debugFeatures.push(lineNormal)
                // // vector
                // // let arcProposal = 
                // break
                // startingPoint = endArc
                // create normal line in the middle point
                // get intersection points with polygon
                // maxRadius = min intersection && length
                
            }
            
        }
    }
    
    let finalLine = mergeLines(lines)
    return finalLine
    return featureCollection([...debugFeatures, finalLine])
}
const mergeLines = (lines)=>{
    return lineString(lines.reduce((acc,line)=>[...acc, ...line.geometry.coordinates],[]))
}
const rectangle = (origin: Vector, w:number, h:number, center=false)=>{
    if (center){
        origin[0]-=w/2
        origin[1]-=h/2
    }
    let bounds = turf.lineString([
        [origin[0], origin[1]],
        [origin[0]+w, origin[1]],
        [origin[0]+w, origin[1]+h],
        [origin[0], origin[1]+h],
        [origin[0], origin[1]],
      ]);
      return turf.lineToPolygon(bounds)
}
const muntanyaFactory = ()=>{
    let limitPolygon = rectangle([1,1],5,5)
    // let walker = generateRandomWalkInPolygon(
    //     limitPolygon, 
    //     [1, 1],
    //     [5,5],
    //     {
    //         maxSteps: 15,
    //         stepSize: 1.5,
    //         splinePoints: 100,
    //         maxAttempts: 50
    //     }
    // )
    // console.log(walker)
    // let walker = randomWalker({
    //     origin: [2, 2],
    //     originInertia:[1,1],
    //     destination: [5,5],
    //     destinationInertia:[-1,-1],
    //     polygon: limitPolygon
    // })
    let walker = bezierLoops(4)
    console.log(walker)
    let line = lineString([[1,2],[2,1]])
    let distributionUnequal = cumsum(listSummingUpTo(1, 3))
    console.log(distributionUnequal)
    // let arc = createArc([4,4], 2, 30, 120)
    // iterGrid(4,5,(x,y)=>{
    //     turf.circle()
    // })
    // Example usage:
    return featureCollection([ walker,])
    return featureCollection([limitPolygon, walker,mergeLine(translateChunks(line, 1, distributionUnequal).features)])
    let line2 = lineString([[1,1],[1,7]])
    let angle = tu.angleBetween(tu.lineToVector(line), tu.lineToVector(line2))
    let line3 = tu.rotate(line, angle, {pivot:[1,1]})
    return featureCollection([line, line2])
    return featureCollection([line, line3])
    // console.log(tu.lineToVector(line), tu.lineToVector(line2))
    // console.log(tu.angleBetween(tu.lineToVector(line), tu.lineToVector(line2)))
    
    // console.log(tu.angleBetween(tu.lineToVector(line2), tu.lineToVector(line)))
    return featureCollection([line, line3])
}
// const createArc = ({center, radius, startAngleDegrees,endAngleDegrees,steps=32}: {center: Position, radius: number, startAngleDegrees: number, endAngleDegrees: number, steps?: number}) => {
//     const points: Position[] = [];
//     let startAngle = -1*startAngleDegrees*Math.PI/180
//     let endAngle = -1*endAngleDegrees*Math.PI/180
//     const angleStep = (endAngle - startAngle) / steps;
    
//     for (let i = 0; i <= steps; i++) {
//         const angle = startAngle + (i * angleStep);
//         const x = center[0] + radius * Math.cos(angle);
//         const y = center[1] + radius * Math.sin(angle);
//         points.push([x, y]);
//     }
    
//     return lineString(points);
// }

  
  function createArc({ pointA, pointB, center, numPoints = 99, clockwise = true }) {
    const toPoint = (p) => Array.isArray(p) ? { x: p[0], y: p[1] } : p;

    pointA = toPoint(pointA);
    pointB = toPoint(pointB);
    center = toPoint(center);
  
    const angleBetween = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  
    const radius = distance(center, pointA);
    const angleA = angleBetween(center, pointA);
    const angleB = angleBetween(center, pointB);
  
    // Normalize to [0, 2π)
    const normalize = angle => (angle + 2 * Math.PI) % (2 * Math.PI);
    const a1 = normalize(angleA);
    const a2 = normalize(angleB);
  
    // Shortest arc direction and angle span
    let delta = a2 - a1;
    if (delta > Math.PI) delta -= 2 * Math.PI;
    if (delta < -Math.PI) delta += 2 * Math.PI;
  
    const arcPoints = [];
    for (let i = 0; i <= numPoints; i++) {
      const angle = a1 + (delta * i) / numPoints;
    arcPoints.push([
        center.x + radius * Math.cos(angle),
        center.y + radius * Math.sin(angle),
        ]);
    }
  
    return lineString(arcPoints);
  }
export const plot = async () => {
    // let image = await Image.load('./assets/0-finestra/shadowmap.jpg')
    // let img = await loadImage('Images/Draven.png')
    let muntanya = muntanyaFactory()
    return muntanya
    let feature = pine()
    // let matrix = [21,14]
    // let allfeatures = []
    // for (let i=0;i<matrix[0];i++){
    //     for (let j=0;j<matrix[1];j++){
    //         let featureTranslated = translate(feature, i, j)
    //         allfeatures.push(featureTranslated)
    //     } 
    // }
    let feature2 = lineString([
        [1, 1],
        [1, 2],
        [2, 2],
        [2, 1],
        [1, 1]
    ])
    // let feature3 = createKoch()
    feature.properties = {
        lineWidth: 0.1,
        strokeStyle: "blue",
    }
    // let feature2 = turf.bezierSpline(feature,)
    let allCollections = []
    let collections = featureCollection([
        ...allfeatures
        // bballNet({})
        // feature2,
        // feature3
    ])
    // for(let i = 0;i<20;i++){
    //     allCollections.push(translate(collections, i/40,i/40))
    // }
    // return featureCollection([feature])
}
export const schema = {}
export const config = {
    dimensions: "a5",
    pixelsPerInch: 200,
    units: "cm",
    orientation: "portrait"
}
export default {
    config,
    plot
}

type ArcParams = {
    center: Position;
    radius: number;
    startAngleDegrees: number;
    endAngleDegrees: number;
    clockwise: boolean;
}

const calculateNextArc = (
    prevArc: ArcParams,
    options: {
        minRadius: number;
        maxRadius: number;
        minAngle: number;
        maxAngle: number;
    }
): ArcParams => {
    const { minRadius, maxRadius, minAngle, maxAngle } = options;
    
    // Generate random values for new arc
    const newRadius = minRadius + Math.random() * (maxRadius - minRadius);
    const angleChange = minAngle + Math.random() * (maxAngle - minAngle);
    
    // Calculate direction vector from center to end point
    const endPoint = [
        prevArc.center[0] + prevArc.radius * Math.cos(-prevArc.endAngleDegrees * Math.PI/180),
        prevArc.center[1] + prevArc.radius * Math.sin(-prevArc.endAngleDegrees * Math.PI/180)
    ];
    
    const dir = [
        endPoint[0] - prevArc.center[0],
        endPoint[1] - prevArc.center[1]
    ];
    
    // Normalize and scale direction vector
    const length = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1]);
    const normalizedDir = [
        (dir[0] / length) * newRadius,
        (dir[1] / length) * newRadius
    ];
    
    // Calculate possible left and right center points
    let left: Position, right: Position;
    let newCenter: Position;
    let newStartAngle: number;
    
    if (prevArc.clockwise) {
        // CLOCKWISE
        left = [
            endPoint[0] + normalizedDir[0],
            endPoint[1] + normalizedDir[1]
        ];
        right = [
            endPoint[0] - normalizedDir[0],
            endPoint[1] - normalizedDir[1]
        ];
        
        if (Math.random() > 0.5) {
            // Rotate left (counter clockwise)
            newCenter = left;
            newStartAngle = prevArc.endAngleDegrees + 180;
            return {
                center: newCenter,
                radius: newRadius,
                startAngleDegrees: newStartAngle,
                endAngleDegrees: newStartAngle - angleChange,
                clockwise: false
            };
        } else {
            // Rotate right (clockwise)
            newCenter = right;
            newStartAngle = prevArc.endAngleDegrees;
            return {
                center: newCenter,
                radius: newRadius,
                startAngleDegrees: newStartAngle,
                endAngleDegrees: newStartAngle + angleChange,
                clockwise: true
            };
        }
    } else {
        // COUNTER CLOCKWISE
        left = [
            endPoint[0] - normalizedDir[0],
            endPoint[1] - normalizedDir[1]
        ];
        right = [
            endPoint[0] + normalizedDir[0],
            endPoint[1] + normalizedDir[1]
        ];
        
        if (Math.random() > 0.5) {
            // Rotate left (counter clockwise)
            newCenter = left;
            newStartAngle = prevArc.endAngleDegrees;
            return {
                center: newCenter,
                radius: newRadius,
                startAngleDegrees: newStartAngle,
                endAngleDegrees: newStartAngle - angleChange,
                clockwise: false
            };
        } else {
            // Rotate right (clockwise)
            newCenter = right;
            newStartAngle = prevArc.endAngleDegrees + 180;
            return {
                center: newCenter,
                radius: newRadius,
                startAngleDegrees: newStartAngle,
                endAngleDegrees: newStartAngle + angleChange,
                clockwise: true
            };
        }
    }
}

