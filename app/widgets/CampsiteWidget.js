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

    Map
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
        },

        addLayersToMap: function() {
            console.log("hello");
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

        createSidebar: function() {

        }
    });
});
