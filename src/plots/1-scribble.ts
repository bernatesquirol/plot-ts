import { featureCollection, lineString } from "@turf/helpers";
import * as turf from "@turf/turf";
import { newArray, type LineString, type Plottable, type Vector } from "../utils/plotUtils";
import _, { random } from 'lodash'
import * as tu from '../utils/turfUtils'
import * as pu from '../utils/plotUtils'
// import * as prob from 'probability-distributions';
import svgSrc from '../assets/1-scribble/patro.svg'
import seedrandom from 'seedrandom';
import { parse } from 'svg-parser';
import { createInterpolator } from 'svg-path-interpolator';
import { SVGToTurfParser } from "./svgToTurf";
import svgtogeojson from '../utils/svgToGeojson'
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
  let flatten =  svgFlatten(svgString).pathify().value()
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
const createCircleScribble = (center:Vector, radius:number, startingPoint?: Vector) => {
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
    further.properties = { strokeStyle: "blue" }
    further = lineString([startingPoint, ...further.geometry.coordinates, startingPoint], further.properties)
    finalCircleLine = further
  } else {
    finalCircleLine = circle.geometry.coordinates[0]
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
const rectangle = ([minX, minY, maxX, maxY]:[number,number,number,number],)=>{
  let [cellHeight,cellWidth] = [maxY-minY, maxX-minX]
  return turf.rectangleGrid([minX, minY, maxX, maxY],cellWidth, cellHeight,{units:"degrees"})
}
// getPointAtLength & apply functions
const loadSvg = (url:string)=>{
  // return fetch(url).then(r=>r.arrayBuffer()).then(b=> interpolator.processSVG(new Uint8Array(b)))
  return fetch(url).then(a=>a.text())
}
export const plot = async () => {
  let svgString = await loadSvg(svgSrc)
  
// Usage example:
const parser = new SVGToTurfParser();

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
svgtogeojson.svgToGeoJson(
  [[0,0], [5,5]],
  svgString,
  3
)
// Parse SVG and get Turf LineString features
  const features = svgtogeojson.svgToGeoJson(svgString);
  console.log('Parsed features:', JSON.stringify(features, null, 2));

  let r = rectangle([0,0,5,5])
  let startPoint = tu.getRandomPointFromShape(r, turf.circle([3,3], 1, { units: 'degrees' }))
  if (!startPoint) return
  let split = createCircleScribble([3,3], 1, tu.pointToVec(startPoint)).circleLine
  let connection = bezierCurveFromAngles([1,1],[4,4], 0,- Math.PI/2, {curviness:0.45})
  // 0 -> 0
  // entenem que el range es 0 a 1 per cada parametric Func
  // let lineSpline = turf.lineString((new Array(i)).fill(0).map((_,j)=>[[1,j+1], [2,j+1], [0.5,j]]).flat())
  // turf.bezierSpline(lineSpline),
  // return lineSplinesplit
  return featureCollection([ r, connection, split ].filter(d=>d))
} 

export const schema = {}
