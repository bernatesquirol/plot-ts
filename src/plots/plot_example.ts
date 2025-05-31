import { featureCollection, lineString } from "@turf/helpers";

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
    let collections = featureCollection([
        feature
    ])
    return collections
}
export const schema = {}