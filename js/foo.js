//test features

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

// linked_partitioning param returns link for next page of results
// use getJson to use it
var getGenre = function(genre){
	SC.get('/tracks/', {genres: genre, limit: page_size, linked_partitioning: 1})
		.then(function(tracks){
			clearPlaylist();
			getJSON(tracks.next_href).then(function(data){
				nextPagePlaylist.push(data);
			});
			organiseTracks(tracks.collection);
			nextPage.style.display = 'inline';
		});
}
nextPage.addEventListener('click', function(){
	clearPlaylist();
	organiseTracks(nextPagePlaylist.collection);
	// console.log(nextPagePlaylist.collection);
});

// Search queries
document.getElementById('search-query').addEventListener('change', function(){
	searchQuery = this.options[this.selectedIndex].value;
});
var searchQuery = 'genre',
var search = function(event){
	event.preventDefault();
	if(searchQuery === 'genre'){
		getGenre(inputField.value);
	}
	else if (searchQuery === 'playlist') {
		getPlaylist();
	}
};
