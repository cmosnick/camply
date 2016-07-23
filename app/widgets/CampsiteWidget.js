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
    LocateButton

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
            


            // this.initBasemapButtons();
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

        initBasemapButtons: function () {
            // Wire UI Events
            on(dom.byId("btnStreets"), "click", function() {
                this.map.setBasemap("streets");
            });
            on(dom.byId("btnSatellite"), "click", function() {
                this.map.setBasemap("satellite");
            });
            on(dom.byId("btnHybrid"), "click", function() {
                this.map.setBasemap("hybrid");
            });
            on(dom.byId("btnTopo"), "click", function() {
                this.map.setBasemap("topo");
            });
            on(dom.byId("btnGray"), "click", function() {
                this.map.setBasemap("gray");
            });
            on(dom.byId("btnNatGeo"), "click", function() {
                this.map.setBasemap("national-geographic");
            });
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

            on(locate, "click", lang.hitch(this, function(event){
                
            }))
        },

        createSidebar: function() {

        }
    });
});
