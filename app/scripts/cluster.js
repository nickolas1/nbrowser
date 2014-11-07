/*jshint quotmark: double, unused: false  */
"use strict";
/*global Body*/

function Cluster(N) {
  this.N = N;
  var masses = this.generateMasses(),
      pos = this.generatePositions(),
      vel = this.generateVelocities(pos);

  this.stars = Array.apply(null, new Array(N)).map(Number.prototype.valueOf,0);
  
  this.stars.forEach(function (v, i, a) {
      a[i] = new Body(i, masses[i], pos[i], vel[i], [0, 0, 0]);
  });  
}

Cluster.prototype.generateMasses = function() {
    // power law mass function from 1 to 10, alpha = -2.3
    var alpha = 2.3,
        mhi = 10.0,
        mlo = 1.0;
    var alpham1 = alpha - 1,
        fm1 = 1.0 / Math.pow(mhi, alpham1),
        fmn = (fm1 - 1.0 / Math.pow(mlo, alpham1)) / (this.N - 1),
        constant = 1.0 / alpham1;
    var mass,
        mtot = 0.0,
        fmi;  
    var masses = Array.apply(null, new Array(this.N)).map(Number.prototype.valueOf,0);

    masses.forEach(function (v, i) {
      fmi = fm1 - i * fmn;
      masses[i] = 1.0 / Math.pow(fmi, constant);
      mtot += masses[i];
    });
    
    masses.forEach(function (v, i) {
      masses[i] /= mtot;   
    });      
   
    return masses;     
};

Cluster.prototype.generatePositions = function() {
    // plummer sphere!
    var positions = Array.apply(null, new Array(this.N)).map(Number.prototype.valueOf,0);  
    var ri, a1, a2, a3, posx, posy, posz;
    
    positions.forEach(function (v, i) {
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
      positions[i] = [posx, posy, posz];
    });
    
    return positions;     
};       

Cluster.prototype.generateVelocities = function(positions) {
    // plummer sphere!
    var velocities = Array.apply(null, new Array(this.N)).map(Number.prototype.valueOf,0);
    var k, ri, a4, a5, a6, a7, a8, velx, vely, velz;
    
    velocities.forEach(function (v, i) {
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
        velocities[i] = [0.1*velx, 0.1*vely, 0.1*velz];  
        // multiply by 0.1 to ensure potential greater than kinetic for rescaling part and low n. velocities are rescaled later
    });
       
    return velocities;
};

Cluster.prototype.calcCM = function() {
    var cm = [
            [0.0, 0.0, 0.0],  // center of mass position
            [0.0, 0.0, 0.0]   // center of mass velocity
        ]; 
    var k;
    
    this.stars.forEach(function (v) {
      for(k = 0; k < 3; k++){
          cm[0][k] += v.mass * v.pos[k];
          cm[1][k] += v.mass * v.vel[k];
      }
    });
    
    this.cm = cm;   
};

Cluster.prototype.calcKineticEnergy = function() {
    var ke = 0.0,
        v2;
    var k;
    
    this.stars.forEach(function (v) {    
        v2 = 0.0;
        for(k = 0; k < 3; k++){
            v2 += v.vel[k] * v.vel[k];
        }
        ke += 0.5 * v.mass * v2;
    });
    
    this.kineticEnergy = ke;
};

Cluster.prototype.calcPotentialEnergy = function() {
    var dr = [0.0, 0.0, 0.0],
        r2,
        pot = 0.0,
        posi,
        mi,
        posj,
        mj;
    var i, j, k;
    
    this.stars.forEach(function (star1, i) {
        this.stars.forEach(function (star2, j) {
            if(j > i) { //get the pairwise force and add to both stars
                r2 = 0;
                for(k = 0; k < 3; k++){
                    dr[k] = star2.pos[k] - star1.pos[k];
                    r2 += dr[k] * dr[k];
                }
                pot -= star1.mass * star2.mass / Math.sqrt(r2);
            }   
        });
    }, this);
    this.potentialEnergy = pot;
};

Cluster.prototype.equilibrateStars = function() {
    var scalepos,
        scalevel;
    var i, k;

    this.calcCM();
    this.calcKineticEnergy();
    this.calcPotentialEnergy();

    // move to the center of mass
    this.stars.forEach(function (v, i, a) {
        for (k = 0; k < 3; k++) {
            a[i].pos[k] -= this.cm[0][k];
            a[i].vel[k] -= this.cm[1][k];
        }
    }, this);  

    // scale energy to be in virial equilibrium
    scalevel = Math.sqrt(-0.5 * this.potentialEnergy / this.kineticEnergy);
    this.stars.forEach(function (v, i, a) {
        for(k = 0; k < 3; k++){
            a[i].vel[k] *= scalevel;
        }
    });
    this.kineticEnergy *= scalevel*scalevel;

    // scale so that total energy is -0.25
    scalepos = -0.25 / (this.kineticEnergy + this.potentialEnergy);
    scalevel = Math.sqrt(scalepos);
    this.stars.forEach(function (v, i, a) {
        for(k = 0; k < 3; k++){
            a[i].pos[k] /= scalepos;
            a[i].vel[k] *= scalevel;
        }
    }); 
};

