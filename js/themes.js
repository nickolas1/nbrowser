var initializeStarPlot = function() {
    // creates the svg representation of the stars
    if (theme === "jeffers") {
    
        var xrange = 12,
            yrange = xrange * h / w;
        console.log(xrange, yrange);
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
        
        for (var i = 0; i < nStars; i++) {
            var thisApexes = [];
            var thisApexStorage = [];
            var mscale = 0.0007/d3.min(masses),
                flip,
                stretchx,
                stretchy;
            (Math.random() < 0.5) ? flip = 1.0 : flip = -1.0;
            for (var a = 0; a < rawApexes.length; a++) {
                var stretchx = (0.4 * Math.random() - 0.2 + 1) * flip,
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
        console.log(xrange, yrange);
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
};


var transitionStars = function(duration) {
    if (theme === "jeffers") {
        for (var i = 0; i < nStars; i++) {
            for (var a = 0; a < 11; a++){   
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
};


var setBackgroundImage = function() {
    var fBgImg;
    if (theme === "jeffers") {
        fBgImg = "images/htcas_2.jpg";
    }
    else if (theme === "kepler") {
        fBgImg = "images/purple-nebula.jpg";
    }
    d3.select("#backgroundImage").attr("xlink:href", fBgImg);
};