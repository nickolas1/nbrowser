/*jshint quotmark: double, unused: false*/
"use strict";
/* global d3, 
generateMasses, generatePositions, generateVelocities,
generateMassesP, generatePositionsP, generateVelocitiesP, generateBodiesP,
calcCM, calcKineticEnergy, calcPotentialEnergy,
transitionStars, setBackgroundImage, initializeStarPlot
 */

var theme = "jeffers";
var nStars,
    masses,
    pos,
    vel,
    acc;
var starsvg;
var starApexes = [],
    apexStorage = [];
var integrateTimer;

var w = 700,
    h = 390;

var x = d3.scale.linear()
        .range([0, w]),
    y = d3.scale.linear()
        .range([h, 0]);
        
        
    
// star apexes
var lineFunction = d3.svg.line()
    .x(function(d) { return x(d[0]); })
    .y(function(d) { return y(d[1]); })
    .interpolate("linear");


/////////////////////////////////////////
/** DOM initialization and star setup **/  

var initializeSvgLayers = function() {
    var svg = d3.select("#nbodycanvas").append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("id", "svg")
        .attr("overflow", "hidden");
    svg.append("image") // background image layer
        .attr("width", w)
        .attr("height", h)
        .attr("id", "backgroundImage");
    svg.append("g") // stars layer
        .attr("width", w)
        .attr("height", h)
        .attr("id", "starLayer");
    var defs = svg.append("defs");
    defs.append("filter")
        .attr("id", "gaussblur2")
        .attr("x", "-30%")
        .attr("y", "-30%")
        .attr("width", "160%")
        .attr("height", "160%")
      .append("feGaussianBlur")
        .attr("in", "SourceGraphic")
        .attr("stdDeviation", 2);
    defs.append("filter")
        .attr("id", "gaussblur3")
        .attr("x", "-40%")
        .attr("y", "-40%")
        .attr("width", "180%")
        .attr("height", "180%")
      .append("feGaussianBlur")
        .attr("in", "SourceGraphic")
        .attr("stdDeviation", 3);
};

var generateStars = function() {
    if (theme !== "keplerP"){
        masses = generateMasses(nStars);
        pos = generatePositions(nStars);
        acc = generatePositions(nStars);  // dummy values
        vel = generateVelocities(nStars, pos);
    }
    else if (theme === "keplerP") {
        pos = [];
        vel = [];
        masses = generateMassesP(nStars);
        generateBodiesP(nStars);
        //console.log(pos);
        acc = generatePositions(nStars);  // dummy values
    }
};

var equilibrateStars = function() {
    var cm = calcCM(nStars, masses, pos, vel);
    var ke = calcKineticEnergy(nStars, masses, vel);
    var pe = calcPotentialEnergy(nStars, masses, pos);
    var scalepos,
        scalevel;
    var i, k;

    // move to the center of mass
    for (i = 0; i < nStars; i++) {
        for (k = 0; k < 3; k++) {
            pos[i][k] -= cm[0][k];
            vel[i][k] -= cm[1][k];
        }
    }   

    // scale energy to be in virial equilibrium
    scalevel = Math.sqrt(-0.5 * pe / ke);
    for(i = 0; i < nStars; i++){
        for(k = 0; k < 3; k++){
            vel[i][k] *= scalevel;
        }
    }

    // scale so that total energy is -0.25
    scalepos = -0.25 / (ke*scalevel*scalevel + pe);
    scalevel = Math.sqrt(scalepos);
    for(i = 0; i < nStars; i++){
        for(k = 0; k < 3; k++){
            pos[i][k] /= scalepos;
            vel[i][k] *= scalevel;
        }
    } 
};


////////////////////////////////////////
/** time integration functions below **/   

var kickStars = function(tstep) {
    var i, k;
    for (i = 0; i < nStars; i++) {
        for (k = 0; k < 3; k++) {
            vel[i][k] += acc[i][k] * tstep;
        }
    }
};

var driftStars = function(tstep) {
    var i, k;
    for (i = 0; i < nStars; i++) {
        for (k = 0; k < 3; k++) {   
            pos[i][k] += vel[i][k] * tstep;
        }
    }
};

var calcAccels = function(){
    var dr = [0.0, 0.0, 0.0],
        r2,
        r3,
        a,
        i, j, k;

    for(i = 0; i < nStars; i++) {
        for(k = 0; k < 3; k++) {
            acc[i][k] = 0.0;
        }
    }

    for(i = 0; i < nStars - 1; i++){
        for(j = i + 1; j < nStars; j++){
            r2 = 0.0;
            for(k = 0; k < 3; k++){
                dr[k] = pos[j][k] - pos[i][k];
                r2 += dr[k] * dr[k];
            }
            r3 = r2 * Math.sqrt(r2) + 1.e-7;
        
            for(k = 0; k < 3; k++){
                a = dr[k] / r3;
                acc[i][k] += a * masses[j];
                acc[j][k] += -a * masses[i];
            }             
        }
    }
};

var leapfrogStep = function(dt) {
    kickStars(dt * 0.5);
    driftStars(dt);
    calcAccels();
    kickStars(dt * 0.5);
};

var integrateStars = function() {
    var sps = 40, /* steps per second */
        redraw = 10,
        transitiontime = 250,
        dt = 0.003;
    if (theme === "keplerP") {
        sps = 40;
        redraw = 4;
        transitiontime = 100;
        dt = 0.03;
    }
    var count = 0;
    
    var starselection = d3.selectAll(".star");
    var containerselection = d3.selectAll(".starContainer");
    
    clearInterval(integrateTimer);
    integrateTimer = setInterval( function() {
        leapfrogStep(dt); 
        count++;
        if (count === redraw) {
            transitionStars(1.75*transitiontime, starselection, containerselection);
            count = 0;
        }
    }, 1000/sps);
};

/////////////////////////////////////////
/** theme selection **/  

var launchIntegrator = function() {
    setBackgroundImage();
    // reset stars
    starApexes = [];
    apexStorage = [];
    generateStars();
    if(theme !== "keplerP"){
       equilibrateStars();
    }
    calcAccels();
    starsvg = initializeStarPlot();
    integrateStars();
};

var selectKepler = function() {
    nStars = 32;
    theme = "kepler";
    $(".selector.selected").removeClass("selected");
    $("#keplerChooser").addClass("selected");
    $("#starLayer").empty();
    launchIntegrator();
};
var selectJeffers = function() {
    nStars = 24;
    theme = "jeffers";
    $(".selector.selected").removeClass("selected");
    $("#jeffersChooser").addClass("selected");
    $("#starLayer").empty();
    launchIntegrator();
};
var selectKeplerPlanet = function() {
    nStars = 16;
    theme = "keplerP";
    $(".selector.selected").removeClass("selected");
    $("#keplerPlanetChooser").addClass("selected");
    $("#starLayer").empty();
    launchIntegrator();
};


/////////////////////////////////////////
/** spin it up **/ 
$(function() {
    var about = $("#about");
    about.poptrox();
    
    selectJeffers();
    
    initializeSvgLayers();
    
    selectJeffers();
});
