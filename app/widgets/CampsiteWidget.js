define([
    "dojo/_base/declare",
    'dojo/_base/lang',
    'dojo/on',
    'dojo/dom',

    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    'dojo/text!/widgets/templates/CampsiteWidget.html',

    'dojo/dom-construct',
    'esri/map',
    "dojo/domReady!",


], function(
    declare,
    lang,
    on,
    dom,

    _WidgetBase,
    _TemplatedMixin,
    template,

    domConstruct,
    Map
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,

        startup: function() {
            // Create map
            this.map = new Map("mapDiv", {
                basemap: "hybrid",
                center: [-122.69, 45.52],
                zoom: 3
            });


            this.initBasemapButtons();
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
        }
    });
});
