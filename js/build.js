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
        .attr("id", "svg");
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
;var generateMassesP = function(N) {
    // power law mass function from 1 to 3, alpha = -2.3
    // generate stellar masses only for N/4 stars, the rest get jupiter mass
    var alpha = 2.3,
        mhi = 3.0,
        mlo = 1.0;
    var alpham1 = alpha - 1,
        fm1 = 1.0 / Math.pow(mhi, alpham1),
        fmn = (fm1 - 1.0 / Math.pow(mlo, alpham1)) / (N / 4 - 1),
        constant = 1.0 / alpham1;
    var masses = [],
        mtot = 0.0; 
    var i;       
    for(i = 0; i < N / 4; i++){
        var fmi = fm1 - i * fmn;
        mass = 1.0 / Math.pow(fmi, constant);
        mtot += mass;
        masses.push(mass);
    }   
    for(i = N / 4; i < N; i++){
        mass = 0.001;
        mtot += mass;
        masses.push(mass);
    }    
    for(i = 0; i < N; i++){
        masses[i] /= mtot;
    }    
    return masses;     
};

var generateBodiesP = function(N) {
    // scatter the stars randomly in x and y, well separated in z
    var posx,
        posy,
        posz,
        a1, a2;
    var posbase = [[1.2, 1, 40], [-1, -1, 20], [-1.3, 0.8, 0], [1, -0.9, -20]],
        velbase = [[.1, -.3, 0], [-.4, .3, 0], [.5,.2, 0], [-.2, -.2, 0]],
        scale = 0.3;
    var i;
    for(i = 0; i < N / 4; i++) {
        a1 = Math.random();
        a2 = Math.random();
        posz = posbase[i][2];
        posx = (posbase[i][0] + (0.5 - a1) * scale);
        posy = (posbase[i][1] + (0.5 - a2) * scale);
        velx = velbase[i][0] * .05;
        vely = velbase[i][1] * .05;
        velz = velbase[i][2] * .05;
        pos.push([posx, posy, posz]);
        vel.push([velx, vely, velz]);
    }     
    
    // put three planets around each star
    var count = 0,
        parent = 0,
        pscale = 0.05,
        semis,
        incbase,
        inc,
        ecc,
        O,  // long of ascending node
        w,  // arg of periapsis
        M,  // mean anomoly
        statevec, // cartesian components
        semiscale = [0.4, 0.3, 0.25, 0.2];
        
    for(i = N / 4; i < N; i++) {
        if (count === 0) {
            incbase = Math.PI * (115 - 12 * Math.random()) / 180;
            semis = [1 + 0.1 * (0.5 - Math.random()),
                    1.5 + 0.1 * (0.5 - Math.random()),
                    2.1 + 0.1 * (0.5 - Math.random())];
            console.log("incbase ",incbase);
            O = 2 * Math.PI * Math.random();
        }
        inc = incbase;// + Math.PI * (0.5 - Math.random()) / 180;
        ecc = 0.05 * Math.random();
       
       
        w = 2 * Math.PI * Math.random();
        M = 2 * Math.PI * Math.random();
        
        /*O = 0;
        w = 0;
        M = 0;
        inc = 0.01;*/

        statevec = kepToCart(semis[count] * semiscale[parent], ecc, inc, O, w, M, masses[i] + masses[parent]);
        pos.push([statevec[0] + pos[parent][0], 
                statevec[1] + pos[parent][1], 
                statevec[2] + pos[parent][2]
                ]);
        vel.push([statevec[3], statevec[4], statevec[5]]);
        
        /*var r =  Math.sqrt(
                     (pos[i][0] - pos[parent][0])*(pos[i][0] - pos[parent][0]) +
                     (pos[i][1] - pos[parent][1])*(pos[i][1] - pos[parent][1]) +
                     (pos[i][2] - pos[parent][2])*(pos[i][2] - pos[parent][2]));
        var v2 =  (vel[i][0] - vel[parent][0])*(vel[i][0] - vel[parent][0]) +
                     (vel[i][1] - vel[parent][1])*(vel[i][1] - vel[parent][1]) +
                     (vel[i][2] - vel[parent][2])*(vel[i][2] - vel[parent][2]);            
        var pot = -masses[i]*masses[parent] / r;
        var kin = 0.5 * masses[i] * v2;*/

        count++;
        if (count === 3) {
            count = 0;
            parent++;
        }
    } 
};       

var kepToCart = function(a, e, i, O, w, M, mu) {
    E = eccentricAnomoly(M, e);
    var Px = Math.cos(w) * Math.cos(O) - Math.sin(w) * Math.cos(i) * Math.sin(O),
        Py = Math.cos(w) * Math.sin(O) + Math.sin(w) * Math.cos(i) * Math.cos(O),
        Pz = Math.sin(w) * Math.sin(i);
    var Qx = -Math.sin(w) * Math.cos(O) - Math.cos(w) * Math.cos(i) * Math.sin(O),
        Qy = -Math.sin(w) * Math.sin(O) + Math.cos(w) * Math.cos(i) * Math.cos(O),
        Qz = Math.cos(w) * Math.sin(i);
    var coeff1 = a * (Math.cos(E) - e),
        coeff2 = a * Math.sqrt(1 - e*e) * Math.sin(E),
        coeff3 = Math.sqrt(mu / (a*a*a)) / (1 - e * Math.cos(E)),
        coeff4 = -a * Math.sin(E),
        coeff5 = a * Math.sqrt(1 - e*e) * Math.cos(E);
    var statevec = [
        coeff1 * Px + coeff2 * Qx,
        coeff1 * Py + coeff2 * Qy,
        coeff1 * Pz + coeff2 * Qz,
        coeff3 * (coeff4 * Px + coeff5 * Qx),
        coeff3 * (coeff4 * Py + coeff5 * Qy),
        coeff3 * (coeff4 * Pz + coeff5 * Qz)
    ];
    return statevec;
};


var eccentricAnomoly = function(M, e) {
    var E0 = M,
        eps = 1.e-10,
        E1 = E0 - (E0 - e * Math.sin(E0) - M) / (1 - e * Math.cos(E0));
    while ( Math.abs(E1 - E0) > eps ) {
        E0 = E1;
        E1 = E0 - (E0 - e * Math.sin(E0) - M) / (1 - e * Math.cos(E0));
    }
    return E1;
};

;var generateMasses = function(N) {
    // power law mass function from 1 to 10, alpha = -2.3
    var alpha = 2.3,
        mhi = 10.0,
        mlo = 1.0;
    var alpham1 = alpha - 1,
        fm1 = 1.0 / Math.pow(mhi, alpham1),
        fmn = (fm1 - 1.0 / Math.pow(mlo, alpham1)) / (nStars - 1),
        constant = 1.0 / alpham1;
    var masses = [],
        mtot = 0.0;  
    var i, fmi;      
    for(i = 0; i < N; i++){
        fmi = fm1 - i * fmn;
        mass = 1.0 / Math.pow(fmi, constant);
        mtot += mass;
        masses.push(mass);
    }   
    for(i = 0; i < N; i++){
        masses[i] /= mtot;
    }    
    return masses;     
};

var generatePositions = function(N) {
    // plummer sphere!
    var positions = [];  
    var i, ri, a1, a2, a3, posx, posy, posz;
    for(i = 0; i < N; i++){
        ri = 60;
        while(ri > 6){
            a1 = 1.0e-11;
            while(a1 < 1.0e-10){
                a1 = Math.random();
            }
            ri = Math.pow(Math.pow(a1,-0.6666667) - 1.0, -0.5);
        }
        a2 = Math.random();
        a3 = Math.random();
        posz = (1.0 - 2.0 * a2) * ri;
        posx = Math.sqrt(ri * ri - posz * posz) * Math.cos(2 * Math.PI * a3);
        posy = Math.sqrt(ri * ri - posz * posz) * Math.sin(2 * Math.PI * a3);
        positions.push([posx, posy, posz]);
    }     
    return positions;     
};       

var generateVelocities = function(N, positions) {
    // plummer sphere!
    var velocities = [];
    var i, k, ri, a4, a5, a6, a7, a8, velx, vely, velz;
    for(i = 0; i < N; i++){
        ri = 0.0;
        for(k = 0; k < 3; k++){
            ri += positions[i][k] * positions[i][k];
        }
        ri = Math.sqrt(ri);       
        a4 = 1;
        a5 = 1000;
        a6 = 1;
        while(a5 > 10*a6){
            a4 = Math.random();
            a5 = Math.random();
            a6 = a4 * 2 * Math.pow(1.0 - a4 * a4, 3.5);
        }
        a8 = a4 * Math.SQRT2 / Math.pow((1.0 + ri * ri), 0.25);
        a6 = Math.random();
        a7 = Math.random();
        velz = (1.0 - 2.0 * a6) * a8;
        velx = Math.sqrt(a8 * a8 - velz * velz) * Math.cos(2 * Math.PI * a7);
        vely = Math.sqrt(a8 * a8 - velz * velz) * Math.sin(2 * Math.PI * a7);         
        velocities.push([0.1*velx, 0.1*vely, 0.1*velz]);  
        // multiply by 0.1 to ensure potential greater than kinetic for rescaling part and low n. velocities are rescaled later
    }   
    return velocities;
};

var calcCM = function(N, masses, positions, velocities) {
    var cm = [
            [0.0, 0.0, 0.0],  // center of mass position
            [0.0, 0.0, 0.0]   // center of mass velocity
        ]; 
    var i, k;
    for(i = 0; i < N; i++){
        for(k = 0; k < 3; k++){
            cm[0][k] += masses[i] * positions[i][k];
            cm[1][k] += masses[i] * velocities[i][k];
        }
    }   
    return cm;
};
    
calcKineticEnergy = function(N, masses, velocities){
    var ke = 0.0,
        v2;
    var i, k;    
    for(i = 0; i < N; i++) {
        v2 = 0.0;
        for(k = 0; k < 3; k++){
            v2 += velocities[i][k] * velocities[i][k];
        }
        ke += 0.5 * masses[i] * v2;
    }
    return ke;
}
    
    
calcPotentialEnergy = function(N, masses, positions){
    var dr = [0.0, 0.0, 0.0],
        r2,
        pot = 0.0,
        posi,
        mi,
        posj,
        mj;
    var i, j, k;
    for(i = 0; i < N; i++){
        posi = positions[i];
        mi = masses[i]; 
        for(j = i; j < N; j++){
            if(i != j){ //get the pairwise force and add to both stars
                posj = positions[j];
                mj = masses[j];

                r2 = 0.0
                for(k = 0; k < 3; k++){
                    dr[k] = posj[k] - posi[k];
                    r2 += dr[k] * dr[k];
                }
                pot -= mi * mj / Math.sqrt(r2);
            }   
        }
    }
    return pot;
}

;var initializeStarPlot = function() {
    // creates the svg representation of the stars
    if (theme === "jeffers") {
    
        var xrange = 12,
            yrange = xrange * h / w;
        var i, a;
        x.domain([-8, 4]);
        y.domain([2.5-yrange, 2.5]);
            
        // raw shape of the star. these get scaled by the sqrt of mass
        // and stretched / flipped randomly to make the stars look more organic
        var rawApexes = [
            [-2.5, -0.5],
            [-2, -6.5],
            [1, -1.6],
            [2, -7.5],
            [2.5, -0.5],
            [5, 2],
            [2, 1.5],
            [0.5, 5.5],
            [-1.5, 1],
            [-5.5, 0.7]
        ];
        
        for (i = 0; i < nStars; i++) {
            var thisApexes = [];
            var thisApexStorage = [];
            var mscale = 0.0007/d3.min(masses),
                flip,
                stretchx,
                stretchy;
            (Math.random() < 0.5) ? flip = 1.0 : flip = -1.0;
            for (a = 0; a < rawApexes.length; a++) {
                stretchx = (0.4 * Math.random() - 0.2 + 1) * flip,
                stretchy = (0.4 * Math.random() - 0.2 + 1);
                thisApexes.push([
                    Math.sqrt(masses[i]*mscale)*rawApexes[a][0]*stretchx + pos[i][0],
                    Math.sqrt(masses[i]*mscale)*rawApexes[a][1]*stretchy + pos[i][1]]);
                thisApexStorage.push([
                    Math.sqrt(masses[i]*mscale)*rawApexes[a][0]*stretchx,
                    Math.sqrt(masses[i]*mscale)*rawApexes[a][1]*stretchy]);
            }
            thisApexes.push([thisApexes[0][0], thisApexes[0][1]]);
            thisApexStorage.push([thisApexStorage[0][0], thisApexStorage[0][1]]);
            starApexes.push(thisApexes);
            apexStorage.push(thisApexStorage);
        }
        
        d3.select("#starLayer").selectAll(".star")
            .data(starApexes)
          .enter()
            .append("path")
            .attr("d", lineFunction)
            .attr("class", "jeffers star");       
    }
    else if (theme === "kepler") {
        var xrange = 5,
            yrange = xrange * h / w;
        x.domain([-xrange/2, xrange/2]);
        y.domain([-yrange/2, yrange/2]);
        
        var colorLo = "rgb(221, 56, 0)",
            colorMid = "rgb(221, 175, 0)",
            colorHi = "rgb(82, 121, 221)";
       /* var c = d3.scale.linear() // color scale for sink particles
            .domain(d3.extent(masses))
            .range([colorLo, colorHi]).interpolate(d3.interpolateRgb); */
            
        var colorChoices = ["rgb(221, 56, 0)", "rgb(221, 137, 20)", "rgb(234, 225, 89)", "rgb(106, 137, 234)"]
        var colors = d3.scale.linear()
            .domain(d3.range(0, 1.01, 1.0 / (colorChoices.length - 1)))
            .range(colorChoices);
        var c = d3.scale.log()
            .domain(d3.extent(masses))
            .range([0, 1])
        
        d3.select("#starLayer").selectAll(".star.diffuse")
            .data(pos)
          .enter()
            .append("circle")
            .attr("cx", function(d) { return x(d[0]); })
            .attr("cy", function(d) { return y(d[1]); })
            .attr("r", function(d, i) { return 30 * Math.sqrt(masses[i]/d3.max(masses)); })
            .attr("fill", function(d, i) { return colors(c(masses[i])); })
            .attr("opacity", 0.8)
            .attr("class", "kepler star diffuse")
            .attr("filter", "url(#gaussblur2)");
        
        d3.select("#starLayer").selectAll(".star.solid")
            .data(pos)
          .enter()
            .append("circle")
            .attr("cx", function(d) { return x(d[0]); })
            .attr("cy", function(d) { return y(d[1]); })
            .attr("r", function(d, i) { return 27 * Math.sqrt(masses[i]/d3.max(masses)); })
            .attr("fill", function(d, i) { return colors(c(masses[i])); })
            .attr("opacity", 0.5)
            .attr("class", "kepler star solid");
    
        d3.select("#starLayer").selectAll(".star.compact")
            .data(pos)
          .enter()
            .append("circle")
            .attr("cx", function(d) { return x(d[0]); })
            .attr("cy", function(d) { return y(d[1]); })
            .attr("r", function(d, i) { return 7.5 * Math.sqrt(masses[i]/d3.max(masses)); })
            .attr("fill", "rgba(255, 255, 255, .9)")
            .attr("class", "kepler star compact")
            .attr("filter", "url(#gaussblur2)");
    }
    else if (theme === "keplerP") {
        var xrange = 6,
            yrange = xrange * h / w;
        x.domain([-xrange/2, xrange/2]);
        y.domain([-yrange/2, yrange/2]);
        
        var colorLo = "rgb(221, 56, 0)",
            colorMid = "rgb(221, 175, 0)",
            colorHi = "rgb(82, 121, 221)";
       /* var c = d3.scale.linear() // color scale for sink particles
            .domain(d3.extent(masses))
            .range([colorLo, colorHi]).interpolate(d3.interpolateRgb); */
            
        var colorChoices = ["rgb(229, 24, 7)", "rgb(251, 190, 2)"]
        var colors = d3.scale.linear()
            .domain(d3.range(0, 1.01, 1.0 / (colorChoices.length - 1)))
            .range(colorChoices);
        var c = d3.scale.linear()
            .domain(d3.extent(masses))
            .range([0, 1])
        
        d3.select("#starLayer").selectAll(".star.diffuse")
            .data(pos)
          .enter()
            .append("circle")
            .attr("cx", function(d) { return x(d[0]); })
            .attr("cy", function(d) { return y(d[1]); })
            .attr("r", function(d, i) {
                if (masses[i] > 0.01) { 
                    return 37 * Math.sqrt(masses[i]/d3.max(masses));
                } 
                else {
                    return 3;
                } 
            })
            .attr("fill", function(d, i) { 
                if (masses[i] > 0.01) {
                    return colors(c(masses[i])); 
                }
                else {
                    return "rgb(6, 16, 74)";
                }       
            })
            .attr("opacity", 0.8)
            .attr("class", "kepler star diffuse")
            .attr("filter", "url(#gaussblur2)");
        
        d3.select("#starLayer").selectAll(".star.solid")
            .data(pos)
          .enter()
            .append("circle")
            .attr("cx", function(d) { return x(d[0]); })
            .attr("cy", function(d) { return y(d[1]); })
            .attr("r", function(d, i) { 
                if (masses[i] > 0.01) { 
                    return 32 * Math.sqrt(masses[i]/d3.max(masses));
                } 
                else {
                    return 4;
                }  
            })
            .attr("fill", function(d, i) { 
                if (masses[i] > 0.01) {
                    return colors(c(masses[i])); 
                }
                else {
                    return "rgb(6, 16, 74)";
                }
            })
            .attr("opacity", function(d, i) {
                if (masses[i] > 0.01) {
                    return 0.9;
                }
                else {
                    return 1.0;
                }
            })
            .attr("stroke","rgb(163, 182, 247)")
            .attr("stroke-width", function(d, i) {
                if (masses[i] > 0.01) {
                    return "0px";
                }
                else {
                    return "0.5px";
                }
            })
            .attr("class", "kepler star solid");
    
        d3.select("#starLayer").selectAll(".star.compact")
            .data(pos)
          .enter()
            .append("circle")
            .attr("cx", function(d) { return x(d[0]); })
            .attr("cy", function(d) { return y(d[1]); })
            .attr("r", function(d, i) { 
                if (masses[i] > 0.01) { 
                    return 9 * Math.sqrt(masses[i]/d3.max(masses));
                } 
                else {
                    return 0;
                } 
            })
            .attr("fill", "rgba(255, 255, 255, .9)")
            .attr("class", "kepler star compact")
            .attr("filter", "url(#gaussblur2)");    
    }
};


var transitionStars = function(duration, count) {
    if (theme === "jeffers") {
        var i, a;
        for (i = 0; i < nStars; i++) {
            for (a = 0; a < 11; a++){   
                starApexes[i][a][0] = apexStorage[i][a][0] + pos[i][0];
                starApexes[i][a][1] = apexStorage[i][a][1] + pos[i][1];
            }
        }
        d3.selectAll(".star")
          .transition()
            .ease("linear")
            .attr("d", lineFunction)
            .duration(duration);
    }
    
    else if (theme === "kepler") {
        d3.selectAll(".star")
          .transition()
            .ease("linear")
            .attr("cx", function(d) { return x(d[0]); })
            .attr("cy", function(d) { return y(d[1]); })
            .duration(duration);
    }
    
    else if (theme === "keplerP") {
        // sort the planets and stars by z so that they occult each other correctly
        d3.selectAll(".star.solid, .star.diffuse .trail").sort( function(a, b) {
            if (a[2] < b[2] - 0.01){   
                return -1;
            }
            else{ 
                return 1;
            }
        });
      
        d3.selectAll(".star")
          .transition()
            .ease("linear")
            .attr("cx", function(d) { return x(d[0]); })
            .attr("cy", function(d) { return y(d[1]); })
            .duration(duration);
            
        /*var fadeclass = ".trail" + count.toString();
        d3.select("#starLayer").selectAll(fadeclass)
            .data(pos)
          .enter()
            .append("circle")
            .attr("cx", function(d) { return x(d[0]); })
            .attr("cy", function(d) { return y(d[1]); })
            .attr("r", function(d, i) { 
                if (masses[i] > 0.01) { 
                    return 0;
                } 
                else {
                    return 2;
                } 
            })
            .attr("fill", "rgb(255, 255, 255)")
            .attr("class", "trail "+fadeclass)
            .attr("filter", "url(#gaussblur2)")
          .transition()
            .delay(1000)
            .ease("linear")
            .style("opacity", .001)
            .duration(250)
            .remove();*/
    }
};


var setBackgroundImage = function() {
    var fBgImg;
    if (theme === "jeffers") {
        fBgImg = "images/htcas_2.jpg";
    }
    else if (theme === "kepler" || theme === "keplerP") {
        fBgImg = "images/purple-nebula.jpg";
    }
    d3.select("#backgroundImage").attr("xlink:href", fBgImg);
};