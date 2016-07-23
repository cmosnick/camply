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
    "esri/layers/FeatureLayer",
    "esri/renderers/SimpleRenderer",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/Color",
    "esri/dijit/LocateButton",
    "esri/tasks/BufferParameters",
    "esri/tasks/GeometryService",
    "esri/tasks/QueryTask",
    "esri/tasks/query",

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
    FeatureLayer,
    SimpleRenderer,
    SimpleMarkerSymbol,
    Color,
    LocateButton,
    BufferParameters,
    GeometryService,
    QueryTask,
    Query

) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,

        constructor: function(options){
            this.domNode = options.domNode || "campsite-widget-bar";
            this.inherited(arguments);
        },

        startup: function() {
            // Create sidebar
            this.createSidebar();

            // Create map
            this.map = new Map("mapDiv", {
                basemap: "hybrid",
                center: [-122.69, 45.52],
                zoom: 3
            });
            
            this.geomService = new GeometryService("http://dev002023.esri.com/arcgis/rest/services/Parks/Parks/MapServer/0");

            this.addLayersToMap();

            this.initMapWidgets();
        },

        addLayersToMap: function() {
            console.log("hello");
            this.campSiteLayer = new FeatureLayer("http://dev002023.esri.com/arcgis/rest/services/Parks/Parks/MapServer/0", {
                id: "campSiteLayer"
            });
            this.campSiteLayer.setRenderer(new SimpleRenderer(new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE,
                5, null, new Color([255, 153, 51]))));
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

        drawBuffer: function(position, bufferRadius = 5) {
            // Create buffer graphic
            // var graphic = new Graphic();


            // var bufferParams = new BufferParameters();
            // bufferParams.geometries = [position];
            // bufferParams.distances = [bufferRadius];
            // bufferParams.unit = GeometryService.UNIT_MILE;
            // bufferParams.outSpatialReference = this.map.spatialReference;


            // // Query where layer intersects buffer grpaghic geometry
            // var queryTask = new QueryTask("http://dev002023.esri.com/arcgis/rest/services/Parks/Parks/MapServer/0");
            // var query = new Query();
            // query.where = "STATE_NAME = 'Washington'";
            // query.outSpatialReference = {wkid:102100}; 
            // query.returnGeometry = true;
            // query.outFields = ["CITY_NAME"];
            // queryTask.execute(query, addPointsToMap);





        }
    });
});
