//(function() {
    /**
     * Returns the number as a string, with 0 prepended to ensure it is at
     * least two digits long
     *
     * @param {number or string} n      the number to pad
     */
    var pad = function(n) {
        n = "" + n;
        return n < 10 ? '0' + n: n;
    }

    /**
     * Returns a string representation of the provided date in YYYY-MM-DD
     * format
     *
     * @param {Date} d          the date object
     *
     * @returns {string} formatted string version of the date
     */
     var redisDateString = function(d) {
        return d.getUTCFullYear() + "-"
            + pad(d.getUTCMonth() + 1) + "-"
            + pad(d.getUTCDate());
    }

    /**
     * Returns a string representation of the hours of the provided date in HH
     * format
     *
     * @param {Date} d          the date object
     *
     * @returns {string} the formatted string of the date's hours attribute
     */
    var redisHourString = function(d) {
        return pad(d.getUTCHours());
    }

    //////
    // build graph

    var weekOfRedisDates = (function(howMany) {
        dates = [];
        currentDate = new Date();
        for(var i = 0; i < howMany; i++) {
            dates.push(redisDateString(currentDate));
            currentDate.setDate(currentDate.getDate() - 1);
        }
        return dates;
    }(7));

    var data = [];
    var pointer = -1;
    var recursiveFetch = function() {
        if (arguments.length) {
            count = arguments[0].length
            date = weekOfRedisDates[pointer];
            data.push({count: count, date: date});
        } else {
            if (pointer > -1) {
                data.push([]);
            }
        }
        pointer += 1;
        if (pointer >= weekOfRedisDates.length) {
            renderBuildGraph();
            return;
        }
        d3.json('/builds/?date=' + weekOfRedisDates[pointer], recursiveFetch);
    };

    recursiveFetch();
    var renderBuildGraph = function() {
        var width = 350,
            height = 300,
            barWidth = width / data.length,
            barHeight = height,
            x = d3.scale.linear()
                .domain([0, 1]) // index is the domain on the x-axis
                .range([0, barWidth]), // domain is unbounded, range will scale
            y = d3.scale.linear()
                .domain([0, d3.max(data, function(d) { return d.count; })])
                .rangeRound([0, height]),
            chart = d3.select('#buildgraph')
                .append('svg')
                .attr('width', width - 1)
                .attr('height', height);

            // axis lines
            chart.selectAll('line')
                .data(y.ticks(5))
              .enter().append('line')
                .attr('x1', 0)
                .attr('x2', width)
                .attr('y1', function(v) { return height - y(v); })
                .attr('y2', function(v) { return height - y(v); })
                .style('stroke', '#ccc');

            // axis labels
            chart.selectAll('.rule')
                .data(y.ticks(5))
              .enter().append('text')
                .attr('class', 'rule')
                .attr('x', 0)
                .attr('y', function(v) { return height - y(v) - 3; })
                .text(String);

            // paint the bars with a data join
            chart.selectAll('rect')
                .data(data)
              .enter().append('rect')
                .attr('x', function(d, i) { return x(i) - .5;  }) // .5 offsets to avoid antialiasing
                .attr('y', function(d, i) { return height - y(d.count) - .5; })
                .attr('width', barWidth)
                .attr('height', function(d) { return y(d.count); });

            // label the columns
            chart.selectAll('text')
                .data(data.map(function(d) { return d.count; }))
              .enter().append('text')
                .attr('class', 'label'
                .attr('x', function(d) { return x(d) + x.rangeBand() / 2; })
                .attr('y', height)
                .attr('dx', '.35em')
                .attr('dy', -3) // vertical padding
                .style('color', 'white')
                .text(String)

            // baseline
            chart.append("line")
                .attr('x1', 0)
                .attr('x2', width)
                .attr('y1', height - 0.5)
                .attr('y2', height - 0.5)
                .style('stroke', '#000');
    };
//}());
