const express = require('express');
const app = express();
const fs = require('fs');
const readFile = require('util').promisify(fs.readFile);
const readdir = require('util').promisify(fs.readdir);

const css = readFile('../asciinema/asciinema-player.css');
const js = readFile('../asciinema/asciinema-player.js');
const files = readdir('./')
	.then(demos =>
		Promise.all(
			demos
				.filter(demo => /\d+/.test(demo))
				.map(demo => readFile(`./${demo}/out.json`))
		)
	)
	.then(files =>
		files.map((jsonString, i) => {
			const json = JSON.parse(jsonString);
			return {
				i,
				src: `<asciinema-player src="data:application/json;base64,${new Buffer(jsonString).toString('base64')}" speed="${json.speed || 1}" theme="tango" autoplay"1" preload="1" idle-time-limit="${json.idle || 1}" font-size="28px"></asciinema-player>`,
				title: json.title,
			};

// asciinema
// tango
// solarized-dark
// solarized-light
// monokai
		})
	);


app.get('*', (req, res) => {
	Promise.all([
		css,
		js,
		files,
	])
	.then(([css, js, files]) => {
		const links = files.filter(file => file.title).map(file => {
			return `<li class="link-${file.i}"><button data-index="${file.i}" href="${file.title}">${file.title}</button></li>`;
		}).join('');

		res.send(`
			<script>window.files=${JSON.stringify(files)}</script>
			<style>
			body {
				margin: 0;
				padding: 20px;
				display: flex;
				align-items: center;
				background-color: hotpink;
				background-color: #121314;
			}
			.asciinema-player-wrapper:-webkit-full-screen {
				background-color: #121314 !important;
			}

			ul {
				position: absolute;
			    right: 0;
			    bottom: 0;
			    z-index: 1;
			    display: flex;
			    flex-direction: row;
			    list-style: none;
			    margin: 10px;
			    padding: 0;
			    width: 100%;
			    justify-content: space-around;
			}

			li button {
				text-decoration: none;
			    color: white;
			    font-size: 18px;
			    -webkit-font-smoothing: antialiased;
			    font-family: Consolas, Menlo, 'Bitstream Vera Sans Mono', monospace, 'Powerline Symbols';
			    color: #ccc;
			    padding: 3px 10px;
			    border-radius: 3px;
			    background: none;
		        border: none;
		        outline: none;
		        cursor: pointer;
			}

			li.current {
				border: 1px solid #6f6d6d;
				background: #222;
				margin: -1px;
			}

			.control-bar {
				display: none;
			}
			</style>
			<ul id="links">${links}</ul>
			<style>${css}</style>
			<div class="container"></div>
			<script>${js}</script>
			<script>
				const container = document.querySelector('.container');
				let player;

				const startDemo = i => {

					const file = files.find(candidate => candidate.i === i)

					container.innerHTML = file.src;
					document.body.setAttribute('demo', i);
					Array.from(document.querySelectorAll('li.current')).forEach(el => el.classList.remove('current'));
					document.querySelector('li.link-' + i).classList.add('current');

					player = container.querySelector('asciinema-player');
					const wrapper = container.querySelector('.asciinema-player-wrapper');

					container.status = 'playing';
					player.play();
					wrapper.focus();
					/*wrapper.webkitRequestFullscreen();*/

					player.addEventListener('play', function(e) {
					  console.log('play', this.currentTime, this.duration);
					})

					player.addEventListener('pause', function(e) {
					  console.log('pause', this.currentTime, this.duration);
					  if (this.currentTime === this.duration) {
					  	this.dispatchEvent(new CustomEvent("end"));
					  }
					})

					player.addEventListener('end', function(e) {
						container.status = 'end';
						console.log('end');
					})
				};

				const clearDemo = () => {
					document.body.setAttribute('demo', 0);
					container.innerHTML = '';
					Array.from(document.querySelectorAll('li.current')).forEach(el => el.classList.remove('current'));
				};

				document.querySelector('#links').addEventListener('click', e => {
					e.preventDefault();
					const demo = parseInt(e.target.getAttribute('data-index'), 0);
					startDemo(demo);
				});

				document.addEventListener('visibilitychange', () => {
					console.log('visibilitychange', document.hidden)
					if (container.status === 'end') {
						clearDemo();
					}
				});

				document.body.addEventListener('keydown', e => {

					if (container.status !== 'playing' && e.key === ' ' && player && player.duration === player.currentTime) {
						console.log('Ignoring space while video is stopped at end');
						return e.preventDefault();
					}

					if (e.metaKey && (e.key === '[' || e.key === ']')) {
						return console.log('disabled');
						e.preventDefault();
						const current = parseInt(document.body.getAttribute('demo'), 10) || 0;
						let newDemo;

						switch (e.key) {
							case '[':
								newDemo = current - 1;
								break;
							case ']':
								newDemo = current + 1;
								break;
						}
						startDemo(newDemo);
					}
				}, true);
			</script>
		`);
	})
	.catch(e => {
		res.send(e.stack);
	});
});

app.listen(5000, () => {
	console.log('Listening at http://localhost:5000.');
	// require('child_process').exec('"/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary" --app=http://localhost:5000 --kiosk --disable-fullscreen-tab-detaching');
});
