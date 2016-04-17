SC.initialize({
	client_id: '35ae1f409c6f36d7cd493f3974c34135'
});
var inputField = document.getElementById('genre'),
    title = document.getElementById('title'),
		trackInfo = document.getElementById('track-info'),
		trackLength = document.getElementById('track-length'),
		info = document.getElementById('info'),
		trackSeconds = document.getElementById('track-seconds'),
		progress = document.getElementById('progress'),
		artwork = document.getElementById('artwork'),
		nextPage = document.getElementById('next-page'),
		searchQuery = 'genre',
		nextPagePlaylist = [],
		currentTrack = 0,
		page_size = 200,
		playlist = [],
		currentPlayer,
		chosenGenre;

function msToTime(d){
    var ml = parseInt((d%1000)/100),
				s = parseInt((d/1000)%60),
				m = parseInt((d/(1000*60))%60),
				h = parseInt((d/(1000*60*60))%24);

    h = (h < 10) ? "0" + h : h;
    m = (m < 10) ? "0" + m : m;
    s = (s < 10) ? "0" + s : s;

    return h + ":" + m + ":" + s;
}
var createPlaylist = function(trackTitle, trackNum){
	var trackTitle = document.createTextNode(trackTitle),
			list = document.createElement('li'),
			link = document.createElement('a');
	link.setAttribute('href', "#");
	list.setAttribute('id', trackNum);
	list.className = 'tracks';
	list.appendChild(link);
	link.appendChild(trackTitle);
	document.getElementById('playlist').appendChild(list);
	listenForTrackSelect();
}

var getPlaylist = function(playlist){
	SC.get('/playlists/2050462').then(function(playlist){
		var collection = [];
		playlist.tracks.forEach(function(track){
			console.log(track);
			collection.push(track);
			organiseTracks(collection);
		});
	});
}

var getGenre = function(genre){
	SC.get('/tracks/', {genres: genre, limit: page_size, linked_partitioning: 1})
		.then(function(tracks){
			clearPlaylist();

			organiseTracks(tracks.collection);
			nextPage.style.display = 'inline';
		});
}

function organiseTracks(collection){
	for (var i = 0; i < collection.length; i++) {
		playlist.push(collection[i]);
		createPlaylist(playlist[i].title, i);
	}
	streamTrack(playlist[currentTrack]);
}

function displayArtwork(trackArtwork){
	trackArtwork ? artwork.setAttribute('src', trackArtwork)
		: artwork.style.display = 'none';
}

var streamTrack = function(track){
	SC.stream('/tracks/' + track.id)
		.then(function(player){
			title.innerText = track.title;
			info.style.display = 'inline-block';
			trackLength.innerText = msToTime(track.duration);
			highlightPlaying();
			displayArtwork(track.artwork_url)
			currentPlayer = player;
			player.setVolume(0.2);
			player.options.protocols = ['http'];
			player.play();

			player.on('time', function(){
				trackSeconds.innerText = msToTime(player.currentTime()) + ' / ';
			});

			player.on('finish', function(){
				currentTrack++;
				streamTrack(playlist[currentTrack]);
			});

		  }).catch(function(){
				console.log(arguments);
			});
};

var search = function(event){
	event.preventDefault();
	if(searchQuery === 'genre'){
		getGenre(inputField.value);
	}
	else if (searchQuery === 'playlist') {
		getPlaylist();
	}
};

function clearPlaylist(){
	playlist = [];
	currentTrack = 0;
		var pl = document.getElementById('playlist');
	  if (pl) {
	    while (pl.firstChild) {
	      pl.removeChild(pl.firstChild);
	    }
	  }
}

function listenForTrackSelect(){
	var tracks = document.getElementsByClassName('tracks');
	for (var i = 0; i < tracks.length; i++) {
		tracks[i].addEventListener('click', function(){
			currentTrack = +this.id;
			streamTrack(playlist[this.id]);
		});
	}
}

function highlightPlaying(){
	var tracks = document.getElementsByClassName('tracks');
	for (var i = 0; i < tracks.length; i++) {
		if (+tracks[i].id === currentTrack) {
			tracks[i].setAttribute('class', "tracks playing");
		} else {
			tracks[i].className = 'tracks';
		}
	}
};
document.getElementById('searchForm').addEventListener('submit', search);

document.getElementById('search-query').addEventListener('change', function(){
	searchQuery = this.options[this.selectedIndex].value;
});

document.getElementById('pause').addEventListener('click', function(){
	if (currentPlayer) {
		currentPlayer.pause();
	}
});
document.getElementById('play').addEventListener('click', function(){
	if (currentPlayer) {
		currentPlayer.play();
		getGenre(chosenGenre);
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
	if (currentPlayer && currentTrack !== playlist.length -1) {
		currentTrack++;
		streamTrack(playlist[currentTrack]);
	}
});
document.getElementById('prev').addEventListener('click', function(){
	if (currentPlayer && currentTrack !== 0) {
		currentTrack--;
		streamTrack(playlist[currentTrack])
	}
});
document.getElementById('clear-playlist').addEventListener('click', clearPlaylist);
