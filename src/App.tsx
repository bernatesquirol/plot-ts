import 'tldraw/tldraw.css'
import {plot} from './plots/0-basket'
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

const settings = {
	dimensions: "a5",
	pixelsPerInch: 200,
	units: "cm",
	orientation: "landscape"
}



const plotObject = plot()
const instructions = utils.plot2instruct(plotObject)
console.log(instructions)
const SketchRenderer = ()=>{
	const ref = createRef<any>();
	useEffect(() => {
		const sketch = sketchUtils.sketchBuilder(instructions)
		canvasSketch(sketch, {
			...settings,
			canvas: ref.current
		});
	}, [ref]);
	return <div style={{ position: "fixed", inset: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
		<canvas ref={ref} />
	</div>
}
const components = {
	SharePanel: () => <HelperButton />
}
const TldrawRenderer = ()=>{
	return 		<div style={{ position: 'fixed', inset: 0 }}>
	<Tldraw 
	// shapeUtils={customShape}
	components={components}
	onMount={(editor) => {
		// editor.createShape({ type: 'code-shape', x: 100, y: 100 })
		tldrawUtils.renderInstructions(editor, plotObject, settings)
	}}>	
	</Tldraw> 
	</div>
}
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