const fs = require("fs");
const zlib = require("zlib");
const { pipeline } = require("stream");
const http = require("http");
const path = require("path");


// //1. Use a readable stream to read a file in chunks and log each chunk.
// const readable = fs.createReadStream("./big.txt", {encoding: "utf-8"});

// readable.on("data", (chunk) => {
//   console.log(chunk);
// });

// readable.on("end", () => {
//   console.log("Finished reading file");
// });


// //2. Use readable and writable streams to copy content from one file to another
// // copyFile.js
// const readStream = fs.createReadStream("./source.txt");
// const writeStream = fs.createWriteStream("./dest.txt");

// readStream.pipe(writeStream);

// writeStream.on("finish", () => {
//   console.log("File copied using streams");
// });


// // 3. Create a pipeline that reads a file, compresses it, and writes it to another file
// pipeline(
//   fs.createReadStream("./data.txt"),
//   zlib.createGzip(),
//   fs.createWriteStream("./data.txt.gz"),
//   (err) => {
//     if (err) console.error(err);
//     else console.log("File compressed successfully");
//   }
// );

//Part2: Simple CRUD Operations Using HTTP
const filePath = path.join(__dirname, "users.json");

function readUsers() {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeUsers(data) {
  fs.writeFileSync(filePath, JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const { url, method } = req;

  if (url === "/user" && method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const users = readUsers();
      const newUser = JSON.parse(body);
      for (let id in users) {
        if (users[id].email === newUser.email) {
          res.writeHead(400);
          return res.end("Email already exists");
        }
      }

      const id = Date.now().toString();
      users[id] = { id, ...newUser };

      writeUsers(users);
      res.writeHead(201);
      res.end("User added successfully");
    });
  }

  else if (url === "/user" && method === "GET") {
    const users = readUsers();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(Object.values(users)));
  }

  else if (url.startsWith("/user/")) {
    const id = url.split("/")[2];
    const users = readUsers();

    if (!users[id]) {
      res.writeHead(404);
      return res.end("User not found");
    }

    // GET USER
    if (method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(users[id]));
    }

    // UPDATE USER
    if (method === "PATCH") {
      let body = "";
      req.on("data", chunk => body += chunk);
      req.on("end", () => {
        const updatedData = JSON.parse(body);
        users[id] = { ...users[id], ...updatedData };

        writeUsers(users);
        res.end("User updated successfully");
      });
    }

    // DELETE USER
    if (method === "DELETE") {
      delete users[id];
      writeUsers(users);
      res.end("User deleted successfully");
    }
  }
  else {
    res.writeHead(404);
    res.end("Route not found");
  }
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
