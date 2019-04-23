var slider = document.getElementById("yearSlider"); // Bind range slider to var
var output = document.getElementById("outputYear"); // Bind year output span to var
output.innerHTML = slider.value; //Bind year output to value of the range slider

var bounds = [
    [51.09489803482296, 6.440985107421875], // Southwest coordinates as bound for the map
    [51.554434786162615, 7.1085906982421875]  // Northeast coordinates as bound for the map
];

var mymap = L.map('map').setView([51.218, 6.817], 12); //Create map object in div and define view and zoom

L.tileLayer('https://api.mapbox.com/styles/v1/drjones7495/cjhbwihgi0kbc2smken45ctfc/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZHJqb25lczc0OTUiLCJhIjoiY2poYnI5d3NyMDUzcDMwcGRwN3l5cnV2biJ9.y2p2i2YCVH_smOxjpvT5yg', {
    attribution: 'Map data © <a href="© <a href="https://www.mapbox.com/map-feedback/"">Mapbox</a>',
    minZoom: 11,
    accessToken: 'pk.eyJ1IjoiZHJqb25lczc0OTUiLCJhIjoiY2poYnI5d3NyMDUzcDMwcGRwN3l5cnV2biJ9.y2p2i2YCVH_smOxjpvT5yg'
}).addTo(mymap); //Add Mapbox tile layer to the map object

mymap.setMaxBounds(bounds); //Use setted bounds on the map

L.geoJSON(stadtgrenze, {
    style: {"color": "#000", "fillOpacity": "0", "interactive": false}
}).addTo(mymap); //Add city borders to the map

var allLines = L.featureGroup(); //Initialize a Leaflet FeatureGroup that will take all line layers

var usedSectionIDs = []; //Initialize an array for keeping count of the used sections so that an offset can be added to sections that are already in use

var usedFeatures, numberOfLines, lengthAllLines = 0; //Initialize variables to keep count of the used features, the number of lines in the map and the summed length of all lines

var timer = null, interval = 1000, timerIsActive = false; //Initialize variables for the play animation of the map

var zIndex1Lines = []; //Initialize an array for all lines that will be shown with z-index 1
var zIndex2Lines = []; //Initialize an array for all lines that will be shown with z-index 2
var zIndex3Lines = []; //Initialize an array for all lines that will be shown with z-index 3

$(".slider").on('input', function(){
    output.innerHTML = this.value; //Change year output to value of range slider
    drawLines(); //Fire function that integrates all lines
});

$(".slider").click(function(){
    if (timerIsActive) {
        clearInterval(timer);
        timer = null; //Stop play animation when range slider is clicked
        $("#stopButton").attr("id","playButton");
        initPlayButton(); //Reset play animation by changing button to play again and giving that play button its functions
    }
})

drawLines(); //Fire function that integrates all lines so that the user already sees the lines when opening the website for the first time

// function getAllFeatureCollectionsFromGeoJSON (array) {
//     		var collectionArray = array;
//     		return collectionArray;
//     	}

// function getFeatureCollectionFromCollectionArray(array, collection) {
//     for(var i = 0; i < array.length; i++) {
//     	if(array[i].name == collection) {
//     		return array[i];
//     	} else {
//     		console.log("Das Array enthält die FeatureCollection " + collection + " nicht.")
//     	}
//     }
// }

// function getAllFeaturesFromFeatureCollection(collection) {
// 	var featureArray = [];
// 	turf.featureEach(collection, function(currentFeature) {
//     	featureArray.push(currentFeature);
//     })
//     return featureArray;
// }

// function getFeatureFromFeatureCollection(collection, feature) {
// 	var foundFeature;
// 	turf.propEach(collection, function(currentProperties, featureIndex) {
// 		if(currentProperties.lineName == feature) {
//     		foundFeature = collection.features[featureIndex];
//     	} else {
//     		console.log("Die FeatureCollection " + collection + " enthält das Feature " + feature + " nicht.");
//     	}
// 	})
// 	return foundFeature;
// } Functions not used in current version

function getAllGeometriesFromFeature(feature) { //Return an array of all geometries in a GeoJSON feature
	var geometryArray = [];
	turf.geomEach(feature, function(currentFeature) {
    	geometryArray.push(currentFeature);
    })
	return geometryArray;
}

// function getSpecificGeometryFromFeature(feature, geometryID) { 
// 	var geometry;
//     turf.geomEach(feature, function(currentGeometry) {
//     	if(currentGeometry.sectionID == geometryID) {
//     		geometry = currentGeometry;
// 		}
// 	})
// 	return geometry;
// } Function not used in current version

