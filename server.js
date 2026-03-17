import fs from "fs";
import cors from "cors";
import express from "express";
import path from "path";
import process from "process";
import bodyParser from "body-parser";


// **********************************
// ----------------------------------
// CONFIG
// ----------------------------------
// **********************************
//
const CONFIG = {
	DIR: "/fs/",
	LIB: "/lib/",
};
//


// **********************************
// ----------------------------------
// WRITE (NEW) FILE
// ----------------------------------
// **********************************
function write_path(req, res) {
	console.log("WHAT THE ACTUAL FUCKiNG FUCK")

	const file_path = req.path.replace("/fs", "");
	const full_path = path.join(process.cwd(), CONFIG.DIR, file_path);
	const body = req.body;

	// TODO will not make dir... fix this
	if (has_extension(file_path)) {
		write_file(full_path, JSON.stringify(body))
		console.log("Saying all good")
		return res.status(200).send("OK")
	}
	// return if saved... or not
}

function write_image_path(req, res) {
	console.log("HELLO WORLD")
	const file_path = req.path.replace("/fs-image", "");
	const full_path = path.join(process.cwd(), CONFIG.DIR, file_path);
	const body = req.body.image
	if (!body) return res.status(492).send("THE FURKSSS")

	console.log(full_path)
  const dataURL = body
  const base64 = dataURL.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64, "base64");

  fs.writeFileSync(full_path, buffer);
	console.log("done??? : ", full_path)
	return res.status(200).send("OK")
}

function write_file(path, body) {
	let b = `${body}`;
	fs.writeFileSync(path, b, { encoding: "utf8" });
}

function write_image_file(path, req) {
  const stream = fs.createWriteStream(path);
  req.pipe(stream);

  req.on("end", () => {
    res.send("Image saved");
  });

  req.on("error", err => {
    console.error(err);
    res.status(500).send("Upload failed");
  });
}

function write_dir(path) {
	fs.mkdirSync(path, { recursive: true });
}

// **********************************
// ----------------------------------
// GET
// ----------------------------------
// **********************************

/**
 * Will check path provided at files/[*path*]
 * against current directory. And can go two ways:
 *
 * 1. Directory: If there is no extension, will see if there
 *    is a directory, and return an Object with
 *    {
 *  	   type: dir,
 *  	   files: string[]
 *    }
 *
 * 2. File: If there is an extension, will check if there is a
 *    file with the name, if there is, it will return the file.
 */
const get_path = (req, res) => {
	const options = { root: path.join(process.cwd()) };
	const file_path = req.path
	console.log("file_path", file_path);

	const file_res = has_extension(file_path) ? get_file(file_path) : undefined

	if (!file_res) return res.status(404).send("File not found");
	if (file_res.type == "file") res.status(200).sendFile(file_res.path, options);
};



//
//
/** ---------------------------------
 * @param {string} path
 * @returns {File}
 * ---------------------------------- */
function get_file(path) {
	console.log("get file from -> path", path);
	if (!fs.existsSync("." + path)) return null;
	return { type: "file", path: "." + path };
}


function has_extension(str) {
	return str.split("/").pop().includes(".");
}

// **********************************
// ----------------------------------
// INIT SERVER
// ----------------------------------
// **********************************

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// app.get("/", (req, res) => {
// 	res.sendFile("index.html", { root: path.join(process.cwd()) });
// });
app.use('/', express.static(path.join(path.join(process.cwd()), 'public')))


app.get("/fs/:path", get_path);
app.post("/fs/:path", write_path);
app.post("/fs-image/:path", write_image_path);

const port = 7772;
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
