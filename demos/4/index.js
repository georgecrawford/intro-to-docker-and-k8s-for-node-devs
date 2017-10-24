const express = require('express');

const PORT = 8080;
const HOST = '0.0.0.0';

const app = express();
app.get('*', (req, res) => {
	console.log(`Handling request to ${req.path}`);
	res.send('Hello world\n');
});

app.listen(PORT, HOST, () => {
	console.log(`Running on http://${HOST}:${PORT}`);
});
