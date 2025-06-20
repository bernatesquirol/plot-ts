import 'tldraw/tldraw.css'
import {plot, config} from './plots/1-scribble'
// import { CodeShapeUtil } from './CodeShape'
// import * as tldrawUtils from './utils/tldrawUtils'
// import { Tldraw } from 'tldraw'
import * as utils from './utils/plotUtils'
import canvasSketch from 'canvas-sketch';
import * as sketchUtils from './utils/sketchUtils'
import * as tldrawUtils from './utils/tldrawUtils'
import { createRef, useEffect } from 'react'
import { Tldraw } from 'tldraw';
import { HelperButton } from './components/HelperButton';
import p5 from 'p5'
// globalThis.bind(new p5(s))
const s = ( sketch ) => {
  
	sketch.setup = () => {
	//   sketch.createCanvas(200, 200);
	};
  
	sketch.draw = () => {
	//   sketch.background(0);
	//   sketch.fill(255);
	//   sketch.rect(x,y,50,50);
	};
  };

const SketchRenderer = ()=>{
	const ref = createRef<any>();
	useEffect(() => {
		plot().then(plotObject=>{
			// const instructions = utils.plot2instruct(plotObject)
			// const sketch = sketchUtils.sketchBuilder(instructions)
			
			// window.preload = ()=>{}			
			// canvasSketch(sketch, {
			canvasSketch(() => {
				// Inside this is a bit like p5.js 'setup' function
				// ...
			  
				// Attach events to window to receive them
				window.mouseClicked = () => {
				  console.log('Mouse clicked');
				};
			  
				// Return a renderer to 'draw' the p5.js content
				return ({ playhead, width, height }) => {
				  // Draw with p5.js things
				  P5.clear()
				  P5.normalMaterial();
				  P5.rotateX(playhead * 2 * PI);
				  P5.rotateZ(playhead * 2 * PI);
				  P5.cylinder(20, 50);
				}
			},{
				...config,
				p5:true,
				animate: true,
				context: '2d',
				// canvas: ref.current,
				attributes: {
					antialias: true
				}
			});
		})

	}, [ref]);
	return <div style={{ position: "fixed", inset: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
		<canvas ref={ref} />
	</div>
}
const components = {
	SharePanel: () => <HelperButton />
}
// const TldrawRenderer = ()=>{
// 	return 		<div style={{ position: 'fixed', inset: 0 }}>
// 	<Tldraw 
// 	// shapeUtils={customShape}
// 	components={components}
// 	onMount={(editor) => {
// 		// editor.createShape({ type: 'code-shape', x: 100, y: 100 })
// 		tldrawUtils.renderInstructions(editor, plotObject, settings)
// 	}}>	
// 	</Tldraw> 
// 	</div>
// }
export default function App() {
	
	return (
		<SketchRenderer/>
		// <TldrawRenderer/>
	)
}
{/* <Tldraw shapeUtils={customShape}
				onMount={(editor) => {
					// editor.createShape({ type: 'code-shape', x: 100, y: 100 })
					
					tldrawUtils.renderInstructions(editor, instructions)

				}}/> */}