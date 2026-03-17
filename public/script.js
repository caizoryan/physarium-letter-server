import { Q5 as p5 } from "./lib/q5/q5.js";
import { reactive } from "./lib/chowk.js";
import { dom } from "./lib/dom.js";

let container = [".q5"];

function saveLetter(letter){
	fetch("/fs/letter-" + letter +"-"+ Date.now()+'.json', {
		method: "POST",
		body: JSON.stringify(state),
		headers: {
			"Content-Type": "application/json",
		}
	})
	.then(res => {
			console.log(res)
	})
}

function saveLetterImage(letter, canvas){
  const dataURL = canvas.toDataURL("image/png");
	fetch("/fs-image/letter-" + letter +"-"+ Date.now()+'.png', {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      image: dataURL
    })
  })
		.then(res => {
			console.log(res)
		})
}

let image = new Image();
image.src = "./base.png";

let pageWidth = 800 ;
let pageHeight = 800 ;

let v = (x, y) => ({ x, y });
let c = 0


let state = {};

state.iterations = 45
state.width = pageWidth;
state.height = pageHeight;

state.lineDiff = {
	xMin: 15,
	xMax: 65,
	yMin: 15,
	yMax: 365,
}

state.loaded = 0;
state.colors = ["yellow", "blue", "red"];
state.colors = ["#0468AF", "#058EF0", "#4BB2FB"];
state.colors = ["#025002", "#119711", "#35BB35"];
state.colors = ["yellow", "blue", "red"];
state.colors = ["black", "black", "black"];

  // state.chars = ["c", "f", "u", "l", ">", ")", "))"];
// state.chars = "/|\\xo-.+=".split("");
// state.chars = ".:+x//+कग/ङविचा.x*^टध्यान///".split("");
state.chars = [".", ":", "-", "=", "+", "*", "#", "%"];
 // state.chars = ".:+x//+कग/.x*^टध्यान///".split("");
state.moldCount = 25;

state.x = 100;
state.y = 482;

state.textSize = 640;
state.disturbance = 0;

state.fontFamily = 'Times'
state.asciiFontFamily = 'monospace'
// state.blobSize = () => Math.random() * 8  ;
state.blobSize =  28  ;
state.filter = ''
state.filter = 'blobify'
state.blobShape = 'rect'
state.blobShape = 'circle'
state.strokeWeight = 4
// state.outlineSize = () => Math.random() * 8 
state.outlineSize =  4  
state.outlineDensity = .99;

state.letter = 'X'
state.sampleRate = .85
state.mainSampleRate = .01
state.density = 1 

state.size = 14
state.asciiSize = state.size * 2.6;
state.asciiFill = 1
state.asciiStroke = 0
state.sensorAngle = 45;
state.sensorDist = 25;
state.rotationAngle = state.sensorAngle;
let grid = createGrid(state.width, state.size);
state.decay = .025;
state.currentWord = "";


let d = localStorage.getItem("data")
if (d) state = JSON.parse(d)

state.paused = 0

state.lineDiff = {
	xMin: 25,
	xMax: 55,
	yMin: 1,
	yMax: 55,
}

const imageToPoints = (img, sampleRate = 0.1, density = 1) => {
	img.loadPixels();

	let w = img.canvas.width,
		h = img.canvas.height;

	let points = [];

	let allPoints = [];

	let r = Math.max(0.5, sampleRate);

		const part1by1 = (n) => {
			n &= 0x0000ffff;
			n = (n | (n << 8)) & 0x00ff00ff;
			n = (n | (n << 4)) & 0x0f0f0f0f;
			n = (n | (n << 2)) & 0x33333333;
			n = (n | (n << 1)) & 0x55555555;
			return n;
		};

	let strat = 1
	for (let py = 0; py < h; py++) {
		for (let px = 0; px < w; px++) {
			let index = (py * w + px) * 4;

			let r = img.pixels[index];
			let g = img.pixels[index + 1];
			let b = img.pixels[index + 2];
			let a = img.pixels[index + 3];

			let gray = 0.299 * r + 0.587 * g + 0.114 * b + a;

			if ((r == 1 || img.random() < r) && gray < (252+255)) {
				allPoints.push({
					x: px,
					y: py,
					z: strat ? gray : (part1by1(px) | (part1by1(py) << 1)),
				});
			}
		}
	}

	let total = allPoints.length;
	let numPoints = total * sampleRate * (1 / r);

	if (sampleRate < 1) allPoints.sort((a, b) => a.z - b.z);

	let step = total / numPoints;
	for (let i = 0; i < total; i += step) {
		let p = allPoints[Math.floor(i)];
		points.push({
			x: (p.x ),
			y: (p.y  ) 
		});
	}

	return points;
};

function createGrid(width, cellSize) {
	const cellsPerRow = Math.floor(width / cellSize);
	const totalCells = cellsPerRow * cellsPerRow;

	// initialize grid
	const grid = new Array(totalCells).fill(null).map((_, index) => {
		const x = index % cellsPerRow;
		const y = Math.floor(index / cellsPerRow);

		return {
			x: x * cellSize,
			y: y * cellSize,
			size: cellSize,
			brightness: Math.random() * .1,
			marked: true,
		};
	});

	function getCell(px, py) {
		if (
			px < 0 ||
			py < 0 ||
			px >= width ||
			py >= width
		) {
			return null;
		}

		const cellX = Math.floor(px / cellSize);
		const cellY = Math.floor(py / cellSize);
		const index = cellY * cellsPerRow + cellX;

		return grid[index];
	}

	function iterate(fn) {
		grid.forEach(fn);
	}

	// closure function
	return { getCell, iterate, data: grid };
}

let mold = () => {
	let x = Math.random() * state.width;
	let y = Math.random() * state.height;
	let r = 10;
	let dist = state.sensorDist;
	let heading = Math.random() * 360;

	let vx = Math.cos(heading);
	let vy = Math.sin(heading);

	let sensorLeftPos = v(0, 0);
	let sensorRightPos = v(0, 0);
	let sensorFrontPos = v(0, 0);

	let update = (p) => {
		vx = Math.cos(heading) * dist;
		vy = Math.sin(heading) * dist;

		x = x + vx;
		y = y + vy;

		if (x > state.width) x = x - state.width + 100;
		if (y > state.height) y = y - state.height + 100;

		if (x < 0) x = x * -1 + 100;
		if (y < 0) y = y * -1 + 100;

		let cell = grid.getCell(x, y);
		if (cell && !cell.marked) cell.brightness = 1;

		sensorRightPos.x = x +
			state.sensorDist * Math.cos(heading + state.sensorAngle);
		sensorRightPos.y = y +
			state.sensorDist * Math.sin(heading + state.sensorAngle);

		sensorLeftPos.x = x +
			state.sensorDist * Math.cos(heading - state.sensorAngle);
		sensorLeftPos.y = y +
			state.sensorDist * Math.sin(heading - state.sensorAngle);

		sensorFrontPos.x = x + state.sensorDist * Math.cos(heading);
		sensorFrontPos.y = y + state.sensorDist * Math.sin(heading);

		let rpix = grid.getCell(sensorRightPos.x, sensorRightPos.y);
		let lpix = grid.getCell(sensorLeftPos.x, sensorLeftPos.y);
		let fpix = grid.getCell(sensorFrontPos.x, sensorFrontPos.y);

		let rpixB = rpix ? rpix.brightness : 0;
		let lpixB = lpix ? lpix.brightness : 0;
		let fpixB = fpix ? fpix.brightness : 0;

		if (fpixB > rpixB && fpixB > lpixB) { }
		else if (fpixB < rpixB && fpixB < lpixB) {
			if (Math.random() > .5) heading += state.rotationAngle;
			else heading -= state.rotationAngle;
		} else if (rpixB > lpixB) heading += state.rotationAngle;
		else if (rpixB < lpixB) heading -= state.rotationAngle;
	};

	let draw = (p) => {
		p.fill(255);
		p.ellipse(x, y, r);

		p.fill(255, 0, 0);
		p.line(x, y, sensorRightPos.x, sensorRightPos.y);
		p.ellipse(sensorRightPos.x, sensorRightPos.y, r);

		p.line(x, y, sensorLeftPos.x, sensorLeftPos.y);
		p.ellipse(sensorLeftPos.x, sensorLeftPos.y, r);

		p.fill(255, 255, 0);
		p.line(x, y, sensorFrontPos.x, sensorFrontPos.y);
		p.ellipse(sensorFrontPos.x, sensorFrontPos.y, r);

		p.text("X: " + Math.floor(x), x + 10, y);
		p.text("Y: " + Math.floor(y), x + 10, y + 10);
	};

	return { draw, update };
};

let letter, graphic

let setGrid = (word) => {
	state.loaded = 999999;
	state.currentWord = word;

	let padding = 350
	letter = p.createGraphics(pageWidth, pageHeight)
	graphic = p.createGraphics(pageWidth, pageHeight);

	letter.textFont(state.fontFamily);
	letter.noStroke();
	// graphic.fill(255);

	letter.background(255)
	letter.fill(0)
	letter.textSize(state.textSize);
	letter.text(word, state.x, state.y);
	graphic.image(letter, 0, 0, letter.width, letter.height);

	if (state.filter == 'blobify') {
		let _pointsss = imageToPoints(graphic, state.sampleRate, state.density);
		letter.background(255)
		_pointsss.forEach((e) => {
			let size = typeof state.blobSize == 'function' ? state.blobSize() : state.blobSize

			if (state.blobShape == 'circle') {
				letter.circle(e.x+Math.random()*state.disturbance, e.y,size)
			}

			else if (state.blobShape == 'rect'){
				letter.rect(e.x+Math.random()*state.disturbance, e.y,size, size)
				// letter.rect(e.x+Math.random()*state.disturbance, e.y,size,size)
			}

		});

		graphic.background(255)
		graphic.image(letter, 0, 0, letter.width, letter.height);
		// p.noLoop()
	}
	//
	// setTimeout(() => {
	// 	p.image(letter, 0,0,graphic.width, graphic.height)
	// 	p.noLoop()
	// }, 250)

	pointsss = imageToPoints(graphic, state.mainSampleRate);
		// letter.textToPoints(state.letter, state.x, state.y, .5, 1)
	grid.iterate((e) => e.marked = true);
	pointsss.forEach((e) => {
		let pix = grid.getCell(e.x, e.y);
		if (pix) pix.marked = false;
	});
};

let p
let pointsss;

let timeout
function queueReset(){
	if (timeout) clearTimeout(timeout)
	timeout = setTimeout(() =>  {reset()}, 5)
}

function key(str) {
	return ['span.key', str]
}

function number(address, opts){
	let num = state[address]
	return [
		'input.number', {
			type: 'number',
			oninput: e => {
				let num = parseFloat(e.target.value)
				if (typeof num == 'number' && !isNaN(num)) state[address] = num
				queueReset()
			},
			step: opts.step || .5,
			min: opts.min || 0,
			max: opts.max || 150,
			value: num
		}]
}

function options(address, options, opts){
	// num = state[address]
// var value = e.value;
	return [
		'select', {
			oninput: e => {
				state[address] = e.target.value
			  queueReset()
			},
		}, 
		...options.map(e => ['option', {value: e}, e])
	]
}

function string(address, opts){
	let str = state[address]
	return [
		'input.string', {
			oninput: e => {
				state[address] = e.target.value
				queueReset()
			},
			value: str
		}]
}

function ui(){
	return [
		['h4.panel-header', 'Base'],
		['.panel', key('Letter'), string('letter', {})],
		['.panel', key('Text Size'), number('textSize', {})],
		['.panel', key('X'), number('x', {})],
		['.panel', key('Y'), number('y', {})],
		['.panel', key('Iterations'), number('iterations', {})],
		['.panel', key('Paused'), number('paused', {})],
		['.panel', key('Font'), string('fontFamily', {})],


		['h4.panel-header', 'Sampling'],
		['.panel', key('Sample Rate'), number('mainSampleRate', {})],
		['.panel', key('Blob Sample Rate'), string('sampleRate', {})],

		['h4.panel-header', 'Ascii'],
		['.panel', key('Ascii Size'), number('asciiSize', {})],
		['.panel', key('Ascii String'), string('chars', {})],
		['.panel', key('Ascii Font'), string('asciiFontFamily', {})],

		['h4.panel-header', 'Outline'],
		['.panel', key('Shape'), options('outlineShape', ['rect', 'circle', 'text'], {})],
		['.panel', key('Size'), number('outlineSize', {})],
		['.panel', key('Density'), number('outlineDensity', {
			max: 1,
			min: 0,
			step: .05
		})],

		['h4.panel-header', 'Pre'],
		['.panel', key('Disturbance'), number('disturbance', {})],
		['.panel', key('Show Layer'), string('showLayer', {})],
		['.panel', key('Layer Opacity'), string('layerOpacity', {})],

		['.panel', key('Filter'), string('filter', {})],
		['.panel', key('Shape'), options('blobShape', ['rect', 'circle'], {})],
		['.panel', key('Blob Size'), string('blobSize', {})],

		['h4.panel-header', 'Extra'],
		['.panel', key('Line Width'), number('strokeWeight', {})],
	]

}

let iterations = 0
function init() {
	let q5El = dom(container);
	let root = dom(
		[".root", 
			['.display', q5El],
			['.controls', ...ui()],
		])
	document.body.appendChild(root);

	p = new p5("instance", q5El);

	let molds = Array(state.moldCount).fill(0).map((e) => mold());

	let alphabetPoints = {};
	// let alphabetOutlinePoints = {};
	// let pointsssOutline;


	p.setup = () => {
		p.createCanvas(state.width, state.height);
		setGrid(state.letter);

	};

	let pressed = false;

	let saveData = (json, file = "data") => {
		let a = document.createElement("a");
		var json = JSON.stringify(json),
			blob = new Blob([json], { type: "octet/stream" }),
			url = window.URL.createObjectURL(blob);
		a.href = url;
		a.download = file + ".json";
		a.click();
		window.URL.revokeObjectURL(url);
	};

		p.mousePressed = () => {
			pressed = true;
			p.background(255)
			// console.log(grid.data);
			// p.save();
		};

		p.mouseReleased = () => {
			pressed = false;
		};

		p.draw = () => {
			p.frameRate(12)
			if (iterations >= state.iterations || state.paused) return
			iterations++
			p.background(255, 5);
			if (state.showLayer) {
				p.opacity(state.layerOpacity)
				// p.blendMode(p.MULTIPLY)
				p.image(graphic, 0, 0, graphic.width, graphic.height);
				p.opacity(1)
				p.blendMode(p.BLEND)
			}

			if (pressed) {
				let pix = grid.getCell(p.mouseX, p.mouseY);
				if (pix) pix.brightness = 1;
			}

			molds.forEach((m) => m.update(p));

			if (Array.isArray(pointsss)) {
				p.fill(state.colors[1]);
				p.noStroke();
				state.loaded += 65;
				let outlineAmount = (pointsss.length*state.outlineDensity)
				let outlineSkipCount = Math.floor(pointsss.length*(outlineAmount / pointsss.length))
				let outlineSkip = 0
				pointsss.forEach((m, i) => {
					if (i > state.loaded) return;
					outlineSkip++
					if (outlineSkip > outlineSkipCount) {
						outlineSkip = 0
					}
					else {
						return
					}
					// if ((Math.random()) > state.outlineDensity) return

					let size  = typeof state.outlineSize=='function'
						? state.outlineSize()
						: state.outlineSize

					if (state.outlineShape == 'circle'){
						 p.ellipse(m.x, m.y, size);
					}

					else if (state.outlineShape == 'rect'){
						 p.rect(
							m.x-(size/2), m.y-(size/2), size, size);
					}

					else if(state.outlineShape == 'text'){
						let char = state.chars[Math.floor(Math.random() * state.chars.length)];
						p.textSize(size)
						p.text(char, m.x, m.y);
					}
				});
			}

			let last;
			let possiblePoints = [];
			p.textSize(state.asciiSize);
			p.textFont(state.asciiFontFamily);

			grid.iterate((pix) => {

				let char = state.chars[Math.floor(pix.brightness * state.chars.length)];

				if (pix.brightness > 0) {

					if (pix.brightness > .9) {
						possiblePoints.push(pix);
					} 

					if (state.asciiFill) p.fill(state.asciiFill);
					if (state.asciiStroke) {
						p.strokeWeight(state.asciiStroke)
						p.stroke(state.colors[2]);
					}

					p.text(char, pix.x, pix.y);

					p.noFill();
					p.stroke(state.colors[2]);
					p.strokeWeight(state.strokeWeight);

					let possibleIndex = Math.floor(Math.random() * possiblePoints.length);
					let possible = possiblePoints[possibleIndex];

					if (possible) {
						let diffX = p.abs(pix.x - possible.x);
						let diffY = p.abs(pix.y - possible.y);

						if (
							// true
							diffY < state.lineDiff.yMax &&
							diffY > state.lineDiff.yMin &&
							diffX > state.lineDiff.xMin &&
							diffX < state.lineDiff.xMax
						) {
							p.curve(
								possible.x - 15,
								possible.y + 85,
								possible.x,
								possible.y,
								pix.x,
								pix.y,
								pix.x - 85,
								pix.y + 65,
							);

							p.fill(255);
							p.noFill();
							p.square(possible.x - 5, possible.y - 5, 10);
							p.square(pix.x - 5, pix.y - 5, 10);
							possiblePoints.splice(possibleIndex, 1);
						}

						p.strokeWeight(1);
					}

					// if (!last)
					last = pix;
					if (possiblePoints.length > 150) possiblePoints.shift();
				}

				pix.brightness -= state.decay;
			});

		};
}

let reset = () => {
	if (timeout) clearTimeout(timeout)
	iterations = 0
	setGrid(state.letter)
	localStorage.setItem("data", JSON.stringify(state))
}

document.onkeydown = e => {
	if (e.key == 'ArrowRight') {
		state.iterations += 5
	}

	if (e.key == 'Enter' && e.metaKey){
		e.preventDefault()
		reset()
	}


	if (e.key == 'S') {
		saveLetter(state.letter)
		saveLetterImage(state.letter, p.canvas)
	}
}

init();
