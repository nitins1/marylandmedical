jsonName = "dispensaries";

var toggleableLayerIds = [ 'dispensaries', 'growers', 'processors', 'physicians' ];

function flyToStore(currentEntity) {
  map.flyTo({
    center: currentEntity.geometry.coordinates,
    zoom: 15
  });
}

function createPopUp(currentEntity) {
  var popUps = document.getElementsByClassName('mapboxgl-popup');
  // Check if there is already a popup on the map and if so, remove it
  if (popUps[0]) popUps[0].remove();

  if (currentEntity.properties.facebook) {
    var popup = new mapboxgl.Popup({ closeOnClick: false })
      .setLngLat([currentEntity.geometry.coordinates[0], currentEntity.geometry.coordinates[1] + .0004])
      .setHTML(`<h3>${currentEntity.properties.name}</h3>` +
               `<h4>${currentEntity.properties.address}, ${currentEntity.properties.city} MD</h4>` +
               `<p>${currentEntity.properties.phone} <a class="facebook" href="${currentEntity.properties.facebook}"><i class="fa fa-facebook-official" aria-hidden="true"></i></a><br>
                <a class="website" href="${currentEntity.properties.website}">${currentEntity.properties.website}</a></p>`)
      .addTo(map);
  } else {
    var popup = new mapboxgl.Popup({ closeOnClick: false })
      .setLngLat([currentEntity.geometry.coordinates[0], currentEntity.geometry.coordinates[1] + .0004])
      .setHTML(`<h3>${currentEntity.properties.name}</h3>` +
               `<h4>${currentEntity.properties.address}, ${currentEntity.properties.city} MD</h4>` +
               `<p>${currentEntity.properties.phone} <br><a class="website" href="${currentEntity.properties.website}">${currentEntity.properties.website}</a></p>`)
      .addTo(map);
  }
}

function compareStrings(a, b) {
  // Assuming you want case-insensitive comparison
  a = a.toLowerCase();
  b = b.toLowerCase();

  return (a < b) ? -1 : (a > b) ? 1 : 0;
};

function buildLocationList(data) {

  // Iterate through the list of stores
  for (i = 0; i < data.features.length; i++) {

    //each feature
    var currentEntity = data.features[i];

    //each feature's properties
    var prop = currentEntity.properties;

    // Select the listing container in the HTML and append a div with the class 'item' for each store
    var listings = document.getElementById('listings');
    var listing = listings.appendChild(document.createElement('div'));
    listing.className = 'item';
    listing.id = 'listing-' + i;

    // Create a new link with the class 'title' for each store
    // and fill it with the store address
    var link = listing.appendChild(document.createElement('a'));
    link.href = '#';
    link.className = 'name';
    link.dataPosition = i;
    link.innerHTML = prop.name;

    // Create a new div with the class 'details' for each store
    // and fill it with the city and phone number
    var details = listing.appendChild(document.createElement('div'));
    details.innerHTML = prop.county;
    if (prop.phone) {
      details.innerHTML += ' &middot; ' + prop.phone;
    }

    // Add an event listener for the links in the sidebar listing
    link.addEventListener('click', function(e) {
      // Update the currentFeature to the store associated with the clicked link
      var currentEntity = data.features[this.dataPosition];
      // 1. Fly to the point associated with the clicked link
      flyToStore(currentEntity);
      // 2. Close all other popups and display popup for clicked store
      createPopUp(currentEntity);
      // 3. Highlight listing in sidebar (and remove highlight for all other listings)
      var activeItem = document.getElementsByClassName('active');
      if (activeItem[0]) {
        activeItem[0].classList.remove('active');
      }
      this.parentNode.classList.add('active');
    });
  }
}

function AJAX_JSON_Req( url ) {
  var AJAX_req = new XMLHttpRequest();
  AJAX_req.open( "GET", url, true );
  AJAX_req.setRequestHeader("Content-type", "application/json");
  AJAX_req.onreadystatechange = function() {
    if( AJAX_req.readyState == 4 && AJAX_req.status == 200 ) {
      //Get JSON data, parse it, and store it in data
      var data = JSON.parse( AJAX_req.responseText );

      buildLocationList(data);

      map.on('load', function(e) {

        // Add an event listener for when a user clicks on the map
        map.on('click', function(e) {
          // Query all the rendered points in the view
          var features = map.queryRenderedFeatures(e.point, { layers: toggleableLayerIds });
          if (features.length) {
            var clickedPoint = features[0];
            // 1. Fly to the point
            flyToStore(clickedPoint);
            // 2. Close all other popups and display popup for clicked store
            createPopUp(clickedPoint);
            // 3. Highlight listing in sidebar (and remove highlight for all other listings)
            var activeItem = document.getElementsByClassName('active');
            if (activeItem[0]) {
              activeItem[0].classList.remove('active');
            }
            // Find the index of the store.features that corresponds to the clickedPoint that fired the event listener
            var selectedFeature = clickedPoint.properties.address;

            for (var i = 0; i < data.features.length; i++) {
              if (data.features[i].properties.address === selectedFeature) {
                selectedFeatureIndex = i;
              }
            }
            // Select the correct list item using the found index and add the active class
            var listing = document.getElementById('listing-' + selectedFeatureIndex);
            listing.classList.add('active');
          }
        });

      });
    }
  }
  AJAX_req.send();
}

function loadData() {
  //store the dropdown value into entity
  var entity = document.getElementById("entity").value.toLowerCase();
  //alert(entity);

  // Removes popups
  var popUps = document.getElementsByClassName('mapboxgl-popup');
  if (popUps[0]) popUps[0].remove();

  //removes all items in listings
  var listings = document.getElementById('listings').childNodes;
  for (i = listings.length-1; i >= 0; i--) {
    listings[i].remove();
  }

  //turns off all layers
  for (var i = 0; i < toggleableLayerIds.length; i++) {
    var layer = toggleableLayerIds[i];
    map.setLayoutProperty(layer, 'visibility', 'none');
  }

  //turns on ONLY the selected layer/entity, entity
  map.setLayoutProperty(entity, 'visibility', 'visible');

  //flies to initial center/zoom
  map.flyTo({
    center: [-76.6413, 39.0458],
    zoom: 6
  });

  //runs a JSON request with the JSON file for the selected entity
  AJAX_JSON_Req(`/dist/${entity}.json`);

}
