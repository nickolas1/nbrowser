var generateMasses = function(N) {
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
    for(var i = 0; i < N; i++){
        var fmi = fm1 - i * fmn;
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
    for(var i = 0; i < N; i++){
        var ri = 60;
        while(ri > 6){
            var a1 = 1.0e-11;
            while(a1 < 1.0e-10){
                a1 = Math.random();
            }
            ri = Math.pow(Math.pow(a1,-0.6666667) - 1.0, -0.5);
        }
        var a2 = Math.random();
        var a3 = Math.random();
        var posz = (1.0 - 2.0 * a2) * ri;
        var posx = Math.sqrt(ri * ri - posz * posz) * Math.cos(2 * Math.PI * a3);
        var posy = Math.sqrt(ri * ri - posz * posz) * Math.sin(2 * Math.PI * a3);
        positions.push([posx, posy, posz]);
    }     
    return positions;     
};       

var generateVelocities = function(N, positions) {
    // plummer sphere!
    var velocities = [];
    for(var i = 0; i < N; i++){
        var ri = 0.0;
        for(var k = 0; k < 3; k++){
            ri += positions[i][k] * positions[i][k];
        }
        ri = Math.sqrt(ri);       
        var a4 = 1;
        var a5 = 1000;
        var a6 = 1;
        while(a5 > 10*a6){
            a4 = Math.random();
            a5 = Math.random();
            a6 = a4 * 2 * Math.pow(1.0 - a4 * a4, 3.5);
        }
        var a8 = a4 * Math.SQRT2 / Math.pow((1.0 + ri * ri), 0.25);
        a6 = Math.random();
        var a7 = Math.random();
        var velz = (1.0 - 2.0 * a6) * a8;
        var velx = Math.sqrt(a8 * a8 - velz * velz) * Math.cos(2 * Math.PI * a7);
        var vely = Math.sqrt(a8 * a8 - velz * velz) * Math.sin(2 * Math.PI * a7);         
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

    for(var i = 0; i < N; i++){
        for(var k = 0; k < 3; k++){
            cm[0][k] += masses[i] * positions[i][k];
            cm[1][k] += masses[i] * velocities[i][k];
        }
    }   
    return cm;
};
    
calcKineticEnergy = function(N, masses, velocities){
    var ke = 0.0,
        v2;
        
    for(var i = 0; i < N; i++) {
        v2 = 0.0;
        for(var k = 0; k < 3; k++){
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
    for(var i = 0; i < N; i++){
        posi = positions[i];
        mi = masses[i]; 
        for(var j = i; j < N; j++){
            if(i != j){ //get the pairwise force and add to both stars
                posj = positions[j];
                mj = masses[j];

                r2 = 0.0
                for(var k = 0; k < 3; k++){
                    dr[k] = posj[k] - posi[k];
                    r2 += dr[k] * dr[k];
                }
                pot -= mi * mj / Math.sqrt(r2);
            }   
        }
    }
    return pot;
}

