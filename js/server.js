const express = require("express");
const app = express();

app.use(express.static(__dirname)); // serve all files in folder

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});