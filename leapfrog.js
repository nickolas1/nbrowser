function Leapfrogger(){
  
    this.N = 32;
 
    this.positions = [];
    this.velocities = [];
    this.masses = [];
    this.mtot = 0.0;
    this.stars = [];
    this.xstretches = [];
    this.ystretches = [];

    this.canvasValid=true;
    this.fps = 30; // frames per second
    this.dt = .03/this.fps;
    this.canvas = null; // canvas DOM object
    this.context = null; // canvas context

    this.init = function() {
        this.canvas = document.getElementById("nbodyCanvas");
        
        if(this.canvas.getContext){
            this.context = this.canvas.getContext("2d");
            
            this.canvas.onselectstart = function () { return false; }
            var s_ = this;
            setInterval(function() { s_.advance(); }, this.delta_t);
        
            // set up a plummer sphere
            this.masses = this.generate_masses();
            this.positions = this.generate_positions();
            this.velocities = this.generate_velocities();
            
            // move to center of mass and set up in virial equilibrium
            this.move_to_cm();
            this.equilibrate();
            
            // get randomisations of star shapes
            this.setup_stretches();
       
            // initialise the stars
            for(var i = 0; i < this.N; i++){
                //document.write(this.positions[i],' ',this.velocities[i],' ',this.mass[i]);
                this.addStar(this.positions[i], this.velocities[i], this.masses[i]);
            }
            // draw them
            this.draw_stars();
            // calculate initial accelerations
            this.calc_accels();
        }
    }

    this.leapfrog = function(dt){
        for(var i = 0; i < this.N; i++){
            this.stars[i].kick(0.5 * dt);
        }
        
        for(var i = 0; i < this.N; i++){
            this.stars[i].drift(dt);
        }
        this.calc_accels();
        
        for(var i = 0; i < this.N; i++){
            this.stars[i].kick(0.5 * dt);
        }
    }
                    

    this.calc_accels = function(){
        var dr = [0.0, 0.0, 0.0];
        var r2 = 0.0;
        var r3 = 0.0;
        var acc = [0.0, 0.0, 0.0];
        
        for(var i = 0; i < this.N; i++){
            this.stars[i].resetAcc();
        }
        
        for(var i = 0; i < this.N; i++){
            posi = this.stars[i].getPos();
            mi = this.stars[i].getMass();
            
            for(var j = i; j < this.N; j++){
                if(i != j){ //get the pairwise force and add to both stars
                    posj = this.stars[j].getPos();
                    mj = this.stars[j].getMass();
                    r2 = 0.0
                    for(var k = 0; k < 3; k++){
                        dr[k] = posj[k] - posi[k];
                        r2 += dr[k] * dr[k]
                    }
                    r3 = r2 * Math.sqrt(r2) + 1.e-7;
                    
                  // document.write(posi+' '+posj+' '+Math.sqrt(r2)+' - ');
                    
                    for(var k = 0; k < 3; k++){
                        acc[k] = mj * dr[k] / r3;
                    }
                    
                    this.stars[i].addAcc(acc);
                    
                    for(var k = 0; k < 3; k++){
                        acc[k] *= (-mi / mj);
                    }
                    this.stars[j].addAcc(acc);
                } 
            }
        }
    }
                    

    this.advance = function(){
        // take a step
        this.leapfrog(this.dt);
               
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // draw the stars
        this.draw_stars();
    }


    this.addStar= function(r0, v0, m){
        var p = new Star(r0, v0, m);
        this.stars.push(p);
    }

    this.draw_stars = function(){
        for(var i = 0; i < this.N; i++){
            var pos = this.stars[i].getPos();
            var cpos = this.get_canvas_pos(pos);
            var mass = this.stars[i].getMass() * this.mtot;

            // star apexes
            var xs = [-2.5, -2, 1, 2, 2.5, 5, 2, 0.5, -1.5, -5.5, -2.5];
            var ys = [0.5, 6.5, 1.6, 7.5, 0.5, -2, -1.5, -5.5, -1, -0.7, 0.5];
            
            if(mass > 6){
                var s = 2.5;
            }
            else if(mass <= 6 && mass > 3){
                var s = 1.5;
            }
            else if(mass <= 3 && mass > 1){
                var s = 1.1;
            }
            else{
                var s = 0.8;
            }
            
            var cx = cpos[0];
            var cy = cpos[1];
        
            this.context.beginPath();  
            
            this.context.moveTo(xs[0]*s*this.xstretches[i][0] + cx,ys[0]*s*this.ystretches[i][0] + cy);
            for(var j = 1; j < 10; j++){
                this.context.lineTo(xs[j]*s*this.xstretches[i][j] + cx,ys[j]*s*this.ystretches[i][j] + cy);
            }
            this.context.lineTo(xs[10]*s*this.xstretches[i][10] + cx,ys[10]*s*this.ystretches[i][10] + cy);
            
            this.context.closePath();
            this.context.fillStyle = 'white';
            this.context.fill(); 
            

        }
    }

    
    this.generate_masses = function(){
        // power law mass function from 1 to 10, alpha = -2.3
        var alpha = 2.3;
        var mhi = 10.0
        var mlo = 1.0;
        var alpham1 = alpha - 1;
        var fm1 = 1.0 / Math.pow(mhi, alpham1);
        var fmn = (fm1 - 1.0 / Math.pow(mlo, alpham1)) / (this.N - 1);
        var constant = 1.0 / alpham1;
        var masses = [];
        var mtot = 0.0;
        
        for(var i = 0; i < this.N; i++){
            var fmi = fm1 - i * fmn;
            mass = 1.0 / Math.pow(fmi, constant);
            mtot += mass;
            masses.push(mass);
        }   
        for(var i = 0; i < this.N; i++){
            masses[i] /= mtot;
        }
        this.mtot = mtot;      
        return masses;     
    }


    this.generate_positions = function(){
        // plummer sphere!
        var positions = [];
   
        for(var i = 0; i < this.N; i++){
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
    }        
 
 
    this.generate_velocities = function(){
        // plummer sphere!
        var velocities = [];
   
        for(var i = 0; i < this.N; i++){
            var ri = 0.0;
            for(var k = 0; k < 3; k++){
                ri += this.positions[i][k] * this.positions[i][k];
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
            
            velocities.push([velx, vely, velz]);
        }
        
        return velocities;
    }
    
    this.move_to_cm = function(){
        var cmp = [0.0, 0.0, 0.0]; 
        var cmv = [0.0, 0.0, 0.0]; 

        for(var i = 0; i < this.N; i++){
            for(var k = 0; k < 3; k++){
                cmp[k] += this.masses[i] * this.positions[i][k];
                cmv[k] += this.masses[i] * this.velocities[i][k];
            }
        }   

        for(var i = 0; i < this.N; i++){
            for(var k = 0; k < 3; k++){
                this.positions[i][k] -= cmp[k];
                this.velocities[i][k] -= cmv[k];
            }
        } 
    }
    
    this.equilibrate = function(){
        // total mass is 1 by this point and we're in cm frame
        var ke = this.kinetic();
        var pe = this.potential();
        scalepos = -0.25 / (ke + pe);
        scalevel = Math.sqrt(scalepos);
        
        for(var i = 0; i < this.N; i++){
            for(var k = 0; k < 3; k++){
                this.positions[i][k] /= scalepos;
                this.velocities[i][k] *= scalevel;
            }
        }            
    }
    
    this.setup_stretches = function(){        
        for(var i = 0; i < this.N; i++){
            var stretchx = [];
            var stretchy = [];
            var flip = Math.random();
            if(flip < 0.5){
                flip = 1.0;
            }
            else{
                flip = -1.0;
            }
            for(var j = 0; j < 10; j++){
                stretchx.push((0.4 * Math.random() - 0.2 + 1) * flip);
                stretchy.push(0.4 * Math.random() - 0.2 + 1);
            }
            this.xstretches.push(stretchx);
            this.ystretches.push(stretchy);        
        }   
    }    
    
    this.kinetic = function(){
        var ke = 0.0;
        for(var i = 0; i < this.N; i++){
            var v2 = 0.0;
            for(var k = 0; k < 3; k++){
                v2 += this.velocities[i][k] * this.velocities[i][k];
            }
            ke += 0.5 * this.masses[i] * v2;
        }
        return ke;
    }
    
    
    this.potential = function(){
        var dr = [0.0, 0.0, 0.0];
        var r2 = 0.0;
        var pot = 0.0;
        for(var i = 0; i < this.N; i++){
            posi = this.positions[i];
            mi = this.masses[i];
            
            for(var j = i; j < this.N; j++){
                if(i != j){ //get the pairwise force and add to both stars
                    posj = this.positions[j];
                    mj = this.masses[j];

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
    
    this.get_canvas_pos = function(pos){
        var canvascenter = [480, 100, 0];
        var scale = 50;
        var cpos = [0.0, 0.0, 0.0];
        for(var k = 0; k < 3; k++){
            cpos[k] = pos[k] * scale + canvascenter[k];
        }
        return cpos;
    }
    
}
