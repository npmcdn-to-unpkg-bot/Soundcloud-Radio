SC.initialize({
	client_id: '35ae1f409c6f36d7cd493f3974c34135'
});

var inputField = document.getElementById('search'),
		trackLength = document.getElementById('track-length'),
		info = document.getElementById('info'),
		trackSeconds = document.getElementById('track-seconds'),
		progress = document.getElementById('progress'),
		artwork = document.getElementById('artwork'),
		nextPage = document.getElementById('next-page'),
		previousPage = document.getElementById('previous-page'),
		nextPlaylist = [],
		currentTrack = 0,
		page_size = 200,
		currentPage = 1,
		nextHref = [],
		playlist = [],
		trackDuration,
		currentPlayer,
		currentGenre;

function msToTime(d){
    var ml = parseInt((d%1000)/100),
				s = parseInt((d/1000)%60),
				m = parseInt((d/(1000*60))%60),
				h = parseInt((d/(1000*60*60))%24);

    h = (h < 10) ? '0' + h : h;
    m = (m < 10) ? '0' + m : m;
    s = (s < 10) ? '0' + s : s;

    return h + ':' + m + ':' + s;
}

var createPlaylist = function(trackTitle, trackNum){
	var trackTitle = document.createTextNode(trackTitle),
			list = document.createElement('li'),
			link = document.createElement('a');

	link.setAttribute('href', '#');
	list.setAttribute('id', trackNum);
	list.className = 'tracks';
	list.appendChild(link);
	link.appendChild(trackTitle);
	document.getElementById('playlist').appendChild(list);
	listenForTrackSelect();
}

var getJSON = function(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('get', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status == 200) {
        resolve(xhr.response);
      } else {
        reject(status);
      }
    };
    xhr.send();
  });
};

var getGenre = function(genre){
	SC.get('/tracks/', {genres: genre, limit: page_size,
		linked_partitioning: currentPage})
		.then(function(tracks){
			clearPlaylist();
			getJSON(tracks.next_href).then(function(data){
				nextHref.push(data.next_href);
			});
			organiseTracks(tracks.collection);
			nextPage.style.visibility = 'visible';
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
		: artwork.setAttribute('src', 'img/image-filler.svg');
}

var streamTrack = function(track){
	SC.stream('/tracks/' + track.id)
		.then(function(player){
			if(!track.streamable){
				currentTrack++;
				streamTrack(playlist[currentTrack]);
			}
			title.innerText = track.title;
			info.style.display = 'inline-block';
			progress.style.display = 'inline'
			trackLength.innerText = msToTime(track.duration);
			highlightPlaying();
			displayArtwork(track.artwork_url)
			currentPlayer = player;
			player.setVolume(0.2);
			player.options.protocols = ['http'];
			player.play();

			trackDuration = track.duration;
			player.on('time', function(){
				trackSeconds.innerText = msToTime(player.currentTime());
				seekbar.setAttribute('value', player.currentTime() / track.duration)
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
	currentGenre = inputField.value;
	getGenre(currentGenre);
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
			tracks[i].setAttribute('class', 'tracks playing');
		} else {
			tracks[i].className = 'tracks';
		}
	}
};

document.getElementById('searchForm').addEventListener('submit', search);

document.getElementById('pause').addEventListener('click', function(){
	if (currentPlayer._isPlaying) {
		currentPlayer.pause();
	}
});

document.getElementById('play').addEventListener('click', function(){
	if (!currentPlayer._isPlaying) {
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

document.getElementById('seekbar').addEventListener('click', function (e) {
		var x = e.offsetX;
    currentPlayer.seek((trackDuration / 400) * x);
});

nextPage.addEventListener('click', function(){
	clearPlaylist();
	getJSON(nextHref[currentPage - 1]).then(function(data){
		nextHref.push(data.next_href);
		organiseTracks(data.collection);
	});
	previousPage.style.display = 'inline';
	currentPage++;
});

previousPage.addEventListener('click', function(){
	clearPlaylist();
	// getJSON(nextHref[currentPage - 2]).then(function(data){
	// 	nextHref.push(data.next_href);
	// 	organiseTracks(data.collection);
	// });
	getGenre(currentGenre)
	currentPage--;
});
