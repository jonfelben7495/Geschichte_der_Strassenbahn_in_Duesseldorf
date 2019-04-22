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
    style: {"color": "#000", "fillOpacity": "0", "interactive": false}
}).addTo(mymap);

var allLines = L.featureGroup();

var usedSectionIDs = [];

var usedFeatures, numberOfLines, lengthAllLines = 0;

var timer = null, interval = 1000, timerIsActive = false;

var zIndex1Lines = [];
var zIndex2Lines = [];
var zIndex3Lines = [];

$(".slider").on('input', function(){
    output.innerHTML = this.value;
    drawLines();
});

$(".slider").click(function(){
    if (timerIsActive) {
        clearInterval(timer);
        timer = null;
        $("#stopButton").attr("id","playButton");
        initPlayButton();
    }
})

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

function addOnClickToFeature(feature, layer) {
    if (feature.properties && feature.properties.lineName && feature.properties.station1 && feature.properties.station2) {
        layer.on("click",  function() {changeContentSection(feature);});
    }
}

function changeContentSection(feature) {
    $("#infoDiv").css("display", "block")
    changeTitleDiv(feature);
    changeInfoTable(feature);
    changeImgDiv(feature);
}

function changeTitleDiv(feature) {
    $("#titleDiv h2").text(feature.properties.lineName + ": " + feature.properties.station1 + " ↔ " + feature.properties.station2);
}

function changeInfoTable(feature) {
    $("#lineNameValue").text(feature.properties.lineType);
    $("#lineLengthValue").text(turf.length(feature, {units: 'kilometers'}).toFixed(2) + " km");
    $("#station1Value").text(feature.properties.station1);
    $("#station2Value").text(feature.properties.station2);
    $("#activeFromToValue").text(feature.properties.startYear + " und " + feature.properties.endYear);
    $("#operatorValue").text(feature.properties.operator);
}

function changeImgDiv(feature) {
    destroyImgDiv();

    var imgArray = [];
    var imgDiv = document.getElementById("imageDiv");

    imgArray = getImagesForFeature(feature, images);

    for (var i = 0; i < imgArray.length; i++) {
        var imgPath = "'" + imgArray[i].imgPath + "'";
        var imgID = "'" + imgArray[i].imgID + "'";
        imgDiv.innerHTML +=
            '<div class="linePicture"><img class="lineImg" onClick="openInLightBox(' + imgID + ')" src=' + imgArray[i].imgPath + '><div class="imageDescription">' + imgArray[i].imgDescription + ' (' +  imgArray[i].imgYear + ')</div>';
    }

}

function destroyImgDiv() {
    $("#imageDiv").empty();
}

function getImagesForFeature(feature, images) {
    var imgArray = [];

    for (var i = 0; i < images.length; i++) {
        if (images[i].usedForLines.includes(feature.properties.lineID)) {
            imgArray.push(images[i]);
        }
    } 

    return imgArray;
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

    if (allLines != undefined) {
        allLines.clearLayers();
    };
    destroyLegend();

    usedFeatures = getUsedFeaturesFromGeoJSON(lines);

    zIndex1Lines = [];
    zIndex2Lines = [];
    zIndex3Lines = [];

    for(var i = 0; i < usedFeatures.length; i++) {
        drawGeoJSONFeature(usedFeatures[i]);
    }

    console.log(lengthAllLines);

    bringFeatureGroupsToFront(zIndex1Lines);
    bringFeatureGroupsToFront(zIndex2Lines);
    bringFeatureGroupsToFront(zIndex3Lines);

    usedSectionIDs = [];

    allLines.addTo(mymap);
    createLegend(usedFeatures);
    setLengthOfLines();
    setNumberOfLines(usedFeatures.length);

    usedFeatures = null;
}

