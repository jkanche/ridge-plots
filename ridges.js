'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var d3 = require('d3');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var d3__namespace = /*#__PURE__*/_interopNamespace(d3);

/**
 * Base class for ridge plots.
 * This class is not to be used directly.
 *
 * @class RidgePlot
 */
class RidgePlot {
  /**
   * Creates an instance of BaseGL.
   * @param {string} selectorOrElement, a html dom selector or element.
   * @memberof RidgePlot
   */
  constructor(selectorOrElement) {
    this.elem = selectorOrElement;
    if (
      typeof selectorOrElement === "string" ||
      selectorOrElement instanceof String
    ) {
      this.elem = document.querySelector(selectorOrElement);
    }

    if (!(this.elem instanceof HTMLElement)) {
      throw `${selectorOrElement} is neither a valid dom selector nor an element on the page`;
    }

    this.data = null;
    this.state = {};
  }

  _check_for_data() {
    if (
      typeof this.data !== "object" ||
      Array.isArray(this.data) ||
      this.data === null ||
      this.data === undefined
    ) {
      throw `'data' is not a valid type! Must be an 'object' and cannot be 'null'.`;
    }
  }

  /**
   * Set the input data for the visualization.
   * The name of the object specifies the label and must contain
   * median, mean, min, max & all values
   *
   * @param {object} data, input data to set
   * @memberof RidgePlot
   */
  setInput(data) {
    this.data = data;

    this._check_for_data();

    this._dentries = Object.entries(data).map((val) => [val[0], val[1]]);
    this._dkeys = this._dentries.map((x) => {
      return x[0];
    });
  }

  /**
   * resize the plot.
   * TODO: can do better at just resizing the SVG
   *
   * @param {number} width
   * @param {number} height
   * @memberof RidgePlot
   */
  resize(width, height) {
    this.render(width, height);
  }

  /**
   * Save the plot as SVG.
   * @param {String} filename name of the file to save the svg
   *
   * @memberof RidgePlot
   */
  savePlot(filename) {
    if (this.elem.querySelector("svg")) {
      let tmpsvg = this.elem.querySelector("svg").outerHTML;

      let tmpLink = document.createElement("a");
      tmpsvg = tmpsvg.replace(
        "<svg",
        `<svg viewbox="-20 -20 1200 280" xmlns="http://www.w3.org/2000/svg"`
      );
      let fileNew = new Blob([tmpsvg], {
        type: "text/svg",
      });

      tmpLink.href = URL.createObjectURL(fileNew);
      tmpLink.download = filename;
      tmpLink.click();

      tmpLink.remove();
    }
  }

  /**
   * Attach a callback for window resize events
   *
   * @memberof RidgePlot
   */
  attachResizeEvent() {
    var self = this;
    // set window timesize event once
    let resizeTimeout;
    window.addEventListener("resize", () => {
      // similar to what we do in epiviz
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = setTimeout(() => {
        self.resize(
          self.elem.parentNode.clientWidth,
          self.elem.parentNode.clientHeight
        );
      }, 500);
    });
  }

  _setTitleAndFooter(svg) {
    if ("title" in this.state) {
      svg
        .append("text")
        .attr("text-anchor", "center")
        .attr("x", 10)
        .attr("y", 0)
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(this.state.title);
    }

    if ("footer" in this.state) {
      svg
        .append("text")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height + margin.bottom)
        .style("font-size", "10px")
        .style("font-style", "italic")
        .text(this.state.footer);
    }
  }
}

/**
 * Make a vertical ridgeline plot
 *
 * @class VerticalRidgePlot
 * @extends {RidgePlot}
 */
class VerticalRidgePlot extends RidgePlot {
  /**
   * Creates an instance of VerticalRidgePlot.
   * @param {string} selectorOrElement, a html dom selector or element.
   * @memberof VerticalRidgePlot
   */
  constructor(selectorOrElement) {
    super(selectorOrElement);
  }