function getUsedFeaturesFromGeoJSON(array) { //Return an array of GeoJSON features that need to be included in the map at the given time
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

// function getGeometriesFromUsedFeatures(array) {
//     var geometryArray = [];
//     var geometryFeature;
//     for(var i = 0; i < array.length ; i++) {
//         turf.geomEach(array[i], function(currentGeometry) {
//             geometryFeature = turf.feature(currentGeometry, array[i].properties);
//             geometryArray.push(geometryFeature);
//         })
//     }
//     return geometryArray;
// } Function not used in current version

// function getIDsFromGeometryArray(array) {
//     var idArray = [];
//     for(var i = 0; i < array.length; i++) {
//         idArray.push(array[i].geometry.sectionID);
//     }
//     return idArray;
// } Function not used in current version

// function getCoordsFromGeometryArray(array) {
//     var coords = [];
//     for(var i = 0; i < array.length; i++) {
//         coords.push(turf.getCoords(array[i]));
//     }
//     return coords;
// } Function not used in current version

function addOnClickToFeature(feature, layer) { //Add an onClick function to a layer that will add information to the site
    if (feature.properties && feature.properties.lineName && feature.properties.station1 && feature.properties.station2) {
        layer.on("click",  function() {changeContentSection(feature);});
    }
}

function changeContentSection(feature) { //Show the content section on the right site of the application and fire functions to fill it with content
    $("#infoDiv").css("display", "block")
    changeTitleDiv(feature);
    changeInfoTable(feature);
    changeImgDiv(feature);
}

function changeTitleDiv(feature) { //Change the title of the content section to the name of the clicked line and its final stops
    $("#titleDiv h2").text(feature.properties.lineName + ": " + feature.properties.station1 + " ↔ " + feature.properties.station2);
}

function changeInfoTable(feature) { //Fill the info table with information regarding the flicked line
    $("#lineNameValue").text(feature.properties.lineType);
    $("#lineLengthValue").text(turf.length(feature, {units: 'kilometers'}).toFixed(2) + " km");
    $("#station1Value").text(feature.properties.station1);
    $("#station2Value").text(feature.properties.station2);
    $("#activeFromToValue").text(feature.properties.startYear + " und " + feature.properties.endYear);
    $("#operatorValue").text(feature.properties.operator);
}

function changeImgDiv(feature) { //Fill image div of the content section with images if there are images for the clicked line
    destroyImgDiv(); //Remove all content from the div aka images of formerly clicked line

    var imgArray = [];
    var imgDiv = document.getElementById("imageDiv");

    imgArray = getImagesForFeature(feature, images); //Fill array with images for the line

    for (var i = 0; i < imgArray.length; i++) {
        var imgPath = "'" + imgArray[i].imgPath + "'";
        var imgID = "'" + imgArray[i].imgID + "'";
        imgDiv.innerHTML +=
            '<div class="linePicture"><img class="lineImg" onClick="openInLightBox(' + imgID + ')" src=' + imgArray[i].imgPath + '><div class="imageDescription">' + imgArray[i].imgDescription + ' (' +  imgArray[i].imgYear + ')</div>';
    }

}

function destroyImgDiv() { //Remove all content from the image div
    $("#imageDiv").empty();
}

function getImagesForFeature(feature, images) { //Return all images that should be shown for the given line
    var imgArray = [];

    for (var i = 0; i < images.length; i++) {
        if (images[i].usedForLines.includes(feature.properties.lineID)) {
            imgArray.push(images[i]);
        }
    } 

    return imgArray;
}

function checkYear(feature) { //Check if a given feature should be shown on the map at the given time
    var featureStartYear = parseInt(feature.properties.startYear);
    var featureEndYear = parseInt(feature.properties.endYear);
    var sliderYear = parseInt(slider.value);
    if (featureStartYear <= sliderYear && featureEndYear > sliderYear) {
        return true;
    } else {
        return false;
    }
}


function drawLines() { //Add all lines that need to be added to the map

    if (allLines != undefined) { //Reset the feature group that takes all features in
        allLines.clearLayers();
    };
    destroyLegend(); //Remove legend so it can be refilled with updated info

    usedFeatures = getUsedFeaturesFromGeoJSON(lines); //Get all features that need to be included from lines.js

    zIndex1Lines = []; //Reset the z-index arrays
    zIndex2Lines = [];
    zIndex3Lines = [];

    for(var i = 0; i < usedFeatures.length; i++) { //Add each feature to the allLines feature group
        drawGeoJSONFeature(usedFeatures[i]);
    }

    bringFeatureGroupsToFront(zIndex1Lines);
    bringFeatureGroupsToFront(zIndex2Lines);
    bringFeatureGroupsToFront(zIndex3Lines); //Bring all lines on the map in the right order given on their z-indices

    usedSectionIDs = []; //Reset used sections array for next usage

    allLines.addTo(mymap); //Add the feature group to the map
    createLegend(usedFeatures); //Create a legend based on the used features
    setLengthOfLines(); //Set length of lines info
    setNumberOfLines(usedFeatures.length); //Set number of lines info

    usedFeatures = null; //Reset used features for next usage
}

function drawGeoJSONFeature(feature) {
    var featureGroup = L.featureGroup(); //Create feature group to take all layers of the feature
    var geometryArray = getAllGeometriesFromFeature(feature); //Get all geometries of the given feature
    lengthAllLines += turf.length(feature, {units: 'kilometers'}); //Add the length of the feature to the length of all lines var

    for(var i = 0; i < geometryArray.length; i++) { //Apply all following functions on each geometry of the feature
        if(!usedSectionIDs.includes(geometryArray[i].sectionID)) { //Check if the given geometry has already been used while processing another feature
            usedSectionIDs.push(geometryArray[i].sectionID); //Add the id of the geometry to the 'already used array'
            var coords = turf.getCoords(turf.flip(geometryArray[i])); //Get the coords of the geometry
            var layer = L.polyline(coords, {color: feature.properties.lineColor, weight: 4, smoothFactor: 1, className: feature.properties.lineName}).addTo(featureGroup); //Create a polyline based on the geometry
            checkForUndergroundSection(geometryArray[i].underground, layer); //check if the polyline should be shown as an underground section
            checkForHorseTram(feature, layer); //check if feature represents a horse tram line and change style of polyline if so
            addOnClickToFeature(feature, layer); //Add the onClick function to the polyline
            layer.addTo(featureGroup); //Add the polyline to the feature group of the whole line
        } else {
            usedSectionIDs.push(geometryArray[i].sectionID); //same as above
            var coords = turf.getCoords(turf.flip(geometryArray[i]));
            var idInArray = occurencesInArray(geometryArray[i].sectionID, usedSectionIDs);
            var layer = L.polyline(coords, {color: feature.properties.lineColor, weight: 4, smoothFactor: 1, className: feature.properties.lineName}).addTo(featureGroup);
            sectionInMultipleLines(idInArray, layer); //Create an offset for the polyline so that it doesnt interfere with other polyline on the stretch
            checkForUndergroundSection(geometryArray[i].underground, layer);
            checkForHorseTram(feature, layer);
            addOnClickToFeature(feature, layer);
            layer.addTo(featureGroup);
        }
    }
    featureGroup.addTo(allLines); //Add the completed feature group of the lines to the feature group of all lines
    sortIntoZIndexGroup(featureGroup, feature); //Sort the feature group into a z-index group based on its z-index
}

function sortIntoZIndexGroup (featureGroup, feature) { //Push a feature group to a z-index group based on its z-index
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

function sectionInMultipleLines(occurencesInArray, polyline) { //Give an offset to a polyline based on how often the geometry it's based on has been used already
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

function checkForUndergroundSection(undergroundProperty, polyline) { //Change the style of a polyline if it represents an underground stretch
    if(undergroundProperty == "yes") {
        polyline.setStyle({dashArray: 6});
    }
}

function checkForHorseTram(feature, polyline) { //Change the style of a polyline if its part of a horse tram line
    if(feature.properties.lineType == "Pferdebahn") {
        polyline.setStyle({dashArray: 6});
    }
}

// function lnglatTolatlng(array) {
//     var swappedArray = [];
//     for(var i = 0; i < array.length; i++) {
//         var coordsArray1 = array[i];
//         var coordsArray2 = [];
//         var lng = coordsArray1[0];
//         var lat = coordsArray1[1];
//         coordsArray2.push(lat);
//         coordsArray2.push(lng);
//         swappedArray.push(coordsArray2);
//     }
//     return swappedArray;
// } Function not used in current version

function occurencesInArray(entry, array) { //Check how many times an entry is included in an array
    var counter = 0;
    for(var i = 0; i < array.length; i++) {
        if(array[i] == entry) {
            counter++;
        }
    }
    return counter;
}

function createLegend(usedFeatures) { //Create a legend for the map
    var legend = L.control({position: 'topright'});

    legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend');
    div.innerHTML += "<h3>Legende</h3>";

    var intLines = []; //Initialize an array to take all lines whose line description is a number
    var stringLines = []; //Initialize an array to take all lines whose line description starts with a letter
    var tramBool = false; //Initialize a boolean that checks if a tram is represented in the map
    var undBool = false; //Initialize a boolean that checks if a underground stretch is represented in the map
    var horseBool = false; //Initialize a boolean that checks if a horse tram is represented in the map

    for (var i=0; i < usedFeatures.length; i++) {
        if (usedFeatures[i].properties.lineType == "Straßenbahn") {
            tramBool = true;
        } else if (usedFeatures[i].properties.lineType == "Pferdebahn") {
            horseBool = true;
        } else if (usedFeatures[i].properties.lineType == "Stadtbahn (mit U-Strecke)") {
            undBool = true;
        }
    }

    divideIntLinesAndStringLines(usedFeatures, intLines, stringLines); //Divide represented lines into lines that start with a number and lines that start with a character

    intLines.sort(function(a, b){return a.properties.lineName - b.properties.lineName}); //Sort the lines that start with a number
    stringLines.sort(function(a, b) { //Sort the lines that start with a letter
        if ( a.properties.lineName < b.properties.lineName){
            return -1;
        }
        if ( a.properties.lineName> b.properties.lineName ){
            return 1;
        }
        return 0;
    });

    for (var i = 0; i < intLines.length; i++) { //Add an entry to the legend including the line color and the line name
        div.innerHTML +=
            '<i style="background:' + intLines[i].properties.lineColor + '"></i> ' +
            intLines[i].properties.lineName + "<br>";
    }

    for (var i = 0; i < stringLines.length; i++) {
        div.innerHTML +=
            '<i style="background:' + stringLines[i].properties.lineColor + '"></i> ' +
            stringLines[i].properties.lineName + "<br>";
    }

    div.innerHTML += "<br><br>";

    if (horseBool) { //Add an entry to the legend explaining the difference between trams and horse trams if horse trams are represented
        div.innerHTML += '<i><svg width="18px" height="18px"><rect width="18px" height="3px" y="7.5" style="fill: rgb(50,50,50);""></svg></i>Elektr. Straßenbahn<br>';
        div.innerHTML += '<i><svg width="18px" height="18px"><rect width="4" height="3px" y="7.5" style="fill: rgb(50,50,50);" /><rect width="4" height="3px" x="7" y="7.5" style="fill: rgb(50,50,50);" /><rect width="4" height="3px" x="14" y="7.5" style="fill: rgb(50,50,50);" /></svg></i>Pferdebahn<br>'
    } else if (tramBool && undBool) { //Add an entry to the legend explaining the difference between overground and underground stretches if both are represented
        div.innerHTML += '<i><svg width="18px" height="18px"><rect width="18px" height="3px" y="7.5" style="fill: rgb(50,50,50);""></svg></i>Oberirdisch<br>';
        div.innerHTML += '<i><svg width="18px" height="18px"><rect width="4" height="3px" y="7.5" style="fill: rgb(50,50,50);" /><rect width="4" height="3px" x="7" y="7.5" style="fill: rgb(50,50,50);" /><rect width="4" height="3px" x="14" y="7.5" style="fill: rgb(50,50,50);" /></svg></i>Unterirdisch<br>'
    }

    return div;
    };

    legend.addTo(mymap); //Add the legend to the map
}

function destroyLegend() { //Remove the legend from the map
    $(".legend").remove();
}

function divideIntLinesAndStringLines(usedLines, intLines, stringLines) { //Divide represented lines into lines that start with a number and lines that start with a character
    for (var i = 0; i < usedLines.length; i++) {
        if (/\d/.test(usedLines[i].properties.lineName.charAt(0)) == true) {
            var int = usedLines[i];
            parseInt(int.properties.lineName);
            intLines.push(int);
        } else {
            stringLines.push(usedLines[i]);
        }
    }
}

// function sortUsedLines(usedLines) {
//     usedLines.sort();
// }

function setNumberOfLines(lineArray) { //Set the number of lines info in the application
    lineNumber.innerHTML = lineArray;
}

function setLengthOfLines() { //Set the legnth of all lines info in the application
    lineLengthSum.innerHTML = lengthAllLines.toFixed(2) + " km";
    lengthAllLines = 0;
}

function getImgFromID(id) { //Return an image entry from images.js based on a given id
    var img;

    for (var i = 0; i < images.length; i++) {
        if (images[i].imgID == id) {
            img = images[i];
        }
    }

    return img;
}

function openInLightBox(imgID) { //onClick function for images to open them in a light box for better view
    $("#imgInfo").text("")
    var img = getImgFromID(imgID); //Get the img from images.js based on the id
    var modalImageContainer = document.getElementById("modalImageContainer");
    modalImageContainer.innerHTML += '<img id="modalImage" src=' + img.imgPath + '>'; //Integrate the img into the light box
    $(".modal").css("display", "block"); //Show the light box
    var modalImage = document.getElementById('modalImage'); 
    var width = modalImage.clientWidth;
    var height = modalImage.clientHeight;
    $(".modal-content").css("width", width); //Set the correct width for the img
    $(".modal-content").css("height", height + 32); //Set the correct height for the img
    $("#imgInfo").text(img.imgDescription + " (" + img.imgYear + "). Quelle: " + img.imgSourceAuthor + ". " + img.imgSource + ", " + img.imgSourcePage + ". Urheber: " + img.imgCredit + "."); //Add further information on the img to the light box
}

$(".close").click(function() { //Add an onclick function to the close button in the light box
    $(".modal").css("display", "none");
    $("#modalImage").remove();
})

window.onclick = function(event) { //Set an onclick function to the window object to close the light box
  if (event.target == document.getElementById('modal')) {
    document.getElementById('modal').style.display = "none";
    $("#modalImage").remove();
  }
}

$("#backwardButton").click(function() { //Add an onclick function to the backward button to jump back 1 year in time
    if (timerIsActive) { //Stop the play animation if active
        clearInterval(timer);
        timer = null;
        $("#stopButton").attr("id","playButton");
        initPlayButton();
    }
    var value = parseInt($(".slider").val());
    value -= 1;
    $(".slider").val(value);
    $(".slider").trigger("input");
})

$("#forwardButton").click(function() { //Add an onclick function to the forward button to go on 1 year in time
    if (timerIsActive) { //Stop the play animation if active
        clearInterval(timer);
        timer = null;
        $("#stopButton").attr("id","playButton");
        initPlayButton();
    }
    var value = parseInt($(".slider").val());
    value += 1;
    $(".slider").val(value);
    $(".slider").trigger("input");
})

$("#playButton").click(function() { //Add an onclick function to the play button that will start the play animation
    var value = parseInt($(".slider").val()); //Get the currently shown year
    var max = $(".slider").attr("max"); //Get the maximum of the range slider aka the present
    if (timer !== null || value >= max) return; //Don't do anything if the animations is already running or the slider is already at the maximum
    timerIsActive = true;
    $(this).attr("id","stopButton"); // change the play button into the stop button
    initStopButton(); //initialize the functions of the stop button
    if (value < max) {
        timer = setInterval(function () { //Start the animation with a given interval
            if ($(".slider").val() == max) { //Stop the animation when the slider reaches its maximum
                clearInterval(timer);
                timer = null;
                $("#stopButton").attr("id","playButton"); // change the stop button into the play button
                initPlayButton(); //initialize the functions of the play button
            } else { //Raise the value of the slider every second
            value += 1;
            $(".slider").val(value);
            $(".slider").trigger("input");
            }   
        }, interval); 
    }
})

function initStopButton() { //Initialize the functions of the stop button
    $("#stopButton").click(function() {
        $(this).attr("id","playButton");
        initPlayButton();
        timerIsActive = false;
        clearInterval(timer); //Stop the animation
        timer = null
    });
}

function initPlayButton() {
    $("#playButton").click(function() {
    var value = parseInt($(".slider").val());
    var max = $(".slider").attr("max");
    if (timer !== null || value >= max) return;
    timerIsActive = true;
    $(this).attr("id","stopButton");
    initStopButton();
    if (value < max) {
        timer = setInterval(function () {
            if ($(".slider").val() == max) {
                clearInterval(timer);
                timer = null;
                $("#stopButton").attr("id","playButton");
                initPlayButton();
            } else {
            value += 1;
            $(".slider").val(value);
            $(".slider").trigger("input");
            }   
        }, interval); 
    }
})
}