import { featureCollection, lineString } from "@turf/helpers";
import * as turf from "@turf/turf";
import { newArray, type LineString, type Plottable, type Vector } from "../utils/plotUtils";
import z from "zod/v4";
import _ from 'lodash'
import LSystem from 'lindenmayer'
import type { Position } from "geojson";
import * as tu from '../utils/turfUtils'
import * as pu from '../utils/plotUtils'
// import * as prob from 'probability-distributions';
import seedrandom from 'seedrandom';
import * as ss from 'simple-statistics'
import {Image} from 'image-js'
const rng = seedrandom('my-seed');
// const oldRandom = Math.random;
// Math.random = rng;
function normalSample(mu = 0, sigma = 1) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mu + z0 * sigma;
}

// const unirand = require('unirand')
const listSummingUpTo = (total:number, n:number, sample=()=>Math.random())=>{
    let distribution = newArray(n).map(()=>sample())
    let sum = distribution.reduce((acc,i)=>acc+i,0)
    distribution = distribution.map(i=>total*i/sum)
    return distribution
}
const cumsum = (arrayToSum:number[])=>{
    let total = 0
    return arrayToSum.map(i=>{
        total += i
        return total
    })

}
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
const persiana = ()=>{

}
const muntanyaFactory = ()=>{
    
    let line = lineString([[1,2],[2,1]])
    let distributionUnequal = cumsum(listSummingUpTo(1, 3))
    console.log(distributionUnequal)
    iterGrid(4,5,(x,y)=>{
        turf.circle()
    })
    return featureCollection([line,mergeLine(translateChunks(line, 1, distributionUnequal).features)])
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
export const plot = async () => {
    let image = await Image.load('./assets/0-finestra/shadowmap.jpg')
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
    units: "cm"
}
export default {
    config,
    plot
}