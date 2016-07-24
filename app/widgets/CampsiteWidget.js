define([
    "dojo/_base/declare",
    'dojo/_base/lang',
    'dojo/on',
    'dojo/dom',
    'dojo/dom-construct',
    'dojo/_base/array',
    'dojo/request',

    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    'dojo/text!/widgets/templates/CampsiteWidget.html',
    "xstyle!/widgets/css/CampsiteWidget.css",

    'esri/map',
    "esri/dijit/Search",
    "esri/dijit/LocateButton",

    "esri/layers/FeatureLayer",
    "esri/layers/GraphicsLayer",

    "esri/renderers/SimpleRenderer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    "esri/graphic",
    "esri/graphicsUtils",


    "esri/tasks/BufferParameters",
    "esri/tasks/GeometryService",
    "esri/tasks/QueryTask",
    "esri/tasks/query",

    "esri/geometry/Extent",

    "esri/InfoTemplate",
    "esri/geometry/webMercatorUtils",
    "dojo/domReady!",


], function(
    declare,
    lang,
    on,
    dom,
    domConstruct,
    array,
    request,

    _WidgetBase,
    _TemplatedMixin,
    template,
    css,

    Map,
    Search,
    LocateButton,

    FeatureLayer,
    GraphicsLayer,

    SimpleRenderer,
    SimpleMarkerSymbol,
    SimpleFillSymbol,
    SimpleLineSymbol,
    Color,
    Graphic,
    graphicsUtils,

    BufferParameters,
    GeometryService,
    QueryTask,
    Query,

    Extent,


    InfoTemplate,
    webMercatorUtils


) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        selectionColor: new Color([93, 191, 63]),
        renderColor: new Color([255, 153, 51]),
        bufferValue: 20,
        panelIds: ["parks-list", "park-detail", "campsites-list"],
        apiUrl: "//aaronp.esri.com:5000/api",

        constructor: function(options) {
            this.domNode = options.domNode || "campsite-widget-bar";

            this.parksList = dom.byId("parks-list");
            this.parkDetail = dom.byId("park-detail");
            this.campsitesList = dom.byId("campsites-list");
            this.bufferInput = dom.byId("bufferSize");

            this.panels = {
                "parks-list": {
                    sidebarHTML: "Selected Parks",
                    node: this.parksList
                },
                "park-detail": {
                    node: this.parkDetail
                },
                "campsites-list": {
                    node: this.campsitesList
                }
            };

            this.sidebarTitle = dom.byId("sidebar-title");
            this.selectedFeatures = {};

            this.inherited(arguments);
        },

        startup: function() {
            // Create sidebar
            this.createSidebar();

            // Create map
            this.map = new Map("mapDiv", {
                basemap: "topo",
                center: [-122.69, 45.52],
                zoom: 3
            });

            this.geomService = new GeometryService("https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");

            this.addLayersToMap();

            this.initMapWidgets();
        },

        addLayersToMap: function() {
            var infoTemplate = new InfoTemplate({
                title: "${Name}",
                content: "${*}"
            });
            this.campSiteLayer = new FeatureLayer("http://dev002023.esri.com/arcgis/rest/services/Parks/Parks/MapServer/0", {
                // this.campSiteLayer = new FeatureLayer("http://services.arcgis.com/dkFz166a8Pp3vBsS/arcgis/rest/services/SurveyParks2Me/FeatureServer/0", {
                id: "campSiteLayer",
                infoTemplate: infoTemplate,
                outFields: ["*"],
                mode: FeatureLayer.MODE_ONDEMAND
            });
            this.campSiteLayer.setRenderer(new SimpleRenderer(new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 5, null, this.renderColor)));
            this.campSiteLayer.setSelectionSymbol(new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 5, null, this.selectionColor));
            this.map.addLayer(this.campSiteLayer);

            on(this.campSiteLayer, "click", lang.hitch(this, this.selectSingleFeature));
        },

        initMapWidgets: function() {
            var search = new Search({
                map: this.map
            }, "search");
            search.startup();

            on(search, "select-result", lang.hitch(this, function(event) {
                var feature = event.result;
                this.drawbuffer(feature.geometry);
            }));

            var locate = new LocateButton({
                map: this.map
            }, "locateButton");
            locate.startup();

            on(locate, "locate", lang.hitch(this, function(event) {
                // console.log(event);
                this.drawBuffer(event.graphic.geometry);
            }))
        },

        createSidebar: function() {

        },

        drawBuffer: function(position) {
            this.startingLocation = position;
            var bufferRadius = this.bufferInput.value;
            var bufferParams = new BufferParameters();
            bufferParams.geometries = [position];
            bufferParams.distances = [bufferRadius];
            bufferParams.unit = GeometryService.UNIT_NAUTICAL_MILE;
            bufferParams.outSpatialReference = this.map.spatialReference;

            this.geomService.buffer(bufferParams, lang.hitch(this, function(bufferGeoms) {
                // console.log(bufferGeoms);
                if (this.graphicsLayer == 'undefined' || this.graphicsLayer == null) {
                    this.graphicsLayer = new GraphicsLayer();
                    this.map.addLayer(this.graphicsLayer);
                }
                this.graphicsLayer.clear();
                // Query where layer intersects buffer grpaghic geometry
                var queryTask = new QueryTask("http://services.arcgis.com/dkFz166a8Pp3vBsS/arcgis/rest/services/SurveyParks2Me/FeatureServer/0");
                var query = new Query();
                query.geometry = bufferGeoms[0];
                query.outSpatialReference = this.map.spatialReference;
                query.returnGeometry = false;
                query.outFields = ["OBJECTID"];
                queryTask.execute(query, lang.hitch(this, this.addFeaturesToMapAndSidebar));

                // Create buffer graphic
                var graphic = new Graphic(bufferGeoms[0], new SimpleFillSymbol(
                    SimpleFillSymbol.STYLE_NULL,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, this.selectionColor, 2),
                    null
                ));
                this.graphicsLayer.add(graphic);
                var extent = graphicsUtils.graphicsExtent([graphic]);
                this.map.setExtent(extent);
            }));
        },

        addFeaturesToMapAndSidebar: function(results) {
            console.log(results);
            // Use ids to get more complete results from aaron's api
            var startingLoc = this.startingLocation.x + "," + this.startingLocation.y;
            var oids = array.map(results.features, function(feature) {
                return feature.attributes.OBJECTID;
            });
            var requestUrl = this.apiUrl + "/campsites/?startingLoc=" + startingLoc + "&fids=" + oids.join(",");
            request.get(requestUrl, {
                headers: {
                    "X-Requested-With": "",
                    "Access-Control-Allow-Origin": ""
                },
                content: {
                    f: "json"
                }
            }).then(lang.hitch(this, function(results) {
                // mute layer
                this.campSiteLayer.hide();
                // Select points on campsite layer
                this.campSiteLayer.clearSelection();
                // TODO: add query for select features
                // var query = new Query();
                // var where = "OBJECTID in [" + oids.join(",") + "]";
                // query.outFields = ["*"];
                // this.campSiteLayer.selectFeatures(query);
                this.clearParksList();
                results = JSON.parse(results);
                for (var index in results.parks) {
                    var park = results.parks[index];
                    // Add features info to parks-list sidebar
                    var name = park.attributes.Name;
                    var addr = park.attributes.State;
                    var oid = park.attributes.OBJECTID;
                    var parkCardHtml = '<div style="float:none">\
                                <p class="parkname">' + name + '</p>\
                                <p class="distance">3miles</p>\
                            </div>\
                            <div style="clear: both;"></div>\
                            <div>\
                                <p class="address">' + addr + '</p>\
                            </div>\
                            <div>\
                                <p class="avalabile">5 campsites available</p>\
                            </div>';
                    var parkCard = domConstruct.create("div", { id: oid, innerHTML: parkCardHtml, class: "parkcard" }, "parks-list", "last");
                    on(parkCard, "click", lang.hitch(this, this.goToParkInfo, park));

                    // console.log("Added park ", oid);
                }
                // Make parks list panel appear
                this.showPanel("parks-list");
            }));
        },

        clearParksList: function() {
            // console.log("about to clear parks list");
            dojo.query(".parkcard", this.parksList).forEach(function(parkCard) {
                domConstruct.destroy(parkCard);
            });
        },

        goToParkInfo: function(feature, event) {
            console.log("Going to park info: ", feature.attributes.OBJECTID);
            // TODO: get feature, get weather, driving distance, etc
            var geometry = feature.geometry;
            //var geom = webMercatorUtils.geographicToWebMercator(geometry);

            var normalizedVal = webMercatorUtils.xyToLngLat(geometry.x, geometry.y);
            console.log(normalizedVal); //returns 19.226, 11.789
            console.log(normalizedVal[0]);
            console.log(normalizedVal[1]);
            var query1 = "http://api.openweathermap.org/data/2.5/weather?lat=" + normalizedVal[1] + "&lon=" + normalizedVal[0] + "39&appid=351fa6847fafdb396d6a1c0ab26254ed";
            var query2 = "https://maps.googleapis.com/maps/api/streetview?size=300x300&location=" + normalizedVal[1] + "," + normalizedVal[0] + "&heading=151.78&pitch=-0.76&key=AIzaSyCfEdqUASj97WuPXsSfpoWVdrsVWWvMcVc";
            console.log("http://api.openweathermap.org/data/2.5/weather?lat=" + normalizedVal[1] + "&lon=" + normalizedVal[0] + "39&appid=351fa6847fafdb396d6a1c0ab26254ed");
            console.log(query2);
            $.getJSON(query1, function(result) {
                console.log(result.weather[0].description);
                console.log(result.main.temp);
                console.log(result.wind.speed);

            });
            
            
                            request.get(query1, {
                    headers: {
                        "X-Requested-With": "",
                        "Access-Control-Allow-Origin": ""
                    },
                    content: {
                        f: "json"
                    }
                }).then(lang.hitch(this, function(weatherjson) {
                    weatherjson = JSON.parse(weatherjson);
                                   console.log("test!"+weatherjson.wind.speed);
            var title = feature.attributes.Name;
            this.sidebarTitle.innerHTML = "";
            var span = domConstruct.create("span", { class: "glyphicon glyphicon-menu-left back-button" }, this.sidebarTitle, "first");
            var div = domConstruct.create("div", { innerHTML: title }, this.sidebarTitle, "last");
            on(span, "click", lang.hitch(this, function(event) {
                this.showPanel('parks-list');
            }));
            // Format park detail page for specific park
            var parkCardHtml = '<div class="parkcard">\
                                <p class="tags">Tag1 Tag2</p>\
                                <label>Distance</label>\
                                <p>3 miles</p>\
                                <label>Address</label>\
                                <p>123 ABC St, City, State 11111</p>\
                                <label>Weather(today)</label>\
                                <p>'+weatherjson.weather[0].description+'</p>\
                                <label>Temperature(today)</label>\
                                <p>'+(weatherjson.main.temp*9/5 - 459.67)+' °F</p>\
                                <label>Gallery</label>\
                                <div>\
                                    <img style="width:30%; height:80px;margin-right:3%" src="https://maps.googleapis.com/maps/api/streetview?size=300x300&location=' + normalizedVal[1] + ',' + normalizedVal[0] + '&heading=151.78&pitch=-0.76&key=AIzaSyCfEdqUASj97WuPXsSfpoWVdrsVWWvMcVc"><img style="width:30%;margin-right:3%; height:80px" src="images/2.png"> <img style="width:30%; height:80px" src="images/3.jpg"> </div>\
                            </div>';
            this.parkDetail.innerHTML = parkCardHtml;
            var button = domConstruct.create("input", { style: "margin-top:30px; width:100%; text-align:center; margin-left:auto; background-color:#4CAF50; color:white;", value: "5 campsites available", class:"styledbtn" }, this.parkDetail, "last");
            on(button, "click", lang.hitch(this, this.displayCampsites, feature));
            this.showPanel("park-detail");
                }));
            
            
            
            



        },

        showPanel: function(panelId) {
            for (var id in this.panels) {
                var panel = this.panels[id].node;
                if (id == panelId) {
                    if (this.panels[id].sidebarHTML) {
                        this.sidebarTitle.innerHTML = this.panels[id].sidebarHTML;
                    }
                    if (panel.classList.contains("hidden")) {
                        panel.classList.remove("hidden");
                    }
                    // panel.refresh();
                } else {
                    panel.classList.add("hidden");
                }
            }
        },

        selectSingleFeature: function(event) {
            var feature = event.graphic;
            this.goToParkInfo(feature);
        },

        displayCampsites: function(park, event) {
            console.log(park.campsites);
            this.sidebarTitle.innerHTML = "";
            var title = "Choose an available campsite";
            var span = domConstruct.create("span", { class: "glyphicon glyphicon-menu-left back-button" }, this.sidebarTitle, "first");
            var div = domConstruct.create("div", { innerHTML: title }, this.sidebarTitle, "last");
            on(span, "click", lang.hitch(this, function(event) {
                this.showPanel('park-detail');
            }));
            // Get user information

            for (var index in park.campsites) {
                var campsite = park.campsites[index];
                // TODO: clear list
                var numPersons = campsite.availablePersons;
                var hostId = campsite.hostID;
                var requestUrl = this.apiUrl + "/users/" + hostId;
                request.get(requestUrl, {
                    headers: {
                        "X-Requested-With": "",
                        "Access-Control-Allow-Origin": ""
                    },
                    content: {
                        f: "json"
                    }
                }).then(lang.hitch(this, function(userInfo) {
                    userInfo = JSON.parse(userInfo);
                    var startDate = new Date(campsite.startDate);
                    var endDate = new Date(campsite.endDate);

                    var startString = (startDate.getDay()) + "/" + (startDate.getMonth() + 1) + "/" + (startDate.getYear());
                    var endString = (endDate.getDay()) + "/" + (endDate.getMonth() + 1) + "/" + (endDate.getYear());
                    var campSiteHtml = '<div style="float:none"><p class="parkname">' + park.attributes.Name + '</p>\
                               <p class="distance">' + userInfo.username + '</p></div>\
                               <div style="clear: both;"></div>\
                               <div style="float:none"><p class="parkname">Available time</p>\
                               <p class="distance">' + startString + "-" + endString + '</p></div>\
                               <div style="clear: both;"></div>\
                               <div style="float:none"><p class="parkname">Number of people</p>\
                               <p class="distance">' + numPersons + '</p></div>\
                               <div style="clear: both;"></div>\
                               <div style="float:none"><p class="parkname">Email</p>\
                               <p class="distance">' + userInfo.email + '</p></div>\
                               <div style="clear: both;"></div>\
                               <div style="float:none"><p class="parkname">Phone number</p>\
                               <p class="distance">' + userInfo.phone + '</p></div>\
                               <div style="clear: both;"></div>';
                    var parkCard = domConstruct.create("div", { id: campsite.id, innerHTML: campSiteHtml, class: "parkcard" }, "campsites-list", "last");
                }));
            }
            this.showPanel("campsites-list");
        }
    });
});
