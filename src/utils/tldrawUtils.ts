import { Arc2d, CubicSpline2d, Polyline2d, Vec, type Editor } from "tldraw";

export const renderInstructions = (editor: Editor, instructions)=>{
    instructions.forEach(({properties, values})=>{
        let points = values.map(({value})=>({x:value[0], y:value[1]}))
        let polyline = new Polyline2d({points})
        editor.createShape({
            type: 'draw',
            x: 100,
            y: 100,
            props: {
              segments: [
                {
                  type: 'free',
                  points
                }
              ],
              color: 'black',
              size: 'm',
              isComplete: true,
            },
          });
        // let c = new CubicSpline2d({points})
        
    })
}