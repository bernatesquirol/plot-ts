import { featureCollection, lineString } from "@turf/helpers";
import * as turf from "@turf/turf";
import type { LineString } from "../utils/utils";
import z from "zod";
import _ from 'lodash'
// const createUtil = (zodSchema)=>(params:z.infer<typeof zodSchema>)=>{

// }
const lineMergeSchema = z.object({
    lines: z.ZodType<LineString>()
})
const lineMerge = (params: z.infer<typeof lineMergeSchema>)=>{
    let {lines} = lineMergeSchema.parse(params)
    let properties = lines.reduce((acc,item)=>{
        return {...acc, ...(item.properties||{})}
    },{})
    let geometry = lineString(features.flatMap(g=>g.geometry.coordinates), properties)
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
    lenStraight:z.number().optional().default(4),
    height:z.number().optional().default(0.5)
})

// const bezierSpline = (line, {resolution, sharpness})=>{
// }
const bballNet = (params: z.infer<typeof BballNetParams>)=>{
    params = BballNetParams.parse(params)
    const {radius,m,n,totalSlices,lenStraight,height} = params
    // TODO: no es fiable
    const curve =  turf.bezierSpline(lineString([[1,1],[5,5], [3,5]]), {
        // resolution: 10000
    })
    const line = lineString([
        [-n/3,-n/lenStraight],
        [0,0]
    ])
    // return curve
    let lineMerged = lineMerge(line,curve)
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
export default ()=>{
    let feature = lineString( [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0]
    ])
    feature.properties = {
        lineWidth: 0.1,
		strokeStyle: "blue",
    }
    let feature2 = turf.bezierSpline(feature,)
    let collections = featureCollection([
        feature,
        bballNet({})
    ])
    return collections
}
export const schema = {}