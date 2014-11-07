/*jshint quotmark: double, unused: false*/
"use strict";
/*global Simulation */

$(function() {
    $("#about").poptrox();
    
    var simulation = new Simulation();
    
    var selectKepler = function() {
        simulation.selectType("kepler", 32);
    };
    var selectJeffers = function() {
        simulation.selectType("jeffers", 24);
    };
    var selectKeplerPlanet = function() {
        simulation.selectType("keplerPlanet", 16);
    };
    
    var preloadBg = new Image();
    
    $("#jeffersChooser").click(selectJeffers);
    $("#keplerChooser").click(selectKepler);
    $("#keplerPlanetChooser").click(selectKeplerPlanet);
    
    simulation.initializeSvgLayers();
    
    selectJeffers();
    
    preloadBg.src = "images/blue-nebula.jpg";
    
});
