'use strict';

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
		volumeBar = document.getElementById('volume-bar'),
		tracks = document.getElementsByClassName('tracks'),
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

function createPlaylist(trackTitle, trackId){
	var trackName = document.createTextNode(trackTitle),
      list = document.createElement('li'),
      link = document.createElement('a');

  link.setAttribute('href', '#');
  list.setAttribute('id', trackId);
  list.className = 'tracks';
  list.appendChild(link);
  link.appendChild(trackName);
  document.getElementById('playlist').appendChild(list);
  listenForTrackSelect();
}

function getJSON(url) {
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
}

function getGenre(genre){
  SC.get('/tracks/', {genres: genre, limit: page_size,
    linked_partitioning: currentPage})
    .then(function(tracks){
      clearPlaylist();
			if(tracks.next_href){
				getJSON(tracks.next_href).then(function(data){
						nextHref.push(data.next_href);
						nextPage.style.visibility = 'visible';
	      });
			}
      organiseTracks(tracks.collection);
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

function streamTrack(track){
	SC.stream('/tracks/' + track.id)
		.then(function(player){
			if(!track.streamable){
				currentTrack++;
				streamTrack(playlist[currentTrack]);
			}
			title.innerText = track.title;
			info.style.display = 'inline-block';
			progress.style.display = 'inline';
			trackLength.innerText = msToTime(track.duration);
			highlightPlaying();
			displayArtwork(track.artwork_url)
			currentPlayer = player;
			player.setVolume(0.2);
			volumeBar.setAttribute('value', player.getVolume());
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
}

function search(event){
	event.preventDefault();
	currentGenre = inputField.value;
	getGenre(currentGenre);
}

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
	for (var i = 0; i < tracks.length; i++) {
		tracks[i].addEventListener('click', function(){
			currentTrack = +this.id;
			streamTrack(playlist[this.id]);
		});
	}
}

function highlightPlaying(){
	for (var i = 0; i < tracks.length; i++) {
		if (+tracks[i].id === currentTrack) {
			tracks[i].setAttribute('class', 'tracks playing');
		} else {
			tracks[i].className = 'tracks';
		}
	}
}

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
	if (currentPlayer && currentPlayer.getVolume() < 1) {
		currentPlayer.setVolume(currentPlayer.getVolume() + 0.1);
		if (currentPlayer.getVolume() > 1) {
			currentPlayer.setVolume(1);
		}
		volumeBar.setAttribute('value', currentPlayer.getVolume());
	}
});

document.getElementById('vol-down').addEventListener('click', function(){
	if (currentPlayer && currentPlayer.getVolume() > 0) {
		currentPlayer.setVolume(currentPlayer.getVolume() - 0.1);
		if (currentPlayer.getVolume() < 0) {
			currentPlayer.setVolume(0);
		}
		volumeBar.setAttribute('value', currentPlayer.getVolume());
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

document.getElementById('seekbar').addEventListener('click', function (e){
  var x = e.offsetX;
  currentPlayer.seek((trackDuration / 400) * x);
});

volumeBar.addEventListener('click', function(e){
	var x = e.offsetX;
  currentPlayer.setVolume(x / 70);
  volumeBar.setAttribute('value', currentPlayer.getVolume());
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
	getGenre(currentGenre)
	currentPage--;
});
