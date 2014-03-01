var generateMassesP = function(N) {
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