function drawGeoJSONFeature(feature) {
    var featureGroup = L.featureGroup();
    var geometryArray = getAllGeometriesFromFeature(feature);
    debugger;
    lengthAllLines += turf.length(feature, {units: 'kilometers'});

    for(var i = 0; i < geometryArray.length; i++) {
        if(!usedSectionIDs.includes(geometryArray[i].sectionID)) {
            usedSectionIDs.push(geometryArray[i].sectionID);
            var coords = turf.getCoords(turf.flip(geometryArray[i]));
            var layer = L.polyline(coords, {color: feature.properties.lineColor, weight: 4, smoothFactor: 1, className: feature.properties.lineName}).addTo(featureGroup);
            checkForUndergroundSection(geometryArray[i].underground, layer);
            checkForHorseTram(feature, layer);
            addOnClickToFeature(feature, layer);
            layer.addTo(featureGroup);
        } else {
            usedSectionIDs.push(geometryArray[i].sectionID);
            var coords = turf.getCoords(turf.flip(geometryArray[i]));
            var idInArray = occurencesInArray(geometryArray[i].sectionID, usedSectionIDs);
            var layer = L.polyline(coords, {color: feature.properties.lineColor, weight: 4, smoothFactor: 1, className: feature.properties.lineName}).addTo(featureGroup);
            sectionInMultipleLines(idInArray, layer);
            checkForUndergroundSection(geometryArray[i].underground, layer);
            checkForHorseTram(feature, layer);
            addOnClickToFeature(feature, layer);
            layer.addTo(featureGroup);
        }
    }
    featureGroup.addTo(allLines);
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

function checkForHorseTram(feature, polyline) {
    if(feature.properties.lineType == "Pferdebahn") {
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
    div.innerHTML += "<h3>Legende</h3>";

    var intLines = [];
    var stringLines = [];
    var tramBool = false;
    var undBool = false;
    var horseBool = false;

    for (var i=0; i < usedFeatures.length; i++) {
        if (usedFeatures[i].properties.lineType == "Straßenbahn") {
            tramBool = true;
        } else if (usedFeatures[i].properties.lineType == "Pferdebahn") {
            horseBool = true;
        } else if (usedFeatures[i].properties.lineType == "Stadtbahn (mit U-Strecke)") {
            undBool = true;
        }
    }

    divideIntLinesAndStringLines(usedFeatures, intLines, stringLines);

    intLines.sort(function(a, b){return a.properties.lineName - b.properties.lineName});
    stringLines.sort(function(a, b) {
        if ( a.properties.lineName < b.properties.lineName){
            return -1;
        }
        if ( a.properties.lineName> b.properties.lineName ){
            return 1;
        }
        return 0;
    });

    for (var i = 0; i < intLines.length; i++) {
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

    if (horseBool) {
        div.innerHTML += '<i><svg width="18px" height="18px"><rect width="18px" height="3px" y="7.5" style="fill: rgb(50,50,50);""></svg></i>Elektr. Straßenbahn<br>';
        div.innerHTML += '<i><svg width="18px" height="18px"><rect width="4" height="3px" y="7.5" style="fill: rgb(50,50,50);" /><rect width="4" height="3px" x="7" y="7.5" style="fill: rgb(50,50,50);" /><rect width="4" height="3px" x="14" y="7.5" style="fill: rgb(50,50,50);" /></svg></i>Pferdebahn<br>'
    } else if (tramBool && undBool) {
        div.innerHTML += '<i><svg width="18px" height="18px"><rect width="18px" height="3px" y="7.5" style="fill: rgb(50,50,50);""></svg></i>Oberirdisch<br>';
        div.innerHTML += '<i><svg width="18px" height="18px"><rect width="4" height="3px" y="7.5" style="fill: rgb(50,50,50);" /><rect width="4" height="3px" x="7" y="7.5" style="fill: rgb(50,50,50);" /><rect width="4" height="3px" x="14" y="7.5" style="fill: rgb(50,50,50);" /></svg></i>Unterirdisch<br>'
    }

    return div;
    };

    legend.addTo(mymap);
}

function destroyLegend() {
    $(".legend").remove();
}

function divideIntLinesAndStringLines(usedLines, intLines, stringLines) {
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

function sortUsedLines(usedLines) {
    usedLines.sort();
}

function setNumberOfLines(lineArray) {
    lineNumber.innerHTML = lineArray;
}

function setLengthOfLines() {
    console.log(lengthAllLines);
    lineLengthSum.innerHTML = lengthAllLines.toFixed(2) + " km";
    lengthAllLines = 0;
}

function getImgFromID(id) {
    var img;

    for (var i = 0; i < images.length; i++) {
        if (images[i].imgID == id) {
            img = images[i];
        }
    }

    return img;
}

function openInLightBox(imgID) {
    $("#imgInfo").text("")
    var img = getImgFromID(imgID);
    var modalImageContainer = document.getElementById("modalImageContainer");
    modalImageContainer.innerHTML += '<img id="modalImage" src=' + img.imgPath + '>';
    $(".modal").css("display", "block");
    var modalImage = document.getElementById('modalImage'); 
    var width = modalImage.clientWidth;
    var height = modalImage.clientHeight;
    $(".modal-content").css("width", width);
    $(".modal-content").css("height", height + 32);
    $("#imgInfo").text(img.imgDescription + " (" + img.imgYear + "). Quelle: " + img.imgSourceAuthor + ". " + img.imgSource + ", " + img.imgSourcePage + ". Urheber: " + img.imgCredit + ".");
}

$(".close").click(function() {
    $(".modal").css("display", "none");
    $("#modalImage").remove();
})

window.onclick = function(event) {
  if (event.target == document.getElementById('modal')) {
    document.getElementById('modal').style.display = "none";
    $("#modalImage").remove();
  }
}

$("#backwardButton").click(function() {
    if (timerIsActive) {
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

$("#forwardButton").click(function() {
    if (timerIsActive) {
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

function initStopButton() {
    $("#stopButton").click(function() {
        $(this).attr("id","playButton");
        initPlayButton();
        timerIsActive = false;
        clearInterval(timer);
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