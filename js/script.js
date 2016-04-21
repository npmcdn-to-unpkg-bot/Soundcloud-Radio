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
    tracks = document.getElementsByClassName('track'),
    searchQuery = document.getElementById('search-query'),
    currentTrack = 0,
    pageSize = 200,
    currentPage = 1,
    volume = 0.3,
    nextHref = [],
    playlist = [],
    trackDuration,
    currentPlayer,
    currentSearch;

String.prototype.prepend = function(string){
  return string + this;
}

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

function createPlaylist(trackTitle, artwork, user, trackId){
  artwork = artwork || 'img/image-filler.png';
  var song = document.createElement('div'),
      songInfo = document.createElement('div'),
      songTitle = document.createTextNode(trackTitle),
      songLink = document.createElement('a');
      userLink = document.createElement('a');
      username = document.createTextNode(user);

  song.style.backgroundImage = `url(${artwork})`;
  song.className = 'track';
  song.setAttribute('playlist-id', trackId);
  songInfo.appendChild(songLink);
  song.appendChild(songInfo);
  songInfo.className = 'song-info';
  songLink.appendChild(songTitle);
  userLink.appendChild(username);
  userLink.className = 'user';
  song.appendChild(userLink);

  document.getElementById('playlist').appendChild(song);
}

function getJSON(url){
  return new Promise(function(resolve, reject){
    var xhr = new XMLHttpRequest();
    xhr.open('get', url, true);
    xhr.responseType = 'json';
    xhr.onload = function(){
      var status = xhr.status;
      if (status == 200){
        resolve(xhr.response);
      } else{
        reject(status);
      }
    };
    xhr.send();
  });
}

function getCollection(genre, keyword){
  SC.get('/tracks/',{genres: genre, q: keyword, limit: pageSize,
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
  for (var i = 0; i < collection.length; i++){
    playlist.push(collection[i]);
    if(playlist[i].artwork_url){
      playlist[i].artwork_url = playlist[i].artwork_url.replace('large', 't300x300');
    }
    createPlaylist(playlist[i].title,
      playlist[i].artwork_url, playlist[i].user.username, i);
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
      // displayArtwork(track.artwork_url)
      currentPlayer = player;
      player.setVolume(volume);
      volumeBar.setAttribute('value', player.getVolume());
      player.options.protocols = ['http'];
      player.play();
      trackDuration = track.duration;
      highlightPlaying();
      player.on('time', function(){
        trackSeconds.innerText = msToTime(player.currentTime());
        seekbar.setAttribute('value', player.currentTime() / track.duration);
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
  currentSearch = inputField.value;
  if (searchQuery.value === 'genre'){
    getCollection(inputField.value);
  }
  else if (searchQuery.value === 'keyword'){
    getCollection('',inputField.value);
  }
}

function clearPlaylist(){
  playlist = [];
  currentTrack = 0;
  var pl = document.getElementById('playlist');
  if (pl){
    while (pl.firstChild){
      pl.removeChild(pl.firstChild);
    }
  }
}

function highlightPlaying(){
  for (var i = 0; i < tracks.length; i++) {
    tracks[i].setAttribute('id', '');
    if(+tracks[i].getAttribute('playlist-id') ===  currentTrack){
      tracks[i].setAttribute('id', 'playing');
    }
  }
}
function increaseVolume(){
  if (currentPlayer && currentPlayer.getVolume() < 1){
    volume += 0.1;
    currentPlayer.setVolume(volume);
    if (currentPlayer.getVolume() > 1){
      currentPlayer.setVolume(1);
      volume = 1;
    }
    volumeBar.setAttribute('value', currentPlayer.getVolume());
  }
}
function decreaseVolume(){
  if (currentPlayer && currentPlayer.getVolume() > 0){
    volume -= 0.1;
    currentPlayer.setVolume(volume);
    if (currentPlayer.getVolume() < 0){
      currentPlayer.setVolume(0);
      volume = 0;
    }
    volumeBar.setAttribute('value', currentPlayer.getVolume());
  }
}

document.querySelector('body').addEventListener('click', function(event){
  if (event.target.className === 'track'){
    if (+event.target.getAttribute('playlist-id') === currentTrack){
      if(currentPlayer.isPlaying()){
        // event.target.style.backgroundImage = event.target.style.backgroundImage.prepend('url(img/paused.png), ');
        currentPlayer.pause();
        event.target.setAttribute('id', 'paused');
      } else {
        // event.target.style.backgroundImage = 'url(img/playing.png), ' + event.target.style.backgroundImage;
        currentPlayer.play();
        event.target.setAttribute('id', 'playing');
      }
    } else {
      currentTrack = +event.target.getAttribute('playlist-id');
      streamTrack(playlist[currentTrack]);
      event.target.setAttribute('id', 'playing');
    }
  }
});

document.getElementById('searchForm').addEventListener('submit', search);

document.getElementById('pause').addEventListener('click', function(){
  if (currentPlayer._isPlaying){
    currentPlayer.pause();
  }
});

document.getElementById('play').addEventListener('click', function(){
  if (!currentPlayer._isPlaying){
    currentPlayer.play();
  }
});

document.getElementById('vol-up').addEventListener('click', function(){
  increaseVolume();
});

document.getElementById('vol-down').addEventListener('click', function(){
  decreaseVolume();
});

document.getElementById('next').addEventListener('click', function(){
  if (currentPlayer && currentTrack !== playlist.length -1){
    currentTrack++;
    streamTrack(playlist[currentTrack]);
  }
});

document.getElementById('prev').addEventListener('click', function(){
  if (currentPlayer && currentTrack !== 0){
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
  if(currentPage === 2){
    getCollection(currentSearch);
    previousPage.style.visibility = 'hidden';
  } else{
    getJSON(nextHref[currentPage - 3]).then(function(data){
      organiseTracks(data.collection);
    });
    currentPage--;
  }
});

searchQuery.addEventListener('change', function(){
  if(this.value === 'keyword'){
    inputField.setAttribute('placeholder', 'Song Title, Artist, Instrument');
  } else if(this.value === 'genre'){
    inputField.setAttribute('placeholder', 'Drum&Bass,House,Techno');
  }
});

document.querySelector('body').addEventListener('keypress', function(event){
  if(currentPlayer){
    if(event.charCode === 32 && document.activeElement !== inputField){
      if(true){
        event.preventDefault();
        if(currentPlayer.isPlaying()){
          currentPlayer.pause();
        } else if(playlist[0]){
          currentPlayer.play();
        }
      }
    }
    else if(event.charCode === 61){
      event.preventDefault();
      increaseVolume();
    }
    else if(event.charCode === 45){
      event.preventDefault();
      decreaseVolume();
    }
    else if(event.charCode === 93 && currentTrack !== playlist.length -1){
      event.preventDefault();
      currentTrack++;
      streamTrack(playlist[currentTrack]);
    }
    else if (event.charCode === 91 && currentTrack !== 0){
      currentTrack--;
      streamTrack(playlist[currentTrack])
    }
    else if(event.charCode === 115 && document.activeElement !== inputField){
       inputField.focus();
    }
  }
});
