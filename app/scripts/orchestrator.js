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


function Integrator() {

    this.sps = 60; /* steps per second */
    this.redraw = 2;
    this.transitionTime = 250;
    var dt;
    
    Object.defineProperty(this, "dt", {
        get: function() {
            return dt;
        },
        set: function(dtNew) {
            dt = dtNew;
            this.dtHalf = dtNew * 0.5;
        },
        enumerable: true,
        configurable: true
    });
}




Integrator.prototype.kickStars = function(dt) {
    var stars = this.cluster.stars,
        k;
    
    stars.forEach(function (v, i, a) {
        for (k = 0; k < 3; k = k + 1) {
            a[i].vel[k] += a[i].acc[k] * dt;
        }
    });  
};

Integrator.prototype.driftStars = function(dt) {
    var stars = this.cluster.stars,
        k;
    
    stars.forEach(function (v, i, a) {
        for (k = 0; k < 3; k = k + 1) {
            a[i].pos[k] += a[i].vel[k] * dt;
        }
    });  
};

Integrator.prototype.calcAccels = function() {
    var stars = this.cluster.stars,
        k,
        r2,
        r3,
        a,
        dr = [0.0, 0.0, 0.0];
    
    stars.forEach(function (v, i, a) {
        for (k = 0; k < 3; k = k + 1) {
            a[i].acc[k] = 0.0;
        }
    });     
    
    
    stars.forEach(function (star1, i) {
        stars.forEach(function (star2, j) {
            if(j > i) {
                r2 = 0.0;
                for(k = 0; k < 3; k++){
                    dr[k] = star2.pos[k] - star1.pos[k];
                    r2 += dr[k] * dr[k];
                }
                r3 = r2 * Math.sqrt(r2) + 1.e-7;
        
                for(k = 0; k < 3; k++){
                    a = dr[k] / r3;
                    star1.acc[k] += a * star2.mass;
                    star2.acc[k] -= a * star1.mass;
                }
            }             
        });
    });
};


Integrator.prototype.leapfrogStep = function() {
    this.kickStars(this.dtHalf);
    this.driftStars(this.dt);
    this.calcAccels();
    this.kickStars(this.dtHalf);
};


var integrateStars = function() {
    var sps = 60, /* steps per second */
        redraw = 2,
        transitiontime = 250,
        dt = 0.002;
    if (theme === "keplerP") {
        sps = 40;
        redraw = 1;
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
