/*jshint quotmark: double, unused: false */
/* global theme,h,w,x,y,nStars,d3,masses,pos,starApexes,apexStorage, lineFunction */
"use strict";

var initializeStarPlot = function() {
    var xrange,
        yrange;
    var colorChoices,
        colorChoices2,
        colors,
        colors2,
        c;
        
    // creates the svg representation of the stars
    if (theme === "jeffers") {
    
        xrange = 12;
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
            flip = (Math.random() < 0.5) ? 1.0 : -1.0;
            for (a = 0; a < rawApexes.length; a++) {
                stretchx = (0.4 * Math.random() - 0.2 + 1) * flip;
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
    else if (theme === "kepler" || theme === "keplerP") {
        xrange = 5;
        yrange = xrange * h / w;
        x.domain([-xrange/2, xrange/2]);
        y.domain([-yrange/2, yrange/2]);
        var massExtent;
        
        if (theme === "kepler") {
            colorChoices =  ["rgb(221, 56, 0)", "rgb(221, 137, 20)", "rgb(235, 170, 24)", "rgb(106, 137, 234)"];
            colorChoices2 = ["rgb(221, 38, 33)", "rgb(221, 56, 0)", "rgb(238, 128, 15)", "rgb(141, 125, 234)"];
            massExtent = d3.extent(masses);
        } else {
            colorChoices =  ["rgb(221, 56, 0)", "rgb(235, 170, 24)"];
            colorChoices2 = ["rgb(221, 38, 33)", "rgb(238, 128, 15)"];
            massExtent = [masses[3], masses[0]];
        }
        console.log(colorChoices);
        colors = d3.scale.linear()
            .domain(d3.range(0, 1.01, 1.0 / (colorChoices.length - 1)))
            .range(colorChoices);
        colors2 = d3.scale.linear()
            .domain(d3.range(0, 1.01, 1.0 / (colorChoices2.length - 1)))
            .range(colorChoices2);   
        c = d3.scale.log()
            .domain(massExtent)
            .range([0, 1]);
        console.log(masses);
        var starContainer = d3.select("#starLayer").selectAll("g")
            .data(pos)
          .enter()
            .append("g")
            .attr("class", "starContainer");
            
        starContainer
          .append("circle")
          .attr("class", "kepler star")
          .attr("cx", function(d) { return x(d[0]); })
          .attr("cy", function(d) { return y(d[1]); })
          .attr("r", function(d, i) { 
              if (masses[i] > 0.01) {
                  return 27 * Math.sqrt(masses[i]/d3.max(masses));
              } else {
                  return 4;
              }
          })
          .attr("fill", function(d, i) {
              if (masses[i] > 0.01) {
                  return colors(c(masses[i])); 
              } else {
                    return "rgb(43, 15, 118)";
              }
          })
          .attr("stroke", function(d, i) { 
              if (masses[i] > 0.01) { 
                  return colors2(c(masses[i]));
              } else { 
                  return "rgb(163, 182, 247)";
              }
          })
          .attr("stroke-width", 1)
          .attr("opacity", 0.9);
          
        starContainer
          .append("circle")
          .attr("class", "kepler star")
          .attr("cx", function(d) { return x(d[0]); })
          .attr("cy", function(d) { return y(d[1]); })
          .attr("r", function(d, i) { return 27 * Math.sqrt(masses[i]/d3.max(masses)); })
          .attr("fill", "none")
          .attr("stroke", function(d, i) { return colors2(c(masses[i])); })
          .attr("stroke-width", function(d, i) { return 9 * Math.sqrt(masses[i]/d3.max(masses)); })
          .attr("opacity", 0.9)
          .attr("filter", "url(#gaussblur2)");
        
        starContainer  
          .append("circle")
          .attr("class", "kepler star")
          .attr("cx", function(d) { return x(d[0]); })
          .attr("cy", function(d) { return y(d[1]); })
          .attr("r", function(d, i) { 
              if (masses[i] > 0.01) { 
                  return 8 * Math.sqrt(masses[i]/d3.max(masses));
              } 
              else {
                  return 0;
              } 
          })
          .attr("fill", "rgba(255, 255, 255, .8)")
          .attr("filter", "url(#gaussblur3)");
    }
};


var transitionStars = function(duration, starselection, containerselection) {
    if (theme === "jeffers") {
        var i, a;
        for (i = 0; i < nStars; i++) {
            for (a = 0; a < 11; a++){   
                starApexes[i][a][0] = apexStorage[i][a][0] + pos[i][0];
                starApexes[i][a][1] = apexStorage[i][a][1] + pos[i][1];
            }
        }
        starselection
          .transition()
            .ease("linear")
            .attr("d", lineFunction)
            .duration(duration);
    } else {
        if(theme === "keplerP") {
          // sort the planets and stars by z so that they occult each other correctly
          containerselection
            .sort( function(a, b) {
              if (a[2] < b[2] - 0.01){   
                  return -1;
              } else { 
                  return 1;
              }
          });
        }
        starselection
          .transition()
            .ease("linear")
            .attr("cx", function(d) { return x(d[0]); })
            .attr("cy", function(d) { return y(d[1]); })
            .duration(duration);
    }
};


var setBackgroundImage = function() {
    var fBgImg;
    if (theme === "jeffers") {
        fBgImg = "images/htcas_small.jpg";
    }
    else if (theme === "kepler" || theme === "keplerP") {
        fBgImg = "images/blue-nebula.jpg";
    }
    d3.select("#backgroundImage").attr("xlink:href", fBgImg);
};