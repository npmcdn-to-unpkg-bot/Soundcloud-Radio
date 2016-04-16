SC.initialize({
	client_id: '35ae1f409c6f36d7cd493f3974c34135'
});
var inputField = document.getElementById('url');
var title = document.getElementById('title');
var trackInfo = document.getElementById('track-info');
var trackLength = document.getElementById('track-length');
var info = document.getElementById('info');
var trackSeconds = document.getElementById('track-seconds');
var progress = document.getElementById('progress');
var currentPlayer;
var chosenGenre;
var trackNum = 0;
var playlist = [];


String.prototype.mutate = function(position, interlop){
	return [interlop.repeat(position), this.slice(position)].join('');
};

function msToTime(d) {
    var ml = parseInt((d%1000)/100)
        , s = parseInt((d/1000)%60)
        , m = parseInt((d/(1000*60))%60)
        , h = parseInt((d/(1000*60*60))%24);

    h = (h < 10) ? "0" + h : h;
    m = (m < 10) ? "0" + m : m;
    s = (s < 10) ? "0" + s : s;

    return h + ":" + m + ":" + s;
}

// ███████▒▒▒
function trackProgress(duration){
	var x = 0;
	progress.innerText = progressBar = '▒'.repeat(100);
	setInterval(function(){
		if(!paused){
			progress.innerText = progressBar.mutate(x, '█');
			x++;
		}
	}, 500);
};

var getGenre = function(genre){
	SC.get('/tracks/', {genres: genre})
		.then(function(track){
			for (var i = 0; i < track.length; i++) {
				playlist.push(track);
			}
			// for (var i = 0; i < playlist.length; i++) {
				streamTrack(playlist[0][trackNum]);
				console.log(playlist[0][trackNum].title);
			// }

		});
}

var streamTrack = function(track){
	SC.stream('/tracks/' + track.id)
		.then(function(player){
			title.innerText = track.title;
			info.style.display = 'inline-block';
			trackLength.innerText = msToTime(track.duration);
			currentPlayer = player;
			player.setVolume(0.2);
			player.seek(track.duration - 100);
			player.play();
			player.on('time', function(){
				trackSeconds.innerText = msToTime(player.currentTime());
			});

			player.on('finish', function(){
				trackNum++;
				getGenre(chosenGenre);
				console.log('the track is finished');
			});
		  }).catch(function(){
				console.log(arguments);
			});
		};


var search = function(event){
	event.preventDefault();
	chosenGenre = inputField.value;
	getGenre(chosenGenre);
	if (currentPlayer) {
		currentPlayer.pause();
		// chosenGenre = inputField.value;
		getGenre(inputField.value);
	}
};
document.getElementById('searchForm').addEventListener('submit', search);
document.getElementById('pause').addEventListener('click', function(){
	if (currentPlayer) {
		currentPlayer.pause();
	}
});
document.getElementById('play').addEventListener('click', function(){
	if (currentPlayer) {
		currentPlayer.play();
	}
});
document.getElementById('vol-up').addEventListener('click', function(){
	if (currentPlayer) {
		currentPlayer.setVolume(currentPlayer.getVolume() + 0.1);
		console.log(currentPlayer.getVolume());
	}
});
document.getElementById('vol-down').addEventListener('click', function(){
	if (currentPlayer) {
		currentPlayer.setVolume(currentPlayer.getVolume() - 0.1);
		console.log(currentPlayer.getVolume());
	}
});
document.getElementById('next').addEventListener('click', function(){
	if (currentPlayer) {
		trackNum++;
		getGenre();
	}
});
document.getElementById('prev').addEventListener('click', function(){
	if (currentPlayer) {
		trackNum--;
		getGenre();
	}
});
