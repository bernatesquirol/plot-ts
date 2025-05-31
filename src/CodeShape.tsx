import {
	Geometry2d,
	HTMLContainer,
	type RecordProps,
	Rectangle2d,
	ShapeUtil,
	T,
	type TLBaseShape,
	type TLResizeInfo,
	resizeBox,
} from 'tldraw'
// [1]

type ICustomShape = TLBaseShape<
	'code-shape',
	{
		w: number
		h: number
		text: string
	}
>

// [2]
export class CodeShapeUtil extends ShapeUtil<ICustomShape> {
	// [a]
	static override type = 'code-shape' as const
	static override props: RecordProps<ICustomShape> = {
		w: T.number,
		h: T.number,
		text: T.string,
	}

	// [b]
	getDefaultProps(): ICustomShape['props'] {
		return {
			w: 200,
			h: 200,
			text: "I'm a shape!",
		}
	}

	// [c]
	override canEdit() {
		return false
	}
	override canResize() {
		return true
	}
	override isAspectRatioLocked() {
		return false
	}

	// [d]
	getGeometry(shape: ICustomShape): Geometry2d {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		})
	}

	// [e]
	override onResize(shape: any, info: TLResizeInfo<any>) {
		return resizeBox(shape, info)
	}

	// [f]
	component(shape: ICustomShape) {
		return <HTMLContainer style={{ backgroundColor: '#efefef' }}>{shape.props.text}</HTMLContainer>
	}

	// [g]
	indicator(shape: ICustomShape) {
		return <rect width={shape.props.w} height={shape.props.h} />
	}
}