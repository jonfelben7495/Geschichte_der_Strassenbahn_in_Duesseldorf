var slider = document.getElementById("yearSlider");
var output = document.getElementById("outputYear");
output.innerHTML = slider.value;

var bounds = [
    [51.09489803482296, 6.440985107421875], // Southwest coordinates
    [51.554434786162615, 7.1085906982421875]  // Northeast coordinates
];

var mymap = L.map('map').setView([51.218, 6.817], 12);

L.tileLayer('https://api.mapbox.com/styles/v1/drjones7495/cjhbwihgi0kbc2smken45ctfc/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZHJqb25lczc0OTUiLCJhIjoiY2poYnI5d3NyMDUzcDMwcGRwN3l5cnV2biJ9.y2p2i2YCVH_smOxjpvT5yg', {
    attribution: 'Map data © <a href="© <a href="https://www.mapbox.com/map-feedback/"">Mapbox</a>',
    minZoom: 11,
    accessToken: 'pk.eyJ1IjoiZHJqb25lczc0OTUiLCJhIjoiY2poYnI5d3NyMDUzcDMwcGRwN3l5cnV2biJ9.y2p2i2YCVH_smOxjpvT5yg'
}).addTo(mymap);

mymap.setMaxBounds(bounds);

L.geoJSON(stadtgrenze, {
    style: {"color": "#000", "fillOpacity": "0"}
}).addTo(mymap);

var line = L.featureGroup();

var usedSectionIDs = [];

var strassenbahnIcon = L.icon({
    iconUrl: 'strassenbahn.png',
    iconSize: [mymap.getZoom()*1.1, mymap.getZoom()*1.1],
});

var stadtbahnIcon = L.icon({
    iconUrl: 'stadtbahn.png',
    iconSize: [mymap.getZoom()*1.1, mymap.getZoom()*1.1],
});

var usedFeatures, usedGeometries;

var zIndex1Lines = [];
var zIndex2Lines = [];
var zIndex3Lines = [];

function getIconSize() {
    var zoomLev = mymap.getZoom();
    strassenbahnIcon = L.icon({
        iconUrl: 'strassenbahn.png',
        iconSize: [zoomLev, zoomLev],
    });
    stadtbahnIcon = L.icon({
        iconUrl: 'stadtbahn.png',
        iconSize: [zoomLev, zoomLev],
    });
}

slider.addEventListener("input", function(){output.innerHTML = this.value}, false);
slider.addEventListener("input", function(){drawLines(); }, false);
mymap.on("zoom", function(){drawLines(); });

drawLines();

function getAllFeatureCollectionsFromGeoJSON (array) {
    		var collectionArray = array;
    		return collectionArray;
    	}

function getFeatureCollectionFromCollectionArray(array, collection) {
    for(var i = 0; i < array.length; i++) {
    	if(array[i].name == collection) {
    		return array[i];
    	} else {
    		console.log("Das Array enthält die FeatureCollection " + collection + " nicht.")
    	}
    }
}

function getAllFeaturesFromFeatureCollection(collection) {
	var featureArray = [];
	turf.featureEach(collection, function(currentFeature) {
    	featureArray.push(currentFeature);
    })
    return featureArray;
}

function getFeatureFromFeatureCollection(collection, feature) {
	var foundFeature;
	turf.propEach(collection, function(currentProperties, featureIndex) {
		if(currentProperties.lineName == feature) {
    		foundFeature = collection.features[featureIndex];
    	} else {
    		console.log("Die FeatureCollection " + collection + " enthält das Feature " + feature + " nicht.");
    	}
	})
	return foundFeature;
}

function getAllGeometriesFromFeature(feature) {
	var geometryArray = [];
	turf.geomEach(feature, function(currentFeature) {
    	geometryArray.push(currentFeature);
    })
	return geometryArray;
}

function getSpecificGeometryFromFeature(feature, geometryID) {
	var geometry;
    turf.geomEach(feature, function(currentGeometry) {
    	if(currentGeometry.sectionID == geometryID) {
    		geometry = currentGeometry;
		}
	})
	return geometry;
}

function getUsedFeaturesFromGeoJSON(array) {
    var featureArray = [];
    for(var i = 0; i < array.length ; i++) {
        turf.featureEach(array[i], function(currentFeature) {
            if (checkYear(currentFeature)) {
                featureArray.push(currentFeature);
            }
        })
    }
    return featureArray;
}

function getGeometriesFromUsedFeatures(array) {
    var geometryArray = [];
    var geometryFeature;
    for(var i = 0; i < array.length ; i++) {
        turf.geomEach(array[i], function(currentGeometry) {
            geometryFeature = turf.feature(currentGeometry, array[i].properties);
            geometryArray.push(geometryFeature);
        })
    }
    return geometryArray;
}

function getIDsFromGeometryArray(array) {
    var idArray = [];
    for(var i = 0; i < array.length; i++) {
        idArray.push(array[i].geometry.sectionID);
    }
    return idArray;
}

function getCoordsFromGeometryArray(array) {
    var coords = [];
    for(var i = 0; i < array.length; i++) {
        coords.push(turf.getCoords(array[i]));
    }
    return coords;
}

function addPopupToFeature(feature, layer) {
    if (feature.properties && feature.properties.lineName && feature.properties.station1 && feature.properties.station2) {
        layer.bindPopup(feature.properties.lineName + ": " + feature.properties.station1 + " &harr; " + feature.properties.station2);
    }
}

function checkYear(feature) {
    var featureStartYear = parseInt(feature.properties.startYear);
    var featureEndYear = parseInt(feature.properties.endYear);
    var sliderYear = parseInt(slider.value);
    if (featureStartYear <= sliderYear && featureEndYear > sliderYear) {
        return true;
    } else {
        return false;
    }
}

function drawLines() {

    if (line != undefined) {
        line.clearLayers();
    };
    destroyLegend();

    usedFeatures = getUsedFeaturesFromGeoJSON(lines);
    usedGeometries = getGeometriesFromUsedFeatures(usedFeatures);

    console.log(usedFeatures);

    zIndex1Lines = [];
    zIndex2Lines = [];
    zIndex3Lines = [];

    for(var i = 0; i < usedFeatures.length; i++) {
        drawGeoJSONFeature(usedFeatures[i]);
    }

    bringFeatureGroupsToFront(zIndex1Lines);
    bringFeatureGroupsToFront(zIndex2Lines);
    bringFeatureGroupsToFront(zIndex3Lines);

    usedSectionIDs = [];

    line.addTo(mymap);
    createLegend(usedFeatures);
}

function drawGeoJSONFeature(feature) {
    var featureGroup = L.featureGroup();
    var geometryArray = getAllGeometriesFromFeature(feature);

    for(var i = 0; i < geometryArray.length; i++) {
        if(!usedSectionIDs.includes(geometryArray[i].sectionID)) {
            usedSectionIDs.push(geometryArray[i].sectionID);
            var coords = turf.getCoords(geometryArray[i]);
            var swappedCoords = lnglatTolatlng(coords);
            var layer = L.polyline(swappedCoords, {color: feature.properties.lineColor, weight: 4, smoothFactor: 1, className: feature.properties.lineName}).addTo(featureGroup);
            checkForUndergroundSection(geometryArray[i].underground, layer);
            addPopupToFeature(feature, layer);
            layer.addTo(featureGroup);
        } else {
            usedSectionIDs.push(geometryArray[i].sectionID);
            var coords = turf.getCoords(geometryArray[i]);
            var swappedCoords = lnglatTolatlng(coords);
            var idInArray = occurencesInArray(geometryArray[i].sectionID, usedSectionIDs);
            var layer = L.polyline(swappedCoords, {color: feature.properties.lineColor, weight: 4, smoothFactor: 1}).addTo(featureGroup);
            sectionInMultipleLines(idInArray, layer);
            checkForUndergroundSection(geometryArray[i].underground, layer);
            addPopupToFeature(feature, layer);
            layer.addTo(featureGroup);
        }
    }
    featureGroup.addTo(line);
    sortIntoZIndexGroup(featureGroup, feature);
}

function sortIntoZIndexGroup (featureGroup, feature) {
    switch(feature.properties.zIndex) {
        case 1:
        zIndex1Lines.push(featureGroup);
        break;
        case 2:
        zIndex2Lines.push(featureGroup);
        break;
        case 3:
        zIndex3Lines.push(featureGroup);
        break;
    }
}

function bringFeatureGroupsToFront (array) {
    if(typeof array != "undefined" && array != null && array.length != null && array.length > 0) {
        for (i = 0; i < array.length; i++) { 
        array[i].bringToFront();
        }
    }
}

function sectionInMultipleLines(occurencesInArray, polyline) {
    switch(occurencesInArray) {
        case 2:
        polyline.setOffset(4);
        break;
        case 3:
        polyline.setOffset(-4);
        break;
        case 4:
        polyline.setOffset(8);
        break;
        case 5:
        polyline.setOffset(-8);
        break;
        case 6:
        polyline.setOffset(12);
        break;
        case 7:
        polyline.setOffset(-12);
        break;
        case 8:
        polyline.setOffset(16);
        break;
        case 9:
        polyline.setOffset(-16);
        break;
    }
}

function checkForUndergroundSection(undergroundProperty, polyline) {
    if(undergroundProperty == "yes") {
        polyline.setStyle({dashArray: 6});
    }
}

function lnglatTolatlng(array) {
    var swappedArray = [];
    for(var i = 0; i < array.length; i++) {
        var coordsArray1 = array[i];
        var coordsArray2 = [];
        var lng = coordsArray1[0];
        var lat = coordsArray1[1];
        coordsArray2.push(lat);
        coordsArray2.push(lng);
        swappedArray.push(coordsArray2);
    }
    return swappedArray;
}

function occurencesInArray(entry, array) {
    var counter = 0;
    for(var i = 0; i < array.length; i++) {
        if(array[i] == entry) {
            counter++;
        }
    }
    return counter;
}

function createLegend(usedFeatures) {
    var legend = L.control({position: 'topright'});

    legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend');

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < usedFeatures.length; i++) {
        div.innerHTML +=
            '<i style="background:' + usedFeatures[i].properties.lineColor + '"></i> ' +
            usedFeatures[i].properties.lineName + "<br>";
    }

    return div;
    };

    legend.addTo(mymap);
}

function destroyLegend() {
    $(".legend").remove();
}