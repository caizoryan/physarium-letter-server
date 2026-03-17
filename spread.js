import PDFDocument from 'pdfkit'
import fs from 'fs'
import { Grid } from './grid.js';

let inch = v => v * 72

let grid = new Grid({
	margin: {
		top: inch(.125),
		bottom: inch(1 / 8),
		inside: inch(.25),
		outside: inch(.125),
	},

	gutter: inch(.125),
	columns: 9,
	hanglines: [
		inch(1),
		inch(1 + 2 / 3),
		inch(2),
		inch(2 + 2 / 3),
		inch(3),
		inch(3 + 2 / 3),

		inch(4),
		inch(4 + 2 / 3),

		inch(5),
		inch(5 + 2 / 3),
	],

	spread_width: inch(8.25),
	spread_height: inch(9.5),

	page_width: inch(8.5),
	page_height: inch(11)
})

let draw_grid = (doc, grid) => {
	let [recto, verso] = grid.columns()

	let strokeWeight = 1
	let strokeColor = [30, 0, 0, 0]

	doc.lineWidth(strokeWeight)
	doc.strokeColor(strokeColor)

	doc.rect(0, 0, grid.props.spread_width, grid.props.spread_height)
	doc.fillAndStroke('white', 'black')
	doc.strokeColor(strokeColor)

	drawLineDocFn({
		points: [
			{ x: grid.props.spread_width / 2, y: 0 },
			{ x: grid.props.spread_width / 2, y: grid.props.spread_height }],
		stroke: [0, 0, 0, 100],
		strokeWeight: 1,
	})(doc)

	grid.hanglines().forEach(e => {
		doc.dash(2)
		drawLineDocFn({
			points: [
				{ x: 0, y: e },
				{ x: 0 + grid.props.spread_width, y: e }],
			stroke: [0, 40, 0, 0],
			strokeWeight: .1,
		})(doc)
		doc.undash()
	})

	recto.forEach((col) => {
		doc.rect(0 + col.x, 0 + col.y, col.w, col.h)
		doc.stroke()
	})

	verso.forEach((col) => {
		doc.rect(0 + col.x, 0 + col.y, col.w, col.h)
		doc.stroke()
	})
}

let drawLineDocFn = (props) => (doc) => {
	let points = props.points;
	if (props.points.length < 2) return;
	if (props.strokeStyle) doc.dash(props.strokeStyle[0])
	if (props.lineCap) doc.lineCap(props.lineCap)
	if (props.lineJoin) doc.lineJoin(props.lineJoin)

	doc.save();
	doc.lineWidth(props.strokeWeight);
	doc.moveTo(points[0].x, points[0].y);
	points.slice(1).filter((e) =>
		e != undefined &&
		typeof e == "object"
	).forEach(
		(e) => doc.lineTo(e.x, e.y),
	);
	if (props.stroke) doc.stroke(props.stroke);
	doc.restore();
};

let drawTextDocFn = (props) => (doc) => {
	doc.save();
	let x = props.x;
	let y = props.y;
	let width = props.width ? props.width : 100;
	let height = props.height ? props.height : 100;
	let text = props.text;
	let fontSize = props.fontSize ? props.fontSize : 12;
	let fontFamily = props.fontFamily;
	// let stroke = props.stroke ? true : false;

	if (props.fill) doc.fillColor(props.fill);
	if (fontFamily) doc.font(fontFamily);
	// if (props.stroke) doc.stroke(props.stroke);
	doc.fontSize(fontSize);
	doc.text(text, x, y, { width, height });

	if (props.boundingBox) {
		doc.rect(x, y, width, height);
		doc.lineWidth(props.boundingBox);
		doc.stroke();
	}
	// if (props.stroke && props.fill) doc.fillAndStroke(props.fill, props.stroke);

	doc.restore();
};


let drawStripedRect = props => doc => {
	let { x, y, width, height, step = 5 } = props
	for (let i = x; i < width + x; i += step) {
		drawLineDocFn({
			points: [
				{ x: i, y: y + Math.random() * 5 },
				{ x: i, y: y + height + Math.random() * -5 },
			],
			stroke: [0, 0, 0, 100],
			strokeWeight: 1,
		})(doc)
	}
}




const doc = new PDFDocument();

let offsetY = (grid.props.page_height - (grid.props.spread_height)) / 2
let offsetX = (grid.props.page_width - (grid.props.spread_width)) / 2
doc.pipe(fs.createWriteStream('testy.pdf'));
doc.translate(offsetX, offsetY)
draw_grid(doc, grid)



doc.image('./fs/letter-C-1773766085090.png',
	grid.verso_columns()[0].x,
	grid.verso_columns()[0].y,
	{width: grid.column_width(9)	}
)
doc.fill('black')

doc.end();

