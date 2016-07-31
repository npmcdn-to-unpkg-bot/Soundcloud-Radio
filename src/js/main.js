SC.initialize({
  client_id: '35ae1f409c6f36d7cd493f3974c34135'
});

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
	var trackTile = '<div></div>'
  // var song = document.createElement('div'),
  //     songInfo = document.createElement('div'),
  //     songTitle = document.createTextNode(trackTitle),
  //     songLink = document.createElement('a');
  //     userLink = document.createElement('a');
  //     username = document.createTextNode(user);
	//
  // song.style.backgroundImage = `url(${artwork})`;
  // song.className = 'track';
  // song.setAttribute('playlist-id', trackId);
  // songInfo.appendChild(songLink);
  // song.appendChild(songInfo);
  // songInfo.className = 'song-info';
  // songLink.appendChild(songTitle);
  // userLink.appendChild(username);
  // userLink.className = 'user';
  // song.appendChild(userLink);
	//
  // document.getElementById('playlist').appendChild(song);
}

$('#playlist').add('div')
