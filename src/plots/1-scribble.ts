import { featureCollection, lineString } from "@turf/helpers";
import * as turf from "@turf/turf";
import { type LineString, type Plottable, type Vector } from "../utils/plotUtils";
import _, { initial, random } from 'lodash'
import * as ju from '../utils/javascriptUtils'
import * as tu from '../utils/turfUtils'
import * as pu from '../utils/plotUtils'
// import * as prob from 'probability-distributions';
import svgSrc from '../assets/1-scribble/patro.svg'
import seedrandom from 'seedrandom';
import { parse } from 'svg-parser';
import { createInterpolator } from 'svg-path-interpolator';
import { getRandomPointFromShape } from "../utils/turfUtils";
// import { SVGToTurfParser } from "./svgToTurf";
// import svgtogeojson from '../utils/svgToGeojson'
// const interpolator = await createInterpolator({
//   joinPathData: true,
//   minDistance: 0.5,
//   roundToNearest: 0.25,
//   sampleFrequency: 0.001,
// });
/**
 * Apply transform string (e.g., "translate(10,20) scale(2)") to [x, y] coordinates.
 */
function applyTransformToCoords(coords, transformStr) {
  const matrix = fromTransformAttribute(transformStr || '');
  return coords.map(([x, y]) => {
    const pt = applyToPoint(matrix, { x, y });
    return [pt.x, pt.y];
  });
}

/**
 * Converts an SVG <path> `d` string + transform into Turf LineString coordinates.
 */
function pathToTurfLineString(d, transformStr) {
  const flat = flatten(d);
  const rawCoords = flat.map(cmd => [cmd[1], cmd[2]]);
  const coords = applyTransformToCoords(rawCoords, transformStr);

  // Ignore paths with < 2 points
  if (coords.length > 1) {
    return lineString(coords);
  }
  return null;
}

/**
 * Main SVG parser: returns an array of Turf.js LineString features.
 */
export function svgToTurfLineStrings(svgString) {
  const parser = new DOMParser();
  let flatten = svgFlatten(svgString).pathify().value()
  const doc = parser.parseFromString(flatten, 'image/svg+xml');

  const lineStrings = [];

  const paths = doc.querySelectorAll('path');
  paths.forEach(path => {
    const d = path.getAttribute('d');
    const transform = path.getAttribute('transform');
    if (d) {
      const feature = pathToTurfLineString(d, transform);
      if (feature) lineStrings.push(feature);
    }
  });

  return lineStrings;
}

const rng = seedrandom('elena');
// const oldRandom = Math.random;
Math.random = rng;

function bezierCurveFromAngles(A, B, alpha, beta, options = {}) {
  const steps = options.steps || 50;
  const curviness = options.curviness || 0.25; // Default = 25% of distance

  const [x0, y0] = A;
  const [x3, y3] = B;

  // Distance between A and B
  const dx = x3 - x0;
  const dy = y3 - y0;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const d = dist * curviness;

  // Control points based on angles
  const x1 = x0 + d * Math.cos(alpha);
  const y1 = y0 + d * Math.sin(alpha);

  const x2 = x3 - d * Math.cos(beta);
  const y2 = y3 - d * Math.sin(beta);

  // Cubic Bézier point at t
  function bezierPoint(t) {
    const x = Math.pow(1 - t, 3) * x0 +
      3 * Math.pow(1 - t, 2) * t * x1 +
      3 * (1 - t) * Math.pow(t, 2) * x2 +
      Math.pow(t, 3) * x3;

    const y = Math.pow(1 - t, 3) * y0 +
      3 * Math.pow(1 - t, 2) * t * y1 +
      3 * (1 - t) * Math.pow(t, 2) * y2 +
      Math.pow(t, 3) * y3;

    return [x, y];
  }

  // Generate sampled points
  const coords = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    coords.push(bezierPoint(t));
  }

  // Return as a Turf.js LineString
  return turf.lineString(coords);
}

// function bezierCurveFromVectors(A, B, alphaVec, betaVec, options = {}) {
//   const steps = options.steps || 50;
//   const curviness = options.curviness || 0.25; // Default = 25% of distance

//   const [x0, y0] = A;
//   const [x3, y3] = B;

