define([
    "dojo/_base/declare",
    'dojo/_base/lang',
    'dojo/on',
    'dojo/dom',
    'dojo/dom-construct',

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

    "dojo/domReady!",


], function(
    declare,
    lang,
    on,
    dom,    
    domConstruct,

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

    InfoTemplate

) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        selectionColor: new Color([93, 191, 63]),
        renderColor: new Color([255, 153, 51]),
        bufferValue: 20,
        panelIds: ["parks-list", "park-detail", "campsites-list"],

        constructor: function(options){
            this.domNode = options.domNode || "campsite-widget-bar";
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
            console.log("hello");
            var infoTemplate = new InfoTemplate({
                title: "${Name}",
                content: "${*}"
            });
            this.campSiteLayer = new FeatureLayer("http://dev002023.esri.com/arcgis/rest/services/Parks/Parks/MapServer/0", {
                id: "campSiteLayer",
                infoTemplate: infoTemplate,
                outFields: ["*"],
                mode: FeatureLayer.MODE_ONDEMAND
            });
            this.campSiteLayer.setRenderer(new SimpleRenderer(new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 5, null, this.renderColor)));
            this.campSiteLayer.setSelectionSymbol(new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 5, null, this.selectionColor));
            this.map.addLayer(this.campSiteLayer);
        },

        initMapWidgets: function(){
            var search = new Search({
              map: this.map
            },"search");
            search.startup();

            var locate = new LocateButton({
                map: this.map
            }, "locateButton");
            locate.startup();

            on(locate, "locate", lang.hitch(this, function(event){
                console.log(event);
                this.drawBuffer(event.graphic.geometry);
            }))
        },

        createSidebar: function() {

        },

        drawBuffer: function(position, bufferRadius = 20) {
            var bufferParams = new BufferParameters();
            bufferParams.geometries = [position];
            bufferParams.distances = [bufferRadius];
            bufferParams.unit = GeometryService.UNIT_NAUTICAL_MILE;
            bufferParams.outSpatialReference = this.map.spatialReference;

            this.geomService.buffer(bufferParams, lang.hitch(this, function(bufferGeoms){
                console.log(bufferGeoms);
                if(this.graphicsLayer == 'undefined' || this.graphicsLayer == null){
                    this.graphicsLayer = new GraphicsLayer();
                    this.map.addLayer(this.graphicsLayer);
                }
                this.graphicsLayer.clear();
                // Query where layer intersects buffer grpaghic geometry
                var queryTask = new QueryTask("http://dev002023.esri.com/arcgis/rest/services/Parks/Parks/MapServer/0");
                var query = new Query();
                query.geometry = bufferGeoms[0];
                query.outSpatialReference = this.map.spatialReference;
                query.returnGeometry = true;
                query.outFields = ["*"];
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

            // mute layer
            this.campSiteLayer.hide();
            // Select points on campsite layer
            this.campSiteLayer.clearSelection();
            this.campSiteLayer.selectFeatures(results.features);
            this.clearParksList();
            for(var index in results.features){
                var feature = results.features[index];
                // Add features info to parks-list sidebar
                var name = feature.attributes.Name;
                var addr = feature.attributes.State;
                var oid = feature.attributes.OBJECTID;
                var parkCardHtml = '<div style="float:none">\
                            <p class="parkname">'+ name +'</p>\
                            <p class="distance">3miles</p>\
                        </div>\
                        <div style="clear: both;"></div>\
                        <div>\
                            <p class="address">'+ addr + '</p>\
                        </div>\
                        <div>\
                            <p class="avalabile">5 campsites available</p>\
                        </div>';
                var parkCard = domConstruct.create("div", {id: oid, innerHTML: parkCardHtml, class: "parkcard"}, "parks-list", "last");
                on(parkCard, "click", lang.hitch(this, this.goToParkInfo(parkCard.id)));
            }
        },

        clearParksList: function() {
            console.log("about to clear parks list");
            dojo.query(".parkcard", this.parksList).forEach(function(parkCard){
                domConstruct.destroy(parkCard);
            })
        },

        goToParkInfo: function(parkId){
            console.log("Going to park info: ", parkId);


            // this.showPanel("park-detail");
        },

        showPanel: function(panelId){
            for(var index in this.panelIds){
                var id = this.panelIds[index];
                var panel = document.getElementById(id);
                if(id == panelId && panel.classList.contains("hidden")){
                    panel.classList.remove("hidden");
                } else {
                    panel.classList.add("hidden");
                }
            }
        }
    });
});
