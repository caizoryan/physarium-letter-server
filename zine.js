import PDFDocument from 'pdfkit'
import fs from 'fs'
import { Grid } from './grid.js';

function getBounds(points) {
	if (!points.length) {
		return { x: 0, y: 0, width: 0, height: 0 };
	}

	let minX = points[0].x;
	let maxX = points[0].x;
	let minY = points[0].y;
	let maxY = points[0].y;

	for (const p of points) {
		if (p.x < minX) minX = p.x;
		if (p.x > maxX) maxX = p.x;
		if (p.y < minY) minY = p.y;
		if (p.y > maxY) maxY = p.y;
	}

	return {
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY
	};
}

let alphabets = {}
let words = "book making as meditative practice as_1 excuse to make books with friends friends_1 who love to meditate"
words.split(" ").forEach(word => {
	console.log("Reading", word)
	let points = fs.readFileSync('./words/' + word + '.json', { encoding: 'utf8' })
	points = JSON.parse(points)
	points = points
	let bounds = getBounds(points.points)
	let diffX = bounds.x
	let diffY = bounds.y
	let grid = points.grid.filter(e => e.brightness > 0).map(e => {
		return { x: e.x - diffX, y: e.y - diffY, brightness: e.brightness }
	})

	let p = points.points.map(e => {
		return { x: e.x - diffX, y: e.y - diffY, brightness: e.brightness }
	})

	points = {
		grid,
		points: p,
		// width: bounds.width,
		// height: bounds.height,
	}

	alphabets[word] = points
})


let inch = v => v * 72
let xCount = 12
let nx = 120
let ny = 80
let nw = 15
let nh = 220

let random = (num) => (Math.random() * (Math.random > .3 ? 1 : -1)) * num

let front = {
	fontSize: 28,
	font: './monument_mono_bold.otf',
	fillColor: [0, 0, 0, 100],
}

let title = {
	fontSize: 8,
	font: './font.ttf',
	fillColor: [0, 0, 0, 50],
}

let body = {
	fontSize: 8,
	font: './_font.ttf',
	fillColor: [0, 0, 0, 80],
}

let tag = {
	fontSize: 7,
	fillColor: '#000',
	font: './monument_mono_medium.otf'
}

let line = (doc, x1, y1, x2, y2, strokeColor = 'black', strokeWeight = 1, dash) => {
	doc.save()
	doc.lineWidth(strokeWeight)

	doc.moveTo(x1, y1)                               // set the current point
		.lineTo(x2, y2)                            // draw a line

	dash ? doc.dash(dash) : null
	doc.stroke(strokeColor);                                   // stroke the path
	doc.restore()
}

let grid = new Grid({
	margin: {
		top: inch(.25),
		bottom: inch(1 / 4),
		inside: inch(1),
		outside: inch(1.25),
	},

	gutter: inch(.125),
	columns: 10,
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

	spread_width: inch(10),
	spread_height: inch(8),

	page_width: inch(11),
	page_height: inch(8.5)
})

let draw_grid = (doc, grid) => {
	let [recto, verso] = grid.columns()

	let strokeWeight = .1
	let strokeColor = [30, 0, 0, 0]

	doc.lineWidth(strokeWeight)
	doc.strokeColor(strokeColor)

	grid.hanglines().forEach(e => {
		doc.dash(2)
		drawLineDocFn({
			points: [{ x: 0, y: e }, { x: grid.props.page_width, y: e }],
			stroke: [0, 40, 0, 0],
			strokeWeight: .1,
		})(doc)
		doc.undash()

	})

	recto.forEach((col) => {
		doc.rect(col.x, col.y, col.w, col.h)
		doc.stroke()
	})

	verso.forEach((col) => {
		doc.rect(col.x, col.y, col.w, col.h)
		doc.stroke()
	})
}

let width = inch(3 / 4)
let miniLines = (doc, x, y, end, step) => {
	for (; y < end; y += step) {
		line(doc, x, y, x + width, y, [50, 0, 0, 0], .5)
	}
}

let blankpage = (doc) => { }
let stylesheet = (doc, t) => Object.entries(t).forEach(([k, v]) => doc[k](v))

let page_number = -1

let spreads = []

spreads.push([
	(doc) => {
		frontCover(doc, 1)
		backCover(doc, 1)
	}],
)

spreads.push([
	(doc) => {
		frontCover(doc, 2)
		backCover(doc, 2)
	}],
)

spreads.push([
	(doc) => {
		frontCover(doc, 3)
		backCover(doc, 3)
	}],
)

spreads.push([
	(doc) => {
		frontCover(doc, 4)
		backCover(doc, 4)
	}],
)

spreads.push([
	(doc) => {
		frontCover(doc, 0)
		backCover(doc, 0)
	}],
)

let frontCover = (doc, layer) => {
	let startX = 260
	let startY = 40
	let leading = 25
	let line = num => num * leading + startY

	let words = {
		"book": [startX, startY],
		"making": [startX, line(1)],
		"as": [startX + 90, line(1.25)],
		"meditative": [startX, line(2.1)],
		"practice": [startX, line(3.1)],
		"as_1": [startX + 95, line(3.35)],
		"excuse": [startX, line(4.35)],
		"to": [startX + 85, line(4.25)],
	}


	Object.entries(words).forEach(([word, args]) => {
		doc.save()
		writeDawg(doc, alphabets[word], args[0], args[1], layer)
		doc.restore()
	})
}

let backCover = (doc, layer) => {
	let startX = 40
	let startY = -40
	let leading = 25
	let line = num => num * leading + startY

	let words = {
		"make": [startX, line(5.25)],
		"books": [startX + 25, line(6.25)],
		"with": [startX, line(7.25)],
		"friends": [startX, line(8.25)],
		"as": [startX + 79, line(8.25)],
		"friends_1": [startX + 20, line(9.25)],
		"who": [startX, line(10.25)],
		"love": [startX + 79, line(10.25)],
		"to": [startX + 79, line(11.25)],
		"meditate": [startX, line(12.25)],
	}

	Object.entries(words).forEach(([word, args]) => {
		doc.save()
		writeDawg(doc, alphabets[word], ...args, layer)
		doc.restore()
	})
}


function writeDawg(doc, points, x, y, layer = 1) {
	doc.translate(x
		// + Math.random() * 5
		,
		y
		// + Math.random() * 5
	)
	doc.scale(.13, { origin: [x, y] })

	let bounds = getBounds(points.grid)
	// doc.rect(bounds.x, bounds.y, bounds.width, bounds.height)
	// doc.stroke('black')
	//
	console.log("WHAT THEFUCK", layer)

	if (layer == 1) renderBackground(doc, points.points);
	if (layer == 2) renderCircles(doc, points.grid);
	if (layer == 3) renderText(doc, points.grid);
	if (layer == 4) renderBlobs(doc, points.grid);
	if (layer == 0) {
		renderBackground(doc, points.points);
		renderCircles(doc, points.grid);
		renderText(doc, points.grid);
	}
}

let renderBackground = (doc, points) => {
	points.forEach(e => {
		doc.circle(e.x, e.y, 2)
		doc.fill([0, 0, 0, 100])
	})
}

let renderCircles = (doc, points) => {
	points.forEach(e => {
		if (e.brightness > .9) {
			doc.circle(e.x, e.y, e.brightness * 4)
			doc.fill([0, 0, 0, 100])
		}
	})
}

let state = {}
state.chars = "/|\\xo-.+=".split("");

let renderText = (doc, points) => {
	let last
	points.forEach(e => {
		if (e.brightness <= .9) {
			let char = state.chars[Math.floor(e.brightness * state.chars.length)];
			doc.fillColor('black')
			doc.strokeColor("black")
			doc.fontSize(11)
			doc.lineWidth(1)
			// doc.circle(e.x, e.y, 25)
			// doc.fill('black')
			doc.text(char, e.x, e.y,
				// { width: 500, height: 500 }
				{ stroke: true }
			)
		}

		let pix = e
		if (last) {
			let diffX = Math.abs(pix.x - last.x);
			let diffY = Math.abs(pix.y - last.y);

			if (diffX < 55 && diffX > 15 && diffY < 55) {
				const x0 = last.x - 20;
				const y0 = last.y + 35;

				const x1 = last.x;
				const y1 = last.y;

				const x2 = pix.x;
				const y2 = pix.y;

				const x3 = pix.x + 20;
				const y3 = pix.y + 25;

				// p5 default curveTightness() = 0
				const f = 1 / 6;

				const c1x = x1 + (x2 - x0) * f;
				const c1y = y1 + (y2 - y0) * f;

				const c2x = x2 - (x3 - x1) * f;
				const c2y = y2 - (y3 - y1) * f;

				doc.lineWidth(2)
				doc.moveTo(x1, y1)
					.bezierCurveTo(c1x, c1y, c2x, c2y, x2, y2)
					.stroke();
			}
		}
		last = pix;
	}
	)
}

let renderBlobs = (doc, points) => {
	let last
	points.forEach(e => {
		if (e.brightness <= .9) {
			let char = state.chars[Math.floor(e.brightness * state.chars.length)];
			doc.fillColor('black')
			doc.strokeColor("black")
			doc.fontSize(11)
			// doc.lineWidth(1)
			doc.circle(e.x, e.y, 25)
			doc.fill('black')
			doc.text('x', e.x, e.y,
				{ width: 500, height: 500 }
				// { stroke: true }
			)
			// .stroke()
		}

		let pix = e
		if (last) {
			let diffX = Math.abs(pix.x - last.x);
			let diffY = Math.abs(pix.y - last.y);

			if (diffX < 55 && diffX > 15 && diffY < 55) {
				const x0 = last.x - 20;
				const y0 = last.y + 35;

				const x1 = last.x;
				const y1 = last.y;

				const x2 = pix.x;
				const y2 = pix.y;

				const x3 = pix.x + 20;
				const y3 = pix.y + 25;

				// p5 default curveTightness() = 0
				const f = 1 / 6;

				const c1x = x1 + (x2 - x0) * f;
				const c1y = y1 + (y2 - y0) * f;

				const c2x = x2 - (x3 - x1) * f;
				const c2y = y2 - (y3 - y1) * f;

				doc.lineWidth(2)
				doc.moveTo(x1, y1)
					.bezierCurveTo(c1x, c1y, c2x, c2y, x2, y2)
					.stroke();
			}
		}
		last = pix;
	}
	)
}


spreads.push([
	(doc) => draw_grid(doc, grid),
])

let page_number_fn = (page_number) => (doc) => {
	let pg = page_number
	doc.fontSize(9)
	doc.font("./monument_mono_regular.otf")
	if (pg - 1 != 0)
		doc.text((pg - 1) + '',
			grid.verso_columns()[0].x,
			inch(8.125), { lineBreak: false })

	doc.text(
		(pg) + '',
		grid.recto_columns()[9].x,
		inch(8.125), { lineBreak: false })

	doc.font("./monument_mono_regular.otf")
}



// spreads.push([blankpage])
spreads.push([blankpage])



let writeSpreads = (spreads, filename) => {
	const doc = new PDFDocument({ layout: 'landscape' });
	doc.pipe(fs.createWriteStream(filename));

	spreads.forEach((spread, i) => {
		doc.save()
		// doc.scale(.95, { origin: [inch(5.5), inch(4.25)] })
		spread.forEach(item => {
			item(doc)
		})
		doc.restore()
		if (i != spreads.length - 1) doc.addPage()
	})

	doc.end();
}

let recto_image = (doc, spread, spreads) => {
	doc
		.save()
		.rect(inch(5.5), 0, inch(5.5), inch(8.5))
		.clip()
	spreads[spread].forEach(item => {
		item(doc)
	})
	doc.restore()
}
let verso_image = (doc, spread, spreads) => {
	doc
		.save()
		.rect(0, 0, inch(5.5), inch(8.5))
		.clip()

	spreads[spread].forEach(item => {
		item(doc)
	})

	doc.restore()
}

let pageImage = (doc, spreadNum, spreads) => {
	let spread = Math.floor(spreadNum / 2)
	return spreadNum % 2 == 1
		? recto_image(doc, spread, spreads)
		: verso_image(doc, spread, spreads)
}

let pages = (spreadcount) => {
	if (spreadcount % 2 == 1) {
		return Array(spreadcount).fill(undefined)
			.reduce((acc, _, i) =>
				(acc.push([i * 2, i == spreadcount - 1 ? 0 : i * 2 + 1]), acc), [])
	}

	else console.log("FUCK NOT MULTIPLE OF 4", (spreadcount * 2) - 2)
}
let imposedPages = (pagesArray) => {
	let spreadCount = pagesArray.length
	if (spreadCount % 2 != 1) {
		console.error("FUCK NOT MULTIPLE OF 4", (spreadCount * 2) - 2)
	}
	// get pages
	let last = pagesArray.length - 1
	let pair = (i) => pagesArray[last - i]
	let pairskiplast = (i) => pagesArray[last - i - 1]

	let middle = Math.ceil(last / 2)

	// switch each recto with pair spread recto till middle
	for (let i = 0; i < middle; i++) {
		let f_verso = pagesArray[i][0]
		let p_verso = pair(i)[0]

		pagesArray[i][0] = p_verso
		pair(i)[0] = f_verso
	}

	let pairedup = []

	// pair spreads up with each other
	for (let i = 0; i < middle; i++) {
		pairedup.push(pagesArray[i])
		pairedup.push(pairskiplast(i))
	}

	return pairedup
}


let drawCircleDocFn = (props) => (doc) => {
	doc.save();
	if (props.strokeWeight) doc.lineWidth(props.strokeWeight);
	let x = props.x ? props.x : 0;
	let y = props.y ? props.y : 0;
	doc.circle(x, y, props.radius ? props.radius : 5);
	if (props.stroke && props.fill) doc.fillAndStroke(props.fill, props.stroke);
	else {
		if (props.stroke) doc.stroke(props.stroke);
		if (props.fill) doc.fill(props.fill);
	}

	doc.restore();
};

let availableFonts = ["Times-Roman", "hermit", tag.font, title.font, './marist.ttf', './monument_mono_regular.otf'];

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
	if (fontFamily && availableFonts.includes(fontFamily)) doc.font(fontFamily);
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

let drawImageDocFn = (props) => (doc) => {
	// return;
	doc.save();
	let x = props.x;
	let y = props.y;
	let image = props.image;

	let width = props.width ? props.width : 100;

	if (!props.image) return;
	if (props.fill) doc.fillColor(props.fill);
	// if (props.stroke) doc.stroke(props.stroke);
	doc.image(image, x, y, { width });
	// if (props.stroke && props.fill) doc.fillAndStroke(props.fill, props.stroke);
	// else {
	// }

	doc.restore();
};

let drawImageCanvasFn = (props) => (ctx, canvas) => {
	let x = props.x;
	let y = props.y;
	let image = props.image;

	let width = props.width ? props.width : 100;

	if (!props.image) return;
	if (props.fill) doc.fillColor(props.fill);
	const ratio = img.height / img.width;
	const targetHeight = targetWidth * ratio;

	canvas.width = targetWidth;
	canvas.height = targetHeight;

	ctx.drawImage(img, x, y, targetWidth, targetHeight);
};

let drawLineDocFn = (props) => (doc) => {
	let points = props.points;
	if (props.points.length < 2) return;
	if (props.strokeStyle) doc.dash(props.strokeStyle[0])
	if (props.lineCap) doc.lineCap(props.lineCap)
	if (props.lineJoin) doc.lineJoin(props.lineJoin)
	// let start = points[0];
	// let x1 = start.x;
	// let y1 = start.y;
	//
	// let end = points[1];
	// let x2 = end.x;
	// let y2 = end.y;

	doc.save();
	doc.lineWidth(props.strokeWeight);
	doc.moveTo(points[0].x, points[0].y);
	points.slice(1).filter((e) =>
		e != undefined &&
		typeof e == "object"
	).forEach(
		(e) => doc.lineTo(e.x, e.y),
	);
	// .lineTo(x2, y2);
	if (props.stroke) doc.stroke(props.stroke);
	doc.restore();
};

let drawQuadDocFn = (props) => (doc) => {
	let points = props.points;
	if (props.points.length < 2) return;
	if (props.strokeStyle) doc.dash(props.strokeStyle[0])
	if (props.lineCap) doc.lineCap(props.lineCap)
	if (props.lineJoin) doc.lineJoin(props.lineJoin)
	// let start = points[0];
	// let x1 = start.x;
	// let y1 = start.y;
	//
	// let end = points[1];
	// let x2 = end.x;
	// let y2 = end.y;

	doc.save();
	doc.lineWidth(props.strokeWeight);
	doc.polygon(...props.points.slice(0, 4).map((p) => [p.x, p.y]))

	// .lineTo(x2, y2);
	if (props.stroke && props.fill) doc.fillAndStroke(props.fill, props.stroke);
	else if (props.stroke) doc.stroke(props.stroke);
	else if (props.fill) doc.fill(props.fill);
	doc.restore();
};

let drawRectDocFn = (props) => (doc) => {
	doc.save();
	if (props.strokeWeight) doc.lineWidth(props.strokeWeight);
	let x = props.x ? props.x : 0;
	let y = props.y ? props.y : 0;
	let width = props.width ? props.width : 0;
	let height = props.height ? props.height : 0;
	doc.rect(x, y, width, height);
	if (props.strokeStyle) doc.dash(props.strokeStyle[0])
	if (props.stroke && props.fill) doc.fillAndStroke(props.fill, props.stroke);
	else {
		if (props.stroke) doc.stroke(props.stroke);
		if (props.fill) doc.fill(props.fill);
	}

	doc.restore();
};

let runa = (doc, drawables) => {
	let fns = {
		"Circle": drawCircleDocFn,
		"Text": drawTextDocFn,
		"Image": drawImageDocFn,
		"Rect": drawRectDocFn,
		"Line": drawLineDocFn,
		"Group": (props) => (doc) => {
			let drawables = props.draw ? props.draw : [];

			drawables.forEach((fn) => {
				if (!fn) return;
				typeof fns[fn[0]] == "function"
					? fns[fn[0]](fn[1])(doc)
					: console.log("ERROR: Neither a fn nor a key");
			});
		},
	};

	fns.Group({ draw: drawables })(doc);
}
let writeText = (text, x, y, width, height) => doc => {
}


writeSpreads(spreads, "test.pdf")

