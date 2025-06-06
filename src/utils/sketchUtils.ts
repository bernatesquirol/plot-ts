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
export const sketchBuilder = (instructions: Instruction[], _margin?: number)=>{
	const sketch = ({ }) => {
		//Basic example from canvas-sketch repo
		return ({ context, width, height }: {width:number, height:number, context:any}) => {
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