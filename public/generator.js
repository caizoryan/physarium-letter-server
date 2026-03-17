import { Q5 as p5 } from "./lib/q5/q5.js";
import { reactive } from "./lib/chowk.js";
import { dom } from "./lib/dom.js";

let container = [".q5"];

// let image = new Image();
// image.src = "./base.png";

let pageWidth = 792 * 2;
let pageHeight = 612 * 2;

let v = (x, y) => ({ x, y });
let c = 0

const imageToPoints = (img, sampleRate = 0.1, density = 1) => {
	let x = 0;
	let y = 0;
	img.loadPixels();

	let w = img.canvas.width,
		h = img.canvas.height;

	let points = [];

	let offsetX = 0,
		offsetY = 0;

	let allPoints = [];

	let r = Math.max(0.5, sampleRate);

	for (let py = 0; py < h; py++) {
		for (let px = 0; px < w; px++) {
			let index = (py * w + px) * 4;

			let r = img.pixels[index];
			let g = img.pixels[index + 1];
			let b = img.pixels[index + 2];

			let gray = 0.299 * r + 0.587 * g + 0.114 * b;

			if (c < 1000){
				c++
				console.log(gray, allPoints)
			}

			if ((r == 1 || img.random() < r) && gray < 245) {
				allPoints.push({
					x: px,
					y: py,
					z: gray,
					// z: part1ky1(px) | (part1by1(py) << 1),
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
			x: (p.x + offsetX) / density + x,
			y: (p.y + offsetY) / density + y,
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

let state = {};

state.width = pageWidth;
state.height = pageHeight;
state.strokeWeight = 1
state.loaded = 0;
state.colors = ["yellow", "blue", "red"];
state.colors = ["#0468AF", "#058EF0", "#4BB2FB"];
state.colors = ["#025002", "#119711", "#35BB35"];
state.colors = ["yellow", "blue", "red"];
state.colors = ["black", "black", "black"];

state.chars = [".", ":", "-", "=", "+", "*", "#", "%"];
// state.chars = ["c", "f", "u", "l", ">", ")", "))"];
// state.chars = "/|\\xo-.+=".split("");
state.chars = ".:+x//+कग/ङविचा.x*^टध्यान///".split("");
state.moldCount = 75;

// state.width = 712;
// state.height = 712;

state.x = 100;
state.y = 482;

state.textSize = 400;

state.size = 8;
state.sensorAngle = 45;
state.sensorDist = 35;
state.rotationAngle = state.sensorAngle;
state.grid = createGrid(state.width, state.size);
state.decay = .015;
state.currentWord = "";

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

		let cell = state.grid.getCell(x, y);
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

		let rpix = state.grid.getCell(sensorRightPos.x, sensorRightPos.y);
		let lpix = state.grid.getCell(sensorLeftPos.x, sensorLeftPos.y);
		let fpix = state.grid.getCell(sensorFrontPos.x, sensorFrontPos.y);

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

function init() {
	let el = dom(container);
	document.body.appendChild(el);

	let p = new p5("instance", el);

	let molds = Array(state.moldCount).fill(0).map((e) => mold());

	let alphabetPoints = {};
	// let alphabetOutlinePoints = {};
	let pointsss;
	// let pointsssOutline;

	let setGrid = (word) => {
		state.loaded = 999999;
		state.currentWord = word;

		let graphic = p.createGraphics(pageWidth, pageHeight);
		graphic.textFont("Times");
		graphic.textSize(state.textSize);
		graphic.noStroke();
		graphic.fill(0);

		graphic.text(word, 0, state.textSize);
		// graphic.blendMode(graphic.MULTIPLY);
		// graphic.image(image, 0, 0, pageWidth, pageHeight);
		// graphic.image(image2, 0, 0, 792 * 2, 612 * 2);
		// graphic.text("ASSHOLE", 0, 180);
		// graphic.text("DAWG", 0, 480);

		// p.image(graphic, 0, 0, 792, 612);
		// p.background(255);

		pointsss = imageToPoints(graphic, .5, 1);
		// pointsss = imageToPoints(graphic, .6, 1);
		console.log(pointsss)
		pointsss.forEach((e) => p.circle(e.x, e.y, 15));
		// p.noLoop();

		// pointsssOutline = pointsOutline;
		state.grid.iterate((e) => e.marked = true);
		pointsss.forEach((e) => {
			let pix = state.grid.getCell(e.x, e.y);
			if (pix) pix.marked = false;
		});
	};

	p.setup = () => {
		p.createCanvas(state.width, state.height);
		// p.frameRate(1);
		let word =
			"bosok making as meditative practice as excuse to make books with friends as friends who love to meditate";

		let letters = word.split(" ");
		let index = 0;

		setTimeout(() => {
			setGrid(
				letters[index % letters.length],
			);
		}, 150);

		p.textFont("monospace");
		p.textSize(state.size * 1.3);

		p.filter(p.BLUR, 3);
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

	setTimeout(() => {
		p.mousePressed = () => {
			pressed = true;
			console.log(state.grid.data);
			p.save();
			// saveData(
			// 	{
			// 		grid: state.grid.data,
			// 		points: pointsss,
			// 	},
			// 	state.currentWord,
			// );
		};

		p.mouseReleased = () => {
			pressed = false;
		};

		p.draw = () => {
			p.background(255);

			if (pressed) {
				let pix = state.grid.getCell(p.mouseX, p.mouseY);
				if (pix) pix.brightness = 1;
			}

			molds.forEach((m) => m.update(p));

			if (Array.isArray(pointsss)) {
				p.fill(state.colors[1]);
				p.noStroke();
				state.loaded += 65;
				pointsss.forEach((m, i) => {
					if (i > state.loaded) return;
					p.ellipse(m.x, m.y, 2);
					//
					// let char =
					// 	state.chars[Math.floor(m.x / p.width * state.chars.length)];
					// p.text(char, m.x, m.y);
				});
			}

			let last;
			let possiblePoints = [];
			state.grid.iterate((pix) => {
				let char = state.chars[Math.floor(pix.brightness * state.chars.length)];
				// char = "/";

				if (pix.brightness > 0) {
					if (pix.brightness > .9) {
						// p.fill(455 - ((pix.brightness) * 255));
						// p.fill(255);
						p.noFill(state.colors[1]);
						p.stroke(state.colors[1]);
						p.strokeWeight(pix.brightness * 4);
						p.ellipse(pix.x, pix.y, state.size * .8);
						possiblePoints.push(pix);
					} else {
						// p.fill(55 - ((pix.brightness) * 255));
						p.fill(state.colors[2]);
						p.strokeWeight(2.2);
						p.stroke(state.colors[2]);
						// p.noStroke();
						p.text(char, pix.x, pix.y);
					}

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
							diffY < 285 &&
							diffY > 45 &&
							diffX > 25 &&
							diffX < 65
						) {
							p.curve(
								possible.x - 35,
								possible.y - 25,
								possible.x,
								possible.y,
								pix.x,
								pix.y,
								pix.x - 35,
								pix.y + 25,
							);

							p.fill(255);
							p.square(possible.x - 5, possible.y - 5, 10);
							p.square(pix.x - 5, pix.y - 5, 10);
							p.noFill();
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

			p.text("ANGLE: " + state.rotationAngle, 10, 10);

			// molds.forEach((m) => m.draw(p));
		};
	}, 15);
}

init();