//   // Distance between A and B
//   const dx = x3 - x0;
//   const dy = y3 - y0;
//   const dist = Math.sqrt(dx * dx + dy * dy);
//   const d = 1;//dist * curviness;
//   alphaVec = tu.unitVector(alphaVec)
//   betaVec = tu.unitVector(betaVec)
//   // Control points based on angles
//   const x1 = x0 + d * alphaVec[0];
//   const y1 = y0 + d * alphaVec[1];

//   const x2 = x3 - d * betaVec[0];
//   const y2 = y3 - d * betaVec[1];

//   // Cubic Bézier point at t
//   function bezierPoint(t) {
//     const x = Math.pow(1 - t, 3) * x0 +
//       3 * Math.pow(1 - t, 2) * t * x1 +
//       3 * (1 - t) * Math.pow(t, 2) * x2 +
//       Math.pow(t, 3) * x3;

//     const y = Math.pow(1 - t, 3) * y0 +
//       3 * Math.pow(1 - t, 2) * t * y1 +
//       3 * (1 - t) * Math.pow(t, 2) * y2 +
//       Math.pow(t, 3) * y3;

//     return [x, y];
//   }

//   // Generate sampled points
//   const coords = [];
//   for (let i = 0; i <= steps; i++) {
//     const t = i / steps;
//     coords.push(bezierPoint(t));
//   }
//   let line = turf.lineString(coords);
//   if (!tu.triangleDistance(A, coords[0], coords[coords.length-1])){
//     line = turf.rewind(line)
//   }
//   return line
//   // Return as a Turf.js LineString
  
// }
function bezierCurveFromVectors(A, B, alphaVec, betaVec, options = {}) {
  const { resolution = 100 } = options;

  // Control points
  const P0 = A;
  const P1 = [A[0] - alphaVec[0], A[1] - alphaVec[1]];
  const P2 = [B[0] - betaVec[0], B[1] - betaVec[1]];
  const P3 = B;

  const curve = [];
  for (let t = 0; t <= 1; t += 1 / resolution) {
    const x = Math.pow(1 - t, 3) * P0[0] +
              3 * Math.pow(1 - t, 2) * t * P1[0] +
              3 * (1 - t) * t * t * P2[0] +
              Math.pow(t, 3) * P3[0];

    const y = Math.pow(1 - t, 3) * P0[1] +
              3 * Math.pow(1 - t, 2) * t * P1[1] +
              3 * (1 - t) * t * t * P2[1] +
              Math.pow(t, 3) * P3[1];

    curve.push([x, y]);
  }
  return lineString(curve)
  // return featureCollection([lineString(curve), arrow(A, alphaVec, false, 0.5, "green"), arrow(B, betaVec, false, 0.5, "green")])
}
const circleAndTangents = ()=>{

}
const createCircleScribble = (center: Vector, radius: number, startingPoint: Vector, startingVector:Vector, endingPoint:Vector, endingVector:Vector) => {
  let circle = turf.circle(center, radius, { units: 'degrees' })
  let finalCircleLine;
  let midpoint = tu.pointToVec(turf.centroid(lineString([startingPoint, endingPoint])))
  let tangentPointsStart = turf.polygonTangents(startingPoint, circle).features.map(c => tu.pointToVec(c))
  let tangentPointsEnd = turf.polygonTangents(endingPoint, circle).features.map(c => tu.pointToVec(c))
  let tangentPoints = [tangentPointsStart[0], tangentPointsEnd[1]]
  if (midpoint) {
    if (turf.booleanIntersects(circle, turf.point(midpoint))) {
      console.log(startingPoint, circle)
      return
    }

    // let tangentPoints = turf.polygonTangents(midpoint, circle).features.map(c => tu.pointToVec(c))
    let lineS = lineString(tangentPoints)
    lineS = tu.scale(lineS, 1.1, 1.1)
    let split = turf.lineSplit(lineString(circle.geometry.coordinates[0]), lineS)
    let g1, g2;
    if (split.features.length == 3) {
      // a la coordenada primera de circle coincideixen 2: fer merge d'aquestes dues
      // agafo el primer
      let distancesToTangent = split.features.map(f => Math.min(turf.distance(tangentPoints[0], f.geometry.coordinates[0], { units: "degrees" }), turf.distance(f.geometry.coordinates[0], tangentPoints[1], { units: "degrees" })))
      let maxValue = Math.max(...distancesToTangent)
      let i = distancesToTangent.findIndex(p => p == maxValue)
      let i_1 = (i + 1) % 3
      let i_2 = (i + 2) % 3
      g1 = lineString([...split.features[i_2].geometry.coordinates, ...split.features[i].geometry.coordinates])
      g2 = lineString(split.features[i_1].geometry.coordinates)
    } else if (split.features.length == 2) {
      g1 = lineString(split.features[0].geometry.coordinates)
      g2 = lineString(split.features[1].geometry.coordinates)
    } else {
      console.log()
      // if (split.features.length>0){
      debugger
      return featureCollection([circle,])
      // }
      return
    }
    let further = g2;
    if (turf.distance(turf.centroid(g1), startingPoint) > turf.distance(turf.centroid(g2), startingPoint)) {
      further = g1
    }
    // further.properties = { strokeStyle: "blue" }
    // further = lineString([startingPoint, ...further.geometry.coordinates], further.properties)
    finalCircleLine = further
  }else{
    return
  }
  let startCircle = tu.firstCoord(finalCircleLine)
  let startVectorN = getTangentVector(center,startCircle )
  
  let finalCircle =  tu.lastCoord(finalCircleLine)
  let lastVectorN = getTangentVector(center, tu.lastCoord(finalCircleLine))
  
  let firstLeg =  lineString([startingPoint, startCircle])
  let secondLeg =  lineString([finalCircle,endingPoint, ])
  // let firstLeg =  bezierCurveFromVectors(startingPoint, startCircle, startingVector, startVectorN )
  // let arrowTangent = arrow(startingPoint, startingVector)
  // let arrowTangent2 = arrow(startCircle,startVectorN )
  // let secondLeg =  bezierCurveFromVectors(endingPoint, finalCircle, endingVector, lastVectorN )
  // firstLine =lineString(startingPoint,)
  // split.features[2].properties = {strokeStyle:"purple"}
  // console.log(cutPolygon(circle.geometry, lineS.geometry))
  
  return featureCollection([firstLeg,finalCircleLine,secondLeg])
  // console.log(split)
  console.log()
}
export const config = {
  dimensions: "a5",
  pixelsPerInch: 200,
  units: "cm",
  orientation: "portrait"
}

// getPointAtLength & apply functions
const loadSvg = (url: string) => {
  // return fetch(url).then(r=>r.arrayBuffer()).then(b=> interpolator.processSVG(new Uint8Array(b)))
 
  return fetch(url).then(a => a.text())
}

const arrow = (point:Vector, vector:Vector, atStart=true,length?:number, color?:string)=>{
  let mainV = vector;
  if (length){
    let u = tu.unitVector(vector)
    mainV = tu.mult(u, length!)
  }
  let startingPoint = point
  if (!atStart){
    startingPoint = tu.add(point,tu.mult(mainV,-1))
  }
  let main = lineString([startingPoint, tu.add(startingPoint,mainV)])
  let right = tu.rotate(main, Math.PI/4, {
    pivot: tu.lastCoord(main)
  })//,0.25,0.25)
  let left = tu.rotate(main, -Math.PI/4, {
    pivot: tu.lastCoord(main)
  })//,0.25,0.25)
  let v = featureCollection([main, right, left])
  tu.paint(v, color||'red')
  return v
}
const featureCollectionToPoints = (feature:pu.FeatureCollection, loop:boolean=true)=>{
  let coords = feature.features.map(f=>tu.firstCoord(f))
  if (!loop) coords.push(tu.lastCoord(feature.features[feature.features.length-1]))
  return coords
}
const getMod = (vector:Vector)=>{
  return (vector[0]**2+vector[1]**2)**0.5
}
const triangle = (point:Vector, vector:Vector, anglePointer:number, height?:number, color?:string, clockwise:boolean=true)=>{
  let mainV = vector;
  if (!height) height = getMod(vector)
  // if (height){
    // tu.
  let u = tu.unitVector(vector)
  let lengthSide = height/Math.cos(anglePointer/2)
  mainV = tu.mult(u, lengthSide)
  // }
  let startingPoint = point
  // if (!atStart){
  //   startingPoint = tu.add(point,tu.mult(mainV,-1))
  // }
  let main = lineString([startingPoint, tu.add(startingPoint,mainV)])
  let right = tu.rotate(main, anglePointer/2, {
    pivot: point
  })//,0.25,0.25)
  let left = tu.rotate(main, -anglePointer/2, {
    pivot: point
  })//,0.25,0.25)
  left = tu.rewindLine(left)
  let base = lineString([tu.lastCoord(right), tu.firstCoord(left)])
  let v = featureCollection([ right, base, left])
  tu.paint(v, color||'red')
  return v
}
const gridPoints = (polygon, cols, rows, reverseRows=false, reverseCols=false)=>{
  let [minX, minY, maxX, maxY] = turf.bbox(polygon)
  let widthCell = (maxX-minX)/(cols+1)
  let heightCell = (maxY-minY)/(rows+1)
  let grid = []
  for (let row=1;row<rows+1;row++){
    let rowArray = []
    for (let col=1;col<cols+1;col++){
      let point = [minX+widthCell*col,minY+heightCell*row ] as [number,number]
      if (turf.booleanIntersects(polygon, turf.point(point))){
        rowArray.push(point)
      }
    }
    if (reverseCols){
      rowArray.reverse()
    }
    grid.push(rowArray)
  }
  if (reverseRows){
    grid.reverse()
  }
  return grid
}
const walker = (points:[number,number][], geometryFactoryNode:(point:[number,number], i:number, acc?:any)=>{node:Plottable, acc?: any}, geometryFactoryEdge:(pointA:[number,number],pointB:[number,number], i:number, acc?:any)=>{edge:Plottable, acc?: any})=>{
  let prevPoint:[number,number];
  let allGeos: Plottable[] = []
  let acc: any;
  points.forEach((point, i)=>{
    let node;
    ({node, acc} = geometryFactoryNode(point, i, acc));
    if (node){
      let firstPointGeo = tu.firstCoord(node as any)
      let lastPointGeo = tu.lastCoord(node as any)
      if (prevPoint){
        let edge;
        // console.log(prevPoint, firstPointGeo);
        ({edge, acc} = geometryFactoryEdge(prevPoint, firstPointGeo, i, acc));
        if (edge){
          allGeos.push(edge)
        }
      }
      allGeos.push(node)
      prevPoint = lastPointGeo
    }
  })
  return allGeos
}
// TODO create polygons from shapes (una te un hole)
// TODO definir punts inici / final 
// TODO textures a cada polygon
const randomWalker = ({
  origin,
  originDirection,
  destination,
  destinationDirection,
  polygon,
  steps = 2,
  targets = 4
}) => {
  let startingPoint = origin;
  let debugFeatures: Plottable[] = []
  let lines: Plottable[] = []
  // let skipPoints = null
  // let circleBuffer = Math.sqrt(turf.area(polygon)/steps)*0.01
  let skipArc = null
  // debugFeatures.push(turf.circle(origin, 0.1, {units:"degrees"}),)
  // debugFeatures.push(turf.circle(destination, 0.1, {units:"degrees"}),)
  debugFeatures.push(tu.circle(origin, 0.1, "blue"))
  debugFeatures.push(tu.circle(destination, 0.1, "red"))
  debugFeatures.push(arrow(origin, originDirection, 0.5, true, "blue"))
  debugFeatures.push(arrow(destination, destinationDirection, 0.5, false, "red"))
  // return featureCollection(debugFeatures)
  let currentDirection = origin
  // TODO create a snake of n points, such that, tots els puntspolygon restringit a la normal cap endavant i lluny del current point
  for (let targetIndex = 0; targetIndex < targets; targetIndex++) {
    let targetPoint;
    let nextDirection
    
    if (targetIndex < targets - 1) {
      
      targetPoint = tu.pointToVec(getRandomPointFromShape(polygon)!)
      let directionVector = tu.unitVector(tu.diff(startingPoint,targetPoint))
      nextDirection = tu.rotate(directionVector, (Math.PI/4)*Math.random())
    } else {
      targetPoint = destination
      nextDirection = destinationDirection
    }
    
    
    
    let geometry = bezierCurveFromVectors(startingPoint, targetPoint, currentDirection, nextDirection, { curviness: 0.85 })
    
    debugFeatures.push(geometry)
    debugFeatures.push(arrow(targetPoint, nextDirection, 0.3, false, "black"))
    currentDirection = nextDirection
    startingPoint = targetPoint
  }
  return featureCollection(debugFeatures)
  for (let targetIndex = 0; targetIndex < targets; targetIndex++) {
    let targetPoint;
    if (targetIndex < targets - 1) {
      targetPoint = tu.pointToVec(getRandomPointFromShape(polygon)!)
    } else {
      targetPoint = destination
    }
    for (let i = 0; i < steps; i++) {
      let line = lineString([startingPoint, targetPoint])
      let buffer = turf.buffer(line, 1)
      // debugFeatures.push(buffer)
      let bufferNPolygon = turf.intersect(featureCollection([buffer, polygon]))
      let choosenArc = null

      while (choosenArc == null) {
        let endPoint;
        endPoint = tu.pointToVec(tu.getRandomPointFromShape(bufferNPolygon)!)
        if (i == steps - 1) {
          endPoint = targetPoint
        }
        let line = lineString([startingPoint, endPoint])
        let middlePoint = turf.centroid(line)
        let tryArc = createCircleScribble(endPoint, Math.random()*turf.length(line)/2, tu.pointToVec(startPoint)).circleLine
        // if (skipArc && turf.booleanIntersects(tryArc, skipArc)){
        //     console.log("skipping arc")
        //     continue
        // }
        
        if (!turf.booleanIntersects(turf.polygonToLine(polygon), tryArc)) {
          if (i < steps - 1) debugFeatures.push(turf.circle(endPoint, 0.1, { units: "degrees" }))
          choosenArc = tryArc
          lines.push(choosenArc)
          startingPoint = endPoint
          skipArc = choosenArc
        }

      }

    }

  }
}
const iterTwo = (list)=>{
  list.slice(1).map((item,i)=>[list[i-1], item])
}
export const getTangentVector = (center, point)=>{
  // return tu.diff(point, center)
  return tu.unitVector(tu.normalVector(tu.diff(point, center)))
}

