// import 'tldraw/tldraw.css'
import plot from './plots/0-basket'
// import { CodeShapeUtil } from './CodeShape'
// import * as tldrawUtils from './utils/tldrawUtils'
// import { Tldraw } from 'tldraw'
import * as utils from './utils/utils'
import canvasSketch from 'canvas-sketch';
import { createRef, useEffect } from 'react'
const completeProperties = (properties: {lineWidth?:number, strokeStyle?:string})=>{
	return {
		lineWidth: 0.1,
		strokeStyle: "red",
		...(properties||{})
	}
}
type Instruction = {
	properties: {
		lineWidth?:number,
		strokeStyle?:string
	}
	values: {type: "moveTo"|"lineTo", value: [number,number]}[]
}
const settings = {
	dimensions: "a4",
	pixelsPerInch: 200,
	units: "cm"
}
const sketchBuilder = (instructions: Instruction[], _margin)=>{
	const sketch = ({ }) => {
		//Basic example from canvas-sketch repo
		return ({ context, width, height }: {width:number, height:number, context}) => {
			context.fillStyle = "hsl(0, 0%, 98%)";
			context.fillRect(0, 0, width, height);
			instructions.forEach(({properties, values})=>{
				context.beginPath();
				let props = completeProperties(properties)
				Object.entries(props).forEach(([k,v])=>{
					context[k]=v
				})
				values.forEach(({type, value})=>{
					context[type](...value)
				})
				context.stroke()
			})
			// Gradient foreground
			// const fill = context.createLinearGradient(0, 0, width, height);
			// fill.addColorStop(0, "cyan");
			// fill.addColorStop(1, "orange");
	
			// // Fill rectangle
			// context.fillStyle = fill;
			// context.fillRect(margin, margin, width - margin * 2, height - margin * 2);
		};
	};
	return sketch
}


const plotObject = plot()
const instructions = utils.plot2instruct(plotObject)
console.log(instructions)
export default function App() {
	const ref = createRef<any>();
	useEffect(() => {
		const sketch = sketchBuilder(instructions)
		canvasSketch(sketch, {
			...settings,
			canvas: ref.current
		});
	}, [ref]);
	return (
		<div style={{ position: "fixed", inset: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
			<canvas ref={ref} />
			{/* <Tldraw shapeUtils={customShape}
				onMount={(editor) => {
					// editor.createShape({ type: 'code-shape', x: 100, y: 100 })
					
					tldrawUtils.renderInstructions(editor, instructions)

				}}/> */}
		</div>
	)
}