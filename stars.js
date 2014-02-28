function Star(pos, vel, mass){
    this.pos = pos; 
    this.vel = vel; 
    this.mass = mass; 
    this.acc = [0.0, 0.0, 0.0];

    this.getMass = function(){
        return this.mass;
    }

    this.getPos = function(){
        return this.pos;
    }
    
    this.resetAcc = function(){
        for(k = 0; k < 3; k++){
            this.acc[k] = 0.0;
        }
    }

    this.addAcc = function(acc){
        for(k = 0; k < 3; k++){
            this.acc[k] += acc[k];
        }
    }
    
    this.drift = function(dt){
        for(k = 0; k < 3; k++){
            this.pos[k] += this.vel[k] * dt;
        }
    }
    
    this.kick = function(dt){
        for(k = 0; k < 3; k++){
            this.vel[k] += this.acc[k] * dt;
        }
    }
}