export const arc = (point, radius, startAngle=0, totalAngle=Math.PI/2,  color?:string)=>{
  let circle = tu.getBoundaryPolygon(tu.circle(point, radius, color))
  if (totalAngle>Math.PI*2) return circle
  circle = tu.rotate(circle, startAngle)
  let startPoint = tu.pointToVec(circle.geometry.coordinates[0])
  let distanceAngle = totalAngle*radius
  let pointEnd = tu.pointToVec(turf.along(circle, distanceAngle,  {units:'degrees'}))
  let split = turf.lineSplit(circle, tu.scale(lineString([startPoint, pointEnd]),1.1,1.1))
  console.log(startPoint, pointEnd, split.features.length, split.features.map(t=>turf.length(t)))
  let featuresRemaining = split.features
  if (featuresRemaining.length===3){
   featuresRemaining = ju.filterAgg(split.features, (item)=>turf.length(item), Math.min, ) 
  }
  let [gLonger, gShorter] = featuresRemaining
  if (turf.length(gLonger)<turf.length(gShorter)){
    ([gLonger, gShorter] = [gShorter,gLonger])
  }
  if (totalAngle>=Math.PI){
    return gLonger
  }
  return gShorter
}
const pixelateLine = (line: LineString, cutsPerCm:number, amplitude:number, randomGenerator?: (i?:number)=>number)=>{
    // let lineNormalVectorResult = lineNormalVector(line);
    let lineNormalVectorResult = [1,0]
    let cuts = Math.floor(turf.length(line,{units:'degrees'})*cutsPerCm)
    let unequalCuts = ju.cumsum(ju.listSummingUpTo(1, cuts))
    // let angle = tu.angleBetween( lineNormalVectorResult, tu.lineToVector(line),)
    if (!randomGenerator) randomGenerator = ()=>Math.random()
      let currentPoint =tu.firstCoord(line)
    let totalChunks = tu.mergeLines(tu.iterateChunks(line, unequalCuts, (subline, i, list)=>{
        // let amplitudeChunk = (randomGenerator(i)*amplitude)-amplitude/2
        let k = i%2
        let geometry;
        if (k==0){
          geometry = lineString([currentPoint,[ tu.lastCoord(subline)[0], currentPoint[1]]])
        }else{
          geometry = lineString([currentPoint,[currentPoint[0], tu.lastCoord(subline)[1]]])
        }
        if (i===list.length-1){
          let point = tu.lastCoord(geometry)
          
          let geo2 = lineString([point, tu.lastCoord(subline)])
          if (turf.length(geo2, {units:'degrees'})){
            return [geometry, geo2]
          }
        }
        currentPoint = tu.lastCoord(geometry)
        return geometry
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
    }).flat())
    return totalChunks
}
export const plot = async () => {
  let svgString = await loadSvg(svgSrc)

  // Usage example:
  // const parser = new SVGToTurfParser();

  // Example SVG string
  // const svgString = `
  //   <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  //     <g transform="translate(50,50) scale(2)">
  //       <path d="M10  ,10 L50,50 L10,90" stroke="blue" stroke-width="2"/>
  //       <line x1="0" y1="0" x2="30" y2="30" stroke="red"/>
  //       <polyline points="60,10 65,20 70,15 75,25" stroke="green" fill="none"/>
  //     </g>
  //     <circle cx="100" cy="100" r="20" stroke="purple" fill="none"/>
  //   </svg>`;
  // svgtogeojson.svgToGeoJson(
  //   [[0,0], [5,5]],
  //   svgString,
  //   3
  // )
  // Parse SVG and get Turf LineString features
  // const features = svgtogeojson.svgToGeoJson(svgString);
  // console.log('Parsed features:', JSON.stringify(features, null, 2));
  let arcG = arc([2,2],1, Math.PI*0.1, Math.PI*1.9)
  
  // 0 -> 0
  // entenem que el range es 0 a 1 per cada parametric Func
  // let lineSpline = turf.lineString((new Array(i)).fill(0).map((_,j)=>[[1,j+1], [2,j+1], [0.5,j]]).flat())
  // turf.bezierSpline(lineSpline),
  // return lineSplinesplit
  // ...walk
  let topDrawing = pu.translateRelative(lineString([[0,0],[1,0]]), config)
  let bottomDrawing = pu.translateRelative(lineString([[0,1],[1,1]]), config)
  let persianaLower = lineString([[0,0.1],[1,0.1]])
  persianaLower = pu.translateRelative(persianaLower, config)
  let skyLine = lineString([[0,0.3],[0.4,0.25],[1,0.21]])
  let housesEllipseBoundary = tu.getBoundaryPolygon(turf.ellipse([0.5,0.38],0.35, 0.05, {units:"degrees", steps:200}))
  let roadFirst = lineString([[0,0.45],[0.35,0.5],[1,0.53]])
  let roadV = lineString([[0,0.5],[0.3,0.55],[0,0.6]])
  let roadLast =  lineString([[0,0.67],[0.35,0.6],[1,0.63]])
  let wallLine =  lineString([[0,0.8],[0.5,0.75],[1,0.75]])
  // let line = 

  ;([skyLine, housesEllipseBoundary, roadFirst, roadV, roadLast, wallLine] = [skyLine, housesEllipseBoundary, roadFirst, roadV, roadLast, wallLine].map(g=> {
    return pixelateLine(pu.translateRelative(g, config), 3, 2)
  }))
  let polygonBoundary = (...lines)=>{
    return tu.mergeLines(featureCollection(lines), true).geometry.coordinates
  }
  let persiana = turf.polygon([polygonBoundary(
    topDrawing, 
    // turf.rewind(persianaLower)
    tu.rewindLine(persianaLower)
  )])
  let sky =  turf.polygon([polygonBoundary(
    persianaLower, 
    tu.rewindLine(skyLine)
    // skyLine
  )])
  let forrest = turf.polygon([polygonBoundary(
    skyLine, tu.rewindLine(roadFirst)
  ),
    housesEllipseBoundary.geometry.coordinates
  ])
  let housesEllipse = turf.polygon([housesEllipseBoundary.geometry.coordinates])
  let road = turf.polygon([polygonBoundary(
    roadFirst,
    // tu.rewindLine(roadFirst),
    tu.rewindLine(roadLast),
    tu.rewindLine(roadV),
  )])
  road.properties.fillStyle = 'red'
  let forrest2 = turf.polygon([tu.loopLine(roadV).geometry.coordinates])
  let fields =  turf.polygon([polygonBoundary(
    roadLast, 
    tu.rewindLine(wallLine)
  )])
  let wall =  turf.polygon([polygonBoundary(
    wallLine, 
    tu.rewindLine(bottomDrawing)
  )])
  // wall.properties.fillStyle="blue"
  // console.log(line.geometry.coordinates)
  let allGeoms = [persiana, sky, forrest,housesEllipse, road,forrest2,fields,wall]
  // let ls = lineString([])
  let geoms_with_data = [ 
    {geo: sky, num_points: 1, rows: 1, cols:3},
    {geo: forrest, num_points: 2, rows: 2, cols:3},
    {geo:housesEllipse, num_points: 3, rows: 2, cols:3},
    {geo: road,num_points: 2, rows: 2, cols:3},
    {geo:forrest2,num_points: 0, rows: 2, cols:3},
    {geo:fields, num_points: 3, rows: 2, cols:4},
    {geo:wall, num_points: 4, rows: 2, cols:3}
  ]
  let points = []
  geoms_with_data.forEach(obj=>{
    let rectangleGrid = tu.gridifyPolygon(obj.geo, obj.cols,obj.rows)
    let listFeatures = [...rectangleGrid.features]
    for (let i=0;i<obj.num_points;i++){
      let index = ju.getRandomBetween(0,listFeatures.length)
      let rect = listFeatures.splice(index,1)[0]
      if (rect){
        let center = tu.pointToVec(turf.centroid(rect))
        points.push({center, geo:rect})
      }
    }
    // allGeoms.push(rectangleGrid)
  })
  let r = pu.translateRelative(tu.rectangle([0, 0, 1, 1]), config)
  let [w,h, minX, minY] = tu.size(r)
  
  // let listPoints = ju.newArray(6).map((_a,i, l)=>{
  //   let center = [minX+(i%2?3*w/4:w/4), minY+(i+1)*h/(l.length+1)]
  //   return center
  // })
  let triangles = points.map(({center}, i, list)=>{
    // let vector = i%2?[-1,0]:[1,0]
    // let vector = i%2?[-1,0]:[1,0]
    let v;
    if (i==list.length-1){
      v = [Math.random(), Math.random()]
    } else if (i==0){
      v = tu.diff(center, list[i+1].center)
    } else {
      let v1 = tu.diff(center, list[i+1].center)
      let v2 = tu.diff(center, list[i+1].center)
      v = tu.mean(v1,v2)
    }
    // return arrow(center, vector, true, 2.5)
    // PARAM ANGLE
    let angle = (Math.PI/2)*Math.random()
    // PARAM height triangle
    let h = 2
    return {
      geo:triangle(center, tu.mult(v,-1), angle, h),
      h
    }
    
  })
  let ps =  [] // triangles.map(p=>tu.paint(p.geo, "blue"))
  let geos:any = [...ps, ]
  let vectorExitingPoints = []
  
  let loops = triangles.map(({geo:triangle, h}, i)=>{
    let middlePoint = featureCollectionToPoints(triangle)[0]
    let initialPoint = featureCollectionToPoints(triangle)[2]
    let finalPoint = featureCollectionToPoints(triangle)[1]
    let startingVector = [Math.random(), Math.random()]
    let endingVector = [Math.random(), Math.random()]
    // PARAM circle gros o no
    let circle = createCircleScribble(middlePoint, h/2, initialPoint, startingVector, finalPoint, endingVector )
    // if (circle) nodes.push(returnVal.line)
    return {line:tu.mergeLines(circle), featureCollection:circle}
  })
  let nodes = loops.map(({line})=>line)
  let edges = []
  
  loops.forEach((g,i, list)=>{
    if (i>0){
      let [prev,_circl,_next] = g.featureCollection.features
      let [_prev2,_circl2,next2] = list[i-1].featureCollection.features
      let prevV = tu.unitVector(tu.lineToVector(prev))
      let nextV = tu.mult(tu.unitVector(tu.lineToVector(next2)),1)
      let [A,B] = [tu.firstCoord(g.line),tu.lastCoord(list[i-1].line)]
      // arrow(A, alphaVec, false, 0.5, "green"), arrow(B, betaVec, false, 0.5, "green")
      // let final = tu.add(tu.firstCoord(next),nextV)
      // tu.circle(final), tu.circle(tu.firstCoord(next)), arrow(B, nextV, true, null, "yellow"),
      edges.push(bezierCurveFromVectors(A, B, prevV, tu.mult(nextV,-1)))
      // edges.push(featureCollection([tu.paint(prev, "grey"),tu.paint(next2, "grey"),]))
      // edges.push(lineString([]))
    }
  })
  
  let bloops = createCircleScribble([1,1], 1, [3,2], [1,1], [2,3], [-1,-1])
  return featureCollection([...geos,...allGeoms, ...nodes,...edges].filter(d => d))
}
export const schema = {}
