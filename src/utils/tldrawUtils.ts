import { Arc2d, createShapeId, CubicSpline2d, Polyline2d, type TLDrawShape, Vec, type Editor, type TLGeoShape, type TLLineShape } from "tldraw";
import * as utils from '../utils/utils'
export const renderInstructions = (editor: Editor, plotObject:any, settings:any)=>{
    const instructions = utils.plot2instruct(plotObject)
    instructions.forEach(({properties, values})=>{
      // [{"type":"straight","points":[{"x":0,"y":0,"z":0.5}]},{"type":"straight","points":[{"x":0,"y":0,"z":0.5},{"x":69.6,"y":69.6,"z":1}]},{"type":"straight","points":[{"x":69.6,"y":69.6,"z":0.5},{"x":34.71,"y":98.89,"z":0.5}]},{"type":"straight","points":[{"x":34.71,"y":98.89,"z":0.5},{"x":86.16,"y":101.89,"z":0.5}]},{"type":"straight","points":[{"x":86.16,"y":101.89,"z":0.5},{"x":-22.48,"y":129.11,"z":0.5}]},{"type":"straight","points":[{"x":-22.48,"y":129.11,"z":0.5},{"x":23.22,"y":41.7,"z":0.5}]},{"type":"straight","points":[{"x":23.22,"y":41.7,"z":0.5},{"x":-21.48,"y":85.41,"z":0.5}]},{"type":"straight","points":[{"x":-21.48,"y":85.41,"z":0.5},{"x":-20.23,"y":103.64,"z":0.5}]},{"type":"straight","points":[{"x":-20.23,"y":103.64,"z":0.5},{"x":-34.71,"y":123.37,"z":0.5}]},{"type":"straight","points":[{"x":-34.71,"y":123.37,"z":0.5},{"x":-61.18,"y":120.12,"z":0.5}]}]
          
        // let segments = values.map(({value})=>({type:"straight",points:[{x:value[0]*100, y:value[1]*100}]}))
        let points = values.map(({value})=>({x:value[0]*100, y:value[1]*100}))
        editor.createShape<TLLineShape>({
          type:"line",
          props:{
            dash: 'solid',
            points:Object.fromEntries(points.map((p,i)=>[`a${i}`,{...p,id: `a${i}`,index: `a${i}`}])),
            spline:"line",
            color: properties.strokeStyle||'black'
          }
        })
        // console.log(points)
        // let polyline = new Polyline2d({points})
        const artboardId = createShapeId('artboard')
        // editor.createShape<TLDrawShape>({
        //   type:"draw",
        //   x:250,
        //   y:100,
        //   props:{
        //     dash: 'solid',
        //     color: 'blue',
        //     size: 'm',
        //     segments: [{"type":"straight","points":[{"x":0,"y":0,"z":0.5}]},{"type":"straight","points":[{"x":0,"y":0,"z":0.5},{"x":69.6,"y":69.6,"z":1}]},{"type":"straight","points":[{"x":69.6,"y":69.6,"z":0.5},{"x":34.71,"y":98.89,"z":0.5}]},{"type":"straight","points":[{"x":34.71,"y":98.89,"z":0.5},{"x":86.16,"y":101.89,"z":0.5}]},{"type":"straight","points":[{"x":86.16,"y":101.89,"z":0.5},{"x":-22.48,"y":129.11,"z":0.5}]},{"type":"straight","points":[{"x":-22.48,"y":129.11,"z":0.5},{"x":23.22,"y":41.7,"z":0.5}]},{"type":"straight","points":[{"x":23.22,"y":41.7,"z":0.5},{"x":-21.48,"y":85.41,"z":0.5}]},{"type":"straight","points":[{"x":-21.48,"y":85.41,"z":0.5},{"x":-20.23,"y":103.64,"z":0.5}]},{"type":"straight","points":[{"x":-20.23,"y":103.64,"z":0.5},{"x":-34.71,"y":123.37,"z":0.5}]},{"type":"straight","points":[{"x":-34.71,"y":123.37,"z":0.5},{"x":-61.18,"y":120.12,"z":0.5}]}]
        //   }
        // })
        editor.createShapes<TLGeoShape>([
          {
            id: artboardId,
            type: 'geo',
            x: 0,
            y: 0,
            props: {
              geo: 'rectangle',
              w: 120,
              h: 100,
              dash: 'dotted',
              color: 'blue',
              size: 'm',
            },
          },
        ])
        
        // editor.createShape({
        //     type: 'draw',
        //     x: 70,
        //     y: 70,
        //     props: {
        //       segments,
        //       dash: 'draw',
        //       color: 'black',
        //       size: 'm',
        //       isComplete: true,
        //     },
        //   });
        // let c = new CubicSpline2d({points})
        
    })
}