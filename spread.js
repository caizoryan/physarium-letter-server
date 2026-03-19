import PDFDocument  from 'pdfkit'
import fs from 'fs'
import { Grid } from './grid.js';

let inch = v => v * 72

let grid = new Grid({
	margin: {
		top: inch(.5),
		bottom: inch(1 / 8),
		inside: inch(.25),
		outside: inch(.25),
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

		inch(6),
		inch(6 + 2 / 3),

		inch(7),
		inch(7 + 2 / 3),

		inch(8),
		inch(8 + 2 / 3),
	],

	spread_width: inch(8.25),
	spread_height: inch(9.5),

	page_width: inch(8.5),
	page_height: inch(11)
})

let draw_grid = (doc, grid, full=true) => {
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

	if (full){
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

let drawHorizontalLineDocFn = (props) => (doc) => {
	let y = props.y
	let x = props.x
	let width = props.width
	let points = [{x, y}, {x: x+width, y}];
	if (points.length < 2) return;
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
	let align = props.align ? props.align : 'left';
	// let stroke = props.stroke ? true : false;

	if (props.fill) doc.fillColor(props.fill);
	if (fontFamily) doc.font(fontFamily);
	// if (props.stroke) doc.stroke(props.stroke);
	doc.fontSize(fontSize);
	doc.text(text, x, y, { width, height, align });

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



let done = []

function drawMainImage(letter, side='verso', date) {
	let cols = grid[(side + '_columns')]()
	let col = cols[0]
	let files = fs.readdirSync('./fs/')
	let could = []

	files.forEach(file => {
		if (
			file.includes('letter-' + letter + '-')
			&& file.split('.').pop() == 'png'
		){
			could.push(file)
		}
	})

	let chosen = could[Math.floor(Math.random()*could.length)]

	let iterations = 0
	while (done.includes(chosen) && iterations < 50){
		chosen = could[Math.floor(Math.random()*could.length)]
		console.log("OK?", iterations)
		iterations++
	}

	done.push(chosen)

	let width = grid.column_width(8)

	let y = col.y
		// grid.hanglines()[0]

	doc.image('./fs/'+chosen, 
		col.x, y,
		{width }
	)

	doc.rect( col.x, y,
		width,	
		width)
		 // .dash(3, {space: 1})
		.lineWidth(.1)
		.stroke("black")
	.undash()

	let json = chosen.replace('png', 'json')

	drawStats('./fs/'+json, side)
}

function stat(key, value, x, y) {
	let width = grid.column_width(5)
	let gutter = grid.props.gutter
	let lineWidth = width + grid.column_width(3)+gutter
	let valueX = x + width

	drawHorizontalLineDocFn({
		x, 
		y: y-.75, 
		width: lineWidth,
		stroke: [0,0,0,40],
		strokeWeight: .1,
	})(doc)

	drawTextDocFn({
		text:  key,
		x,y,
		fill: 'black',
		fontFamily: './Hermit-Regular.otf',
		fontSize: 7.5,
	})(doc)

	drawTextDocFn({
		text:  value,
		x: valueX, y,
		width: grid.column_width(3),
		fill: 'black',
		fontFamily: './monument_mono_bold.otf',
		fontSize: 7.5,
		// align: 'right'
	})(doc)
}


const getIndex = (char) => Math.abs(char.charCodeAt(0) - 'a'.charCodeAt(0));

function drawSideAlphabet(letter) {
	let width = 20
	let x = grid.props.spread_width - width
	let y = (getIndex(letter)) * width

	console.log(x, y)

	doc.rect( 
		x, y,
		width,	
		width).fill('black')

	drawTextDocFn({
		text: letter,
		x: x+5, y: y+2, 
		fill: 'white'
	})(doc)
}


function drawHeading(heading, x, y){
	let width = grid.column_width(5)
	let gutter = grid.props.gutter
	let lineWidth = width + grid.column_width(3)+gutter
	let valueX = x + width

	drawHorizontalLineDocFn({
		x, 
		y: y-2, 
		width: lineWidth,
		stroke: 'black',
		strokeWeight: 1.5,
	})(doc)

	drawTextDocFn({
		text:  heading,
		x, y,
		// width: grid.column_width(3),
		fill: 'black',
		fontFamily: './monument_mono_bold.otf',
		fontSize: 7.5,
		// align: 'right'
	})(doc)
}

function drawStats(file, side){
	let cols = grid[(side + '_columns')]()
	let data = fs.readFileSync(file, {encoding: 'utf8'})
	data = JSON.parse(data)

	let x = cols[1].x
	let headingX = cols[1].x
	let y = grid.hanglines()[7]
	let leading = 15.2
	let headingLeading = 24.2

	// stat("LETTER", data.letter, x, y)
	// y+=leading

	drawSideAlphabet(data.letter)

	drawHeading('PARAMETERS', headingX, y)
	y+=headingLeading

	stat("TEXT SIZE", data.textSize, x, y)
	y+=leading

	stat("FONT FAMILY", data.fontFamily.replace("Variable Unlicensed Trial", ""), x, y)
	y+=leading


	stat("BACKGROUND (%)", data.backgroundOpacity, x, y)
	y+=leading

	stat("SAMPLE RATE", data.mainSampleRate, x, y)
	y+=leading

	stat("BLOB SAMPLE RATE", data.sampleRate, x, y)
	y+=leading


	stat("MOLD COUNT", data.moldCount, x, y)
	y+=leading

	y+=headingLeading
	drawHeading('ASCII', headingX, y)
	y+=headingLeading

	stat("SIZE", data.asciiSize, x, y)
	y+=leading

	stat("STRING", data.chars, x, y)
	y+=leading

	y+=headingLeading
	drawHeading('OUTLINE', headingX, y)
	y+=headingLeading
	stat("STROKE WEIGHT", data.outlineSize, x, y)
	y+=leading

	stat("FUNKY LINE", data.strokeWeight, x, y)
	y+=leading

	stat("BLOB SIZE", data.blobSize, x, y)
	y+=leading

	stat("DISTURBANCE", data.disturbance, x, y)
	y+=leading


	// stat("TEXT SIZE", data.textSize, x, y)
	// y+=leading
	// zj
}

function drawPageNumber(){
	let colVerso = grid.verso_columns()[1]
	let colRecto = grid.recto_columns()[1]

	let width = grid.column_width(5)
	let valueXVerso = colVerso.x + width
	let valueXRecto = colRecto.x + width

	let y = grid.props.spread_height - inch(.5)

	drawTextDocFn({
		text:  pageNum-1,
		x: valueXVerso,
		y,
		fill: 'black',
		fontFamily: './monument_mono_bold.otf',
		fontSize: 9,
	})(doc)

	drawTextDocFn({
		text:  pageNum,
		x: valueXRecto,
		y,
		fill: 'black',
		fontFamily: './monument_mono_bold.otf',
		fontSize: 9,
	})(doc)
}

let pageNum = 1
function drawSpread(letter){
	doc.translate(offsetX, offsetY)
	draw_grid(doc, grid, false)
	drawMainImage(letter)
	drawMainImage(letter, 'recto')
	drawPageNumber()
	doc.addPage()
	pageNum+=2
}

let spreads = [
	() => drawSpread('A'),
	() => drawSpread('B'),
	() => drawSpread('C'),
	() => drawSpread('D'),
	() => drawSpread('f'),
	() => drawSpread('F'),
	() => drawSpread('K'),
	() => drawSpread('R'),
	() => drawSpread('S'),
	() => drawSpread('X'),
	() => drawSpread('Z')
]

spreads.forEach(e => e())



doc.end();

