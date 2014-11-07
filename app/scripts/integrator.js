/*jshint quotmark: double, unused: false*/
"use strict";
/* global d3, 
Cluster
 */


function Integrator(N) {

    this.sps = 60; /* steps per second */
    this.redraw = 2;
    this.transitionTime = 250;
    this.N = N;
    var dt;
    
    this.cluster = new Cluster(this.N);
    this.cluster.equilibrateStars();
    
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
    
    
    stars.forEach(function (v, i, stars1) {
        stars.forEach(function (w, j, stars2) {
            if(j > i) {
                r2 = 0.0;
                for(k = 0; k < 3; k = k + 1){
                    dr[k] = stars2[j].pos[k] - stars1[i].pos[k];
                    r2 += dr[k] * dr[k];
                }
                r3 = r2 * Math.sqrt(r2) + 1.e-7;
        
                for(k = 0; k < 3; k = k + 1){
                    a = dr[k] / r3;
                    stars1[i].acc[k] += a * stars2[j].mass;
                    stars2[j].acc[k] -= a * stars1[i].mass;          
                }
                /*console.log(stars1[i].acc[0]+' '+stars1[i].vel[0]);
                console.log(stars2[j].acc[0]+' '+stars2[j].vel[0]);*/
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
