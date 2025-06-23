import { featureCollection, lineString } from "@turf/helpers";
import * as turf from "@turf/turf";
import { newArray, type LineString, type Plottable, type Vector } from "../utils/plotUtils";
import _, { random } from 'lodash'
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

const rng = seedrandom('my-seed2');
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
function bezierCurveFromVectors(A, B, alphaVec, betaVec, options = {}) {
  const steps = options.steps || 50;
  const curviness = options.curviness || 0.25; // Default = 25% of distance

  const [x0, y0] = A;
  const [x3, y3] = B;

  // Distance between A and B
  const dx = x3 - x0;
  const dy = y3 - y0;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const d = dist * curviness;
  alphaVec = tu.unitVector(alphaVec)
  betaVec = tu.unitVector(betaVec)
  // Control points based on angles
  const x1 = x0 + d * alphaVec[0];
  const y1 = y0 + d * alphaVec[1];

  const x2 = x3 - d * betaVec[0];
  const y2 = y3 - d * betaVec[1];

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
  let line = turf.lineString(coords);
  if (!tu.triangleDistance(A, coords[0], coords[coords.length-1])){
    line = turf.rewind(line)
  }
  return line
  // Return as a Turf.js LineString
  
}

const circleAndTangents = ()=>{

}
const createCircleScribble = (center: Vector, radius: number, startingPoint: Vector) => {
  let circle = turf.circle(center, radius, { units: 'degrees' })
  let finalCircleLine;
  if (startingPoint) {
    if (turf.booleanIntersects(circle, turf.point(startingPoint))) {
      console.log(startingPoint, circle)
      return
    }

    let tangentPoints = turf.polygonTangents(startingPoint, circle).features.map(c => tu.pointToVec(c))
    let lineS = lineString(tangentPoints)
    lineS = tu.scale(lineS, 1.1, 1.1)
    let split = turf.lineSplit(lineString(circle.geometry.coordinates[0]), lineS)
    let g1, g2;
    if (split.features.length == 3) {
      // a la coordenada primera de circle coincideixen 2: fer merge d'aquestes dues
      // agafo el primer
      let distancesToTangent = split.features.map(f => Math.min(turf.distance(tangentPoints[0], f.geometry.coordinates[0], { units: "degrees" }), turf.distance(f.geometry.coordinates[0], tangentPoints[1], { units: "degrees" })))
      console.log(distancesToTangent)
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
    further = lineString([startingPoint, ...further.geometry.coordinates, startingPoint], further.properties)
    finalCircleLine = further
  }else{
    return
  }

  // firstLine =lineString(startingPoint,)
  // split.features[2].properties = {strokeStyle:"purple"}
  // console.log(cutPolygon(circle.geometry, lineS.geometry))
  return {
    circleLine: finalCircleLine
  }
  // console.log(split)
  console.log()
}
export const config = {
  dimensions: "a5",
  pixelsPerInch: 200,
  units: "cm",
  orientation: "portrait"
}
const rectangle = ([minX, minY, maxX, maxY]: [number, number, number, number],) => {
  let [cellHeight, cellWidth] = [maxY - minY, maxX - minX]
  return turf.rectangleGrid([minX, minY, maxX, maxY], cellWidth, cellHeight, { units: "degrees" })
}
// getPointAtLength & apply functions
const loadSvg = (url: string) => {
  // return fetch(url).then(r=>r.arrayBuffer()).then(b=> interpolator.processSVG(new Uint8Array(b)))
 
  return fetch(url).then(a => a.text())
}

const arrow = (point:Vector, vector:Vector, length=0.5, atStart=true, color?:string)=>{
  let u = tu.unitVector(vector)
  let mainV = tu.mult(u, length)
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
  tu.paint(v, color)
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
  return tu.unitVector(tu.normalVector(tu.diff(center, point)))
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
  let r = rectangle([0, 0, 5, 5])
  let pointsGrid = gridPoints(r, 4, 3)
  let listPoints = pointsGrid.flat()
  listPoints = _.shuffle(listPoints)
  let size = 0.2
  let walk = walker(
    listPoints,
    (point, i, acc)=>{
      let prevPoint = listPoints[i-1]
      let nextPoint = listPoints[i+1]
      // startAngle a punt prev
      // tu.diff(prevPoint, point)
      
      // tu.angleBetween([1,0], )
      // tu.diff(point, nextPoint, )
      // endAngle a punt next
      
      let sizeScribble = size//Math.random()*size+size/2
      let vectorStartPoint = tu.rotate([sizeScribble*1.1,sizeScribble*1.1], 2*Math.PI*Math.random())
      // let node = createCircleScribble(point, sizeScribble, tu.add(point, vectorStartPoint))!.circleLine
      let node = arc(point, 0.25,  Math.PI*2*Math.random(), Math.PI*Math.random()+Math.PI/4,)
      let fC = tu.firstCoord(node)
      let lC = tu.lastCoord(node)
      if (nextPoint && turf.distance(fC, nextPoint)<turf.distance(lC, nextPoint)){
        node = turf.rewind(node)
      }
      // tu.circle(tu.firstCoord(node)), tu.circle(tu.lastCoord(node))
      
      return {node:featureCollection([node, ]),acc}
    },
    (pointA, pointB, acc)=>{
      let AtoB = tu.vectFromAToB(pointA,pointB)
      let BtoA = tu.mult(AtoB, -1)
      // tu.rotate(difference,)
      let edge = bezierCurveFromVectors(pointA, pointB, AtoB, BtoA, { curviness: 0.45, })
      // return {}
      // let edge = 
      return {edge, acc}
    }
  )
  // turf.combine
  let startPoint = tu.getRandomPointFromShape(r, turf.circle([3, 3], 1, { units: 'degrees' }))
  if (!startPoint) return
  let split = createCircleScribble([3, 3], 1, tu.pointToVec(startPoint)).circleLine
  // let connection = bezierCurveFromAngles([1, 1], [4, 4], 0, - Math.PI / 2, { curviness: 0.45 })
  let connection = bezierCurveFromVectors([1, 1], [4, 4], [1, 1], [1, 1], { curviness: 0.45, })
  let rW = randomWalker({
    origin: [0.1,0.1],
    originDirection: [1,1],
    destination: [4.9,4.9],
    destinationDirection: [1,1],
    polygon:r,
    steps:2,
    targets:15
  })
  // 0 -> 0
  // entenem que el range es 0 a 1 per cada parametric Func
  // let lineSpline = turf.lineString((new Array(i)).fill(0).map((_,j)=>[[1,j+1], [2,j+1], [0.5,j]]).flat())
  // turf.bezierSpline(lineSpline),
  // return lineSplinesplit
  // ...walk
  let lines = tu.mergeLines(walk)
  // let linesB = tu.translate(lines, 0, 1)
  return featureCollection([lines, r].filter(d => d))
}

export const schema = {}
