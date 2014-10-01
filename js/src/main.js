var launchIntegrator = function() {
    setBackgroundImage();
    generateStars();
    if(theme != 'keplerP') equilibrateStars();
    calcAccels();
    starsvg = initializeStarPlot();
    integrateStars();
}

var selectKepler = function() {
    nStars = 32;
    theme = "kepler";
    $(".selector.selected").removeClass("selector selected").addClass("selector");
    $("#keplerChooser").removeClass("selector").addClass("selector selected");
    $("#starLayer").empty();
    launchIntegrator();
};
var selectJeffers = function() {
    nStars = 24;
    theme = "jeffers";
    $(".selector.selected").removeClass("selector selected").addClass("selector");
    $("#jeffersChooser").removeClass("selector").addClass("selector selected");
    $("#starLayer").empty();
    starApexes = [],
    apexStorage = [];
    launchIntegrator();
};
var selectKeplerPlanet = function() {
    nStars = 16;
    theme = "keplerP";
    $(".selector.selected").removeClass("selector selected").addClass("selector");
    $("#keplerPlanetChooser").removeClass("selector").addClass("selector selected");
    $("#starLayer").empty();
    launchIntegrator();
};

var theme = "jeffers";
var nStars = 16,
    masses,
    pos,
    vel,
    acc;
var starsvg;
var starApexes = [],
    apexStorage = [],
    oldpos = []; // old positions for planet paths
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

$(function() {
    var about = $("#about");
    about.poptrox();

    initializeSvgLayers();
    setBackgroundImage();
    generateStars();
    if (theme !== "keplerP") {
        equilibrateStars();
    }
    calcAccels();
    starsvg = initializeStarPlot();
    integrateStars();
})

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
      .append("feGaussianBlur")
        .attr("in", "SourceGraphic")
        .attr("stdDeviation", 2);
    defs.append("filter")
        .attr("id", "gaussblur3")
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

var integrateStars = function() {
    var fps = 64,
        redraw = 8,
        totcount = 0,
        dt = 0.002;
    if (theme === "keplerP") {
        fps = 64;
        redraw = 8;
        dt = 0.02;
    }
   // console.log("timing ",1000/fps, redraw, 1000/(fps/redraw));
   // var dt = 0.002;
    var count = 0;
    clearInterval(integrateTimer);
    integrateTimer = setInterval( function() {
        leapfrogStep(dt); 
        count++;
        totcount++;
        if (count === redraw) {
            transitionStars(125, totcount);
            count = 0;
        }
    }, 1000/fps);
};

var leapfrogStep = function(dt) {
    kickStars(dt * 0.5);
    driftStars(dt);
    calcAccels();
    kickStars(dt * 0.5);
};

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
            r2 = 0.0
            for(k = 0; k < 3; k++){
                dr[k] = pos[j][k] - pos[i][k];
                r2 += dr[k] * dr[k]
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