  /**
   * Set the state of the visualization.
   *
   * @param {object} state, a set of attributes that modify the rendering
   * @param {string} state.title, title of the plot
   * @param {string} state.footer, footer of the plot (shown in the bottom-right corner)
   * @param {string} state.xLabel, x-label of the plot
   * @param {string} state.yLabel, y-label of the plot
   * @param {string} state.metric, name of the metric to plot
   * @param {boolean} state.gradient, use a gradient to color the ridges?
   * @param {Array} state.yminmax, use a custom min and max for the y axis.
   * @param {Function} state.onClick, Use a custom OnClick callback when groups are clicked.
   * @param {Number} state.ticks, number of ticks for histogram
   * @memberof VerticalRidgePlot
   */
  setState(state) {
    this.state = state;
  }

  /**
   * Render the plot. Optionally provide a height and width.
   *
   * @param {?number} width, width of the canvas to render the plot.
   * @param {?number} height, height of the canvas to render the plot.
   * @memberof VerticalRidgePlot
   */
  render(width = 400, height = 400) {
    this._check_for_data();

    const margin = { top: 10, right: 10, bottom: 150, left: 30 };
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;
    let self = this;

    if (this.elem.querySelector("svg")) {
      this.elem.querySelector("svg").innerHTML = "";
    }

    const svg = d3__namespace
      .select(this.elem)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    var x = d3__namespace.scaleBand().range([0, width]).domain(this._dkeys).padding(0.2);

    this._setTitleAndFooter(svg);

    if ("yLabel" in this.state) {
      svg
        .append("text")
        .attr("text-anchor", "end")
        .attr("y", -40)
        .style("font-size", "10px")
        .attr("transform", "rotate(-90)")
        .text(this.state.yLabel);
    }

    let xAxis = svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3__namespace.axisBottom(x));

    var wrap = function () {
      var self = d3__namespace.select(this),
        textLength = self.node().getComputedTextLength(),
        text = self.text();
      while (textLength > 130 && text.length > 0) {
        text = text.slice(0, -1);
        self.text(text + "...");
        textLength = self.node().getComputedTextLength();
      }
    };

    xAxis
      .selectAll("text")
      .style("color", "#133355")
      .style("cursor", "pointer")
      .style("font-size", (d, i) => {
        if (self._hoverKey === self._dkeys.indexOf(d)) {
          return "14px";
        }
        return "12px";
      })
      .style("font-weight", (d, i) => {
        if (self._hoverKey === self._dkeys.indexOf(d)) {
          return "bold";
        }
        return "normal";
      })
      .attr("transform", "translate(-10,5)rotate(-55)")
      .style("text-anchor", "end")
      .each(wrap)
      .on("mouseover", (event, d) => {
        const idx = self._dkeys.indexOf(d);
        const mets = self._dentries[idx][1];

        self._hoverKey = idx;
        tip
          .style("opacity", 1)
          .html(
            `<span>${d}</span><br/><span>median: ${mets?.median.toFixed(
              2
            )}</span><br/><span>mean: ${mets?.mean.toFixed(
              2
            )}</span><br/><span>min: ${mets?.min.toFixed(2)}</span>
            <br/><span>max: ${mets?.max.toFixed(2)}</span>`
          )
          // .style("left", x(d[0]) + 20 + "px")
          // .style("top", height - margin.top - margin.bottom + "px");
          .style("left", event.clientX + "px")
          .style("top", event.clientY + "px");
      })
      .on("mouseout", function (event, d) {
        self._hoverKey = null;
        tip.style("opacity", 0);
      })
      .on("click", function (e, d) {
        const idx = self._dkeys.indexOf(d);
        const mets = self._dentries[idx];
        if (mets !== null && mets !== undefined && "onClick" in self.state) {
          self.state.onClick(mets);
        }
      });

    let yminmax;
    if ("yminmax" in this.state) {
      yminmax = this.state.yminmax;
    } else {
      yminmax = d3__namespace.extent(this._dentries.map((x) => Math.max(...x[1].values)));
    }

    var y = d3__namespace.scaleLinear().domain([0, yminmax[1]]).range([height, 0]).nice();

    svg.append("g").call(d3__namespace.axisLeft(y));

    // OPTION 1: Compute kernel density estimation for each column:
    // let kde = kernelDensityEstimator(kernelEpanechnikov(1.25), y.ticks(40));
    // let allCurves = [],
    //   allMax = 0;
    // for (let i = 0; i < n; i++) {
    //   let key = categories[i];
    //   console.log(data[key]);
    //   let density = kde(data[key].values);
    //   let dMax = Math.max(...density.map((x) => x[1]));
    //   if (dMax > allMax) {
    //     allMax = dMax;
    //   }
    //   allCurves.push({ key: key, dist: density });
    // }

    // OPTION 2
    // Features of the histogram
    var histogram = d3__namespace
      .bin()
      .domain(y.domain())
      .thresholds(y.ticks(20))
      .value((d) => d);

    let sumstat = [];
    for (let i = 0; i < this._dentries.length; i++) {
      const d = this._dentries[i];
      sumstat.push({ key: d[0], value: histogram(d[1].values) });
    }

    // Color scale for median values
    var colorScale = "#5b9cd2";
    if ("gradient" in this.state && this.state.gradient === true) {
      colorScale = d3__namespace
        .scaleSequential()
        .interpolator(d3__namespace.interpolateInferno)
        .domain([0, yminmax[1]]);
    }

    function getColor(i) {
      if (typeof colorScale === "string" || colorScale instanceof String) {
        return colorScale;
      } else {
        return colorScale(self.data[d.key][self.state.metric]);
      }
    }

    // draw the curve
    svg
      .selectAll("kernelRidges")
      .data(sumstat)
      .enter()
      .append("g")
      .attr("transform", function (d) {
        return "translate(" + x(d.key) + " ,0)";
      })
      .append("path")
      .attr("fill", function (d, i) {
        return getColor(d.key);
      })
      // .attr("fill", function(d) {
      //   console.log(d);
      //   console.log(data[d.key])
      //   return colorScale(data[d.key].median)
      // })
      .attr("stroke", "none")
      .style("opacity", 1)
      .attr("d", function (bin, i) {
        // per bin x curve
        let lengths = d3__namespace.max(
          bin.value.map(function (a) {
            return a.length;
          })
        );

        let xCurves = d3__namespace
          .scaleLinear()
          .range([0, x.bandwidth() * 1.4])
          .domain([lengths, -lengths]);

        return d3__namespace
          .area()
          .x0(xCurves(0))
          .x1(function (d) {
            return xCurves(d.length);
          })
          .y(function (d) {
            return y(d.x0);
          })
          .curve(d3__namespace.curveCatmullRom)(bin.value);
      })
      .on("mouseover", function (event, d) {
        const idx = self._dkeys.indexOf(d.key);
        const mets = self._dentries[idx][1];

        self._hoverKey = idx;

        tip
          .style("opacity", 1)
          .html(
            `<span>${d.key}</span><br/><span>median: ${mets?.median.toFixed(
              2
            )}</span><br/><span>mean: ${mets?.mean.toFixed(
              2
            )}</span><br/><span>min: ${mets?.min.toFixed(2)}</span>
            <br/><span>max: ${mets?.max.toFixed(2)}</span>`
          )
          // .style("left", x(d[0]) + 20 + "px")
          // .style("top", height - margin.top - margin.bottom + "px");
          .style("left", event.clientX + "px")
          .style("top", event.clientY + "px");
      })
      .on("mouseout", function (event, d) {
        self._hoverKey = null;
        tip.style("opacity", 0);
      })
      .on("click", function (e, d) {
        const idx = self._dkeys.indexOf(d.key);
        const mets = self._dentries[idx][1];
        if (mets !== null && mets !== undefined && "onClick" in self.state) {
          self.state.onClick(mets);
        }
      });

    let bars = svg.selectAll("bars").data(this._dentries);

    const bar_width_ratio = 0.7;

    bars
      .enter()
      .append("line")
      .attr("x1", (d) => {
        return x(d[0]) + x.bandwidth() * bar_width_ratio;
      })
      .attr("x2", (d) => {
        return x(d[0]) + x.bandwidth() * bar_width_ratio;
      })
      .attr("y1", (d) => {
        return y(d[1]?.min);
      })
      .attr("y2", (d) => {
        return y(d[1]?.max);
      })
      .attr("stroke", "#353535")
      .style("stroke-opacity", 0.7);

    var tip = d3__namespace
      .select(this.elem)
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute");

    bars
      .enter()
      .append("rect")
      .attr("x", (d) => {
        return x(d[0]) + x.bandwidth() * bar_width_ratio;
      })
      .attr("y", (d) => {
        return y(d[1]?.quantiles[2]);
      })
      .attr("width", x.bandwidth() * (1 - bar_width_ratio))
      .attr("height", (d) => {
        return y(d[1]?.quantiles[0]) - y(d[1]?.quantiles[2]);
      })
      .attr("fill", function (d, i) {
        return getColor(d[0]);
      })
      .style("opacity", 0.5)
      .on("mouseover", (event, d) => {
        const idx = self._dkeys.indexOf(d[0]);
        const mets = self._dentries[idx][1];

        self._hoverKey = idx;

        tip
          .style("opacity", 1)
          .html(
            `<span>${d[0]}</span><br/><span>median: ${mets?.median.toFixed(
              2
            )}</span><br/><span>mean: ${mets?.mean.toFixed(2)}</span>
            <br/><span>min: ${mets?.min.toFixed(2)}</span>
            <br/><span>max: ${mets?.max.toFixed(2)}</span>`
          )
          // .style("left", x(d[0]) + 20 + "px")
          // .style("top", height - margin.top - margin.bottom + "px");
          .style("left", event.clientX + "px")
          .style("top", event.clientY + "px");
      })
      .on("mouseout", function (event, d) {
        self._hoverKey = null;
        tip.style("opacity", 0);
      })
      .on("click", function (e, d) {
        const idx = self._dkeys.indexOf(d[0]);
        const mets = self._dentries[idx][1];
        if (mets !== null && mets !== undefined && "onClick" in self.state) {
          self.state.onClick(mets);
        }
      });

    // min
    bars
      .enter()
      .append("line")
      .attr("x1", (d) => {
        return x(d[0]) + x.bandwidth() * bar_width_ratio;
      })
      .attr("x2", (d) => {
        return x(d[0]) + x.bandwidth();
      })
      .attr("y1", (d) => {
        return y(d[1]?.min);
      })
      .attr("y2", (d) => {
        return y(d[1]?.min);
      })
      .attr("stroke", "#353535")
      .attr("stroke-width", 1);

    // max
    bars
      .enter()
      .append("line")
      .attr("x1", (d) => {
        return x(d[0]) + x.bandwidth() * bar_width_ratio;
      })
      .attr("x2", (d) => {
        return x(d[0]) + x.bandwidth();
      })
      .attr("y1", (d) => {
        return y(d[1]?.max);
      })
      .attr("y2", (d) => {
        return y(d[1]?.max);
      })
      .attr("stroke", "#353535")
      .attr("stroke-width", 1);

    // mean > MEDIAN
    bars
      .enter()
      .append("line")
      .attr("x1", (d) => {
        return x(d[0]) + x.bandwidth() * bar_width_ratio;
      })
      .attr("x2", (d) => {
        return x(d[0]) + x.bandwidth();
      })
      .attr("y1", (d) => {
        return y(d[1]?.median);
      })
      .attr("y2", (d) => {
        return y(d[1]?.median);
      })
      .attr("stroke", "#353535")
      .attr("stroke-width", 1);
  }
}

/**
 * Make a horizontal ridgeline plot
 *
 * @class HorizontalRidgePlot
 * @extends {RidgePlot}
 */
class HorizontalRidgePlot extends RidgePlot {
  /**
   * Creates an instance of HorizontalRidgePlot.
   * @param {string} selectorOrElement, a html dom selector or element.
   * @memberof HorizontalRidgePlot
   */
  constructor(selectorOrElement) {
    super(selectorOrElement);

    this._width = document.body.clientWidth * 0.9;
    this._height = 500;
  }

  /**
   * Set the state of the visualization.
   *
   * @param {object} state, a set of attributes that modify the rendering
   * @param {string} state.title, title of the plot
   * @param {string} state.footer, footer of the plot (shown in the bottom-right corner)
   * @param {string} state.xLabel, x-label of the plot
   * @param {string} state.yLabel, y-label of the plot
   * @param {string} state.metric, name of the metric to plot
   * @param {boolean} state.gradient, use a gradient to color the ridges?
   * @param {Array} state.xminmax, use a custom min and max for the x axis.
   * @param {Function} state.onClick, Use a custom OnClick callback when groups are clicked.
   * @param {Number} state.ticks, number of ticks for histogram
   * @memberof HorizontalRidgePlot
   */
  setState(state) {
    this.state = state;
  }

  /**
   * Render the plot. Optionally provide a height and width.
   *
   * @param {?number} width, width of the canvas to render the plot.
   * @param {?number} height, height of the canvas to render the plot.
   * @memberof HorizontalRidgePlot
   */
  render(width, height) {
    this._check_for_data();

    const margin = { top: 10, right: 10, bottom: 40, left: 150 };
    width = width - margin.left - margin.right;
    height = height - margin.top - margin.bottom;

    let self = this;

    if (this.elem.querySelector("svg")) {
      this.elem.querySelector("svg").innerHTML = "";
    }

    const svg = d3__namespace
      .select(this.elem)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    var y = d3__namespace.scaleBand().range([0, height]).domain(this._dkeys).padding(0.2);

    this._setTitleAndFooter(svg);

    if ("yLabel" in this.state) {
      svg
        .append("text")
        .attr("text-anchor", "end")
        .attr("y", -40)
        .style("font-size", "10px")
        .attr("transform", "rotate(-90)")
        .text(this.state.yLabel);
    }

    if ("xLabel" in this.state) {
      svg
        .append("text")
        .attr("text-anchor", "end")
        .attr("x", width / 2)
        .attr("y", height + 30)
        .style("font-size", "12px")
        // .attr("transform", "rotate(-90)")
        .text(this.state.xLabel);
    }

    let yAxis = svg.append("g").call(d3__namespace.axisLeft(y));

    var wrap = function () {
      var self = d3__namespace.select(this),
        textLength = self.node().getComputedTextLength(),
        text = self.text();
      while (textLength > 130 && text.length > 0) {
        text = text.slice(0, -1);
        self.text(text + "...");
        textLength = self.node().getComputedTextLength();
      }
    };

    yAxis
      .selectAll("text")
      .style("color", "#133355")
      .style("cursor", "pointer")
      .style("font-size", (d, i) => {
        if (self._hoverKey === self._dkeys.indexOf(d)) {
          return "14px";
        }
        return "12px";
      })
      .style("font-weight", (d, i) => {
        if (self._hoverKey === self._dkeys.indexOf(d)) {
          return "bold";
        }
        return "normal";
      })
      .attr("transform", "translate(-10,5)rotate(-55)")
      .style("text-anchor", "end")
      .each(wrap)
      .on("mouseover", (event, d) => {
        const idx = self._dkeys.indexOf(d);
        const mets = self._dentries[idx][1];

        self._hoverKey = idx;
        tip
          .style("opacity", 1)
          .html(
            `<span>${d}</span><br/><span>median: ${mets?.median.toFixed(
              2
            )}</span><br/><span>mean: ${mets?.mean.toFixed(
              2
            )}</span><br/><span>min: ${mets?.min.toFixed(2)}</span>
              <br/><span>max: ${mets?.max.toFixed(2)}</span>`
          )
          // .style("left", 100 + "px")
          // .style("top", y(d.key) + "px");
          .style("left", event.clientX + "px")
          .style("top", event.clientY + "px");
      })
      .on("mouseout", function (event, d) {
        self._hoverKey = null;
        tip.style("opacity", 0);
      })
      .on("click", function (e, d) {
        const idx = self._dkeys.indexOf(d);
        const mets = self._dentries[idx];
        if (mets !== null && mets !== undefined && "onClick" in self.state) {
          self.state.onClick(mets);
        }
      });

    let xminmax;
    if ("xminmax" in this.state) {
      xminmax = this.state.xminmax;
    } else {
      xminmax = d3__namespace.extent(this._dentries.map((x) => Math.max(...x[1].values)));
    }

    var x = d3__namespace.scaleLinear().domain([0, xminmax[1]]).range([0, width]).nice();

    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3__namespace.axisBottom(x));

    // OPTION 1: Compute kernel density estimation for each column:
    // let kde = kernelDensityEstimator(kernelEpanechnikov(1.25), y.ticks(40));
    // let allCurves = [],
    //   allMax = 0;
    // for (let i = 0; i < n; i++) {
    //   let key = categories[i];
    //   console.log(data[key]);
    //   let density = kde(data[key].values);
    //   let dMax = Math.max(...density.map((x) => x[1]));
    //   if (dMax > allMax) {
    //     allMax = dMax;
    //   }
    //   allCurves.push({ key: key, dist: density });
    // }

    // OPTION 2
    // Features of the histogram
    var histogram = d3__namespace
      .bin()
      .domain(x.domain())
      .thresholds(x.ticks(20))
      .value((d) => d);

    let sumstat = [];
    for (let i = 0; i < this._dentries.length; i++) {
      const d = this._dentries[i];
      sumstat.push({ key: d[0], value: histogram(d[1].values) });
    }

    // Color scale for median values
    var colorScale = "#5b9cd2";
    if ("gradient" in this.state && this.state.gradient === true) {
      colorScale = d3__namespace
        .scaleSequential()
        .interpolator(d3__namespace.interpolateInferno)
        .domain([0, xminmax[1]]);
    }

    function getColor(d) {
      if (typeof colorScale === "string" || colorScale instanceof String) {
        return colorScale;
      } else {
        return colorScale(self.data[d][self.state.metric]);
      }
    }

    // draw the curve
    svg
      .selectAll("kernelRidges")
      .data(sumstat)
      .enter()
      .append("g")
      .attr("transform", function (d) {
        return "translate(" + "0, " + y(d.key) + ")";
      })
      .append("path")
      .attr("fill", function (d, i) {
        return getColor(d.key);
      })
      // .attr("fill", function(d) {
      //   console.log(d);
      //   console.log(data[d.key])
      //   return colorScale(data[d.key].median)
      // })
      .attr("stroke", "none")
      .style("opacity", 1)
      .attr("d", function (bin, i) {
        // per bin x curve
        let lengths = d3__namespace.max(
          bin.value.map(function (a) {
            return a.length;
          })
        );

        let yCurves = d3__namespace
          .scaleLinear()
          .range([0, y.bandwidth() * 1.4])
          .domain([lengths, -lengths]);

        return d3__namespace
          .area()
          .y0(yCurves(0))
          .y1(function (d) {
            return yCurves(d.length);
          })
          .x(function (d) {
            return x(d.x0);
          })
          .curve(d3__namespace.curveCatmullRom)(bin.value);
      })
      .on("mouseover", function (event, d) {
        const idx = self._dkeys.indexOf(d.key);
        const mets = self._dentries[idx][1];

        self._hoverKey = idx;

        tip
          .style("opacity", 1)
          .html(
            `<span>${d.key}</span><br/><span>median: ${mets?.median.toFixed(
              2
            )}</span><br/><span>mean: ${mets?.mean.toFixed(
              2
            )}</span><br/><span>min: ${mets?.min.toFixed(2)}</span>
              <br/><span>max: ${mets?.max.toFixed(2)}</span>`
          )
          // .style("left", 100 + "px")
          // .style("top", y(d.key) + "px");
          .style("left", event.clientX + "px")
          .style("top", event.clientY + "px");
      })
      .on("mouseout", function (event, d) {
        self._hoverKey = null;
        tip.style("opacity", 0);
      })
      .on("click", function (e, d) {
        const idx = self._dkeys.indexOf(d.key);
        const mets = self._dentries[idx][1];
        if (mets !== null && mets !== undefined && "onClick" in self.state) {
          self.state.onClick(mets);
        }
      });

    let bars = svg.selectAll("bars").data(this._dentries);

    const bar_width_ratio = 0.7;

    bars
      .enter()
      .append("line")
      .attr("y1", (d) => {
        return y(d[0]) + y.bandwidth() * bar_width_ratio;
      })
      .attr("y2", (d) => {
        return y(d[0]) + y.bandwidth() * bar_width_ratio;
      })
      .attr("x1", (d) => {
        return x(d[1]?.min);
      })
      .attr("x2", (d) => {
        return x(d[1]?.max);
      })
      .attr("stroke", "#353535")
      .style("stroke-opacity", 0.7);

    var tip = d3__namespace
      .select(this.elem)
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute");

    bars
      .enter()
      .append("rect")
      .attr("y", (d) => {
        return y(d[0]) + y.bandwidth() * bar_width_ratio;
      })
      .attr("x", (d) => {
        return x(d[1]?.quantiles[0]);
      })
      .attr("height", y.bandwidth() * (1 - bar_width_ratio))
      .attr("width", (d) => {
        return x(d[1]?.quantiles[2]) - x(d[1]?.quantiles[0]);
      })
      .attr("fill", function (d, i) {
        return getColor(d[0]);
      })
      .style("opacity", 0.5)
      .on("mouseover", (event, d) => {
        const idx = self._dkeys.indexOf(d[0]);
        const mets = self._dentries[idx][1];

        self._hoverKey = idx;

        tip
          .style("opacity", 1)
          .html(
            `<span>${d[0]}</span><br/><span>median: ${mets?.median.toFixed(
              2
            )}</span><br/><span>mean: ${mets?.mean.toFixed(2)}</span>
              <br/><span>min: ${mets?.min.toFixed(2)}</span>
              <br/><span>max: ${mets?.max.toFixed(2)}</span>`
          )
          // .style("left", 100 + "px")
          // .style("top", y(d.key) + "px");
          .style("left", event.clientX + "px")
          .style("top", event.clientY + "px");
      })
      .on("mouseout", function (event, d) {
        self._hoverKey = null;
        tip.style("opacity", 0);
      })
      .on("click", function (e, d) {
        const idx = self._dkeys.indexOf(d[0]);
        const mets = self._dentries[idx][1];
        if (mets !== null && mets !== undefined && "onClick" in self.state) {
          self.state.onClick(mets);
        }
      });

    // min
    bars
      .enter()
      .append("line")
      .attr("y1", (d) => {
        return y(d[0]) + y.bandwidth() * bar_width_ratio;
      })
      .attr("y2", (d) => {
        return y(d[0]) + y.bandwidth();
      })
      .attr("x1", (d) => {
        return x(d[1]?.min);
      })
      .attr("x2", (d) => {
        return x(d[1]?.min);
      })
      .attr("stroke", "#353535")
      .attr("stroke-width", 1);

    // max
    bars
      .enter()
      .append("line")
      .attr("y1", (d) => {
        return y(d[0]) + y.bandwidth() * bar_width_ratio;
      })
      .attr("y2", (d) => {
        return y(d[0]) + y.bandwidth();
      })
      .attr("x1", (d) => {
        return x(d[1]?.max);
      })
      .attr("x2", (d) => {
        return x(d[1]?.max);
      })
      .attr("stroke", "#353535")
      .attr("stroke-width", 1);

    // mean > MEDIAN
    bars
      .enter()
      .append("line")
      .attr("y1", (d) => {
        return y(d[0]) + y.bandwidth() * bar_width_ratio;
      })
      .attr("y2", (d) => {
        return y(d[0]) + y.bandwidth();
      })
      .attr("x1", (d) => {
        return x(d[1]?.median);
      })
      .attr("x2", (d) => {
        return x(d[1]?.median);
      })
      .attr("stroke", "#353535")
      .attr("stroke-width", 1);
  }
}

exports.HorizontalRidgePlot = HorizontalRidgePlot;
exports.VerticalRidgePlot = VerticalRidgePlot;
