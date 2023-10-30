import * as d3 from "d3";
import { RidgePlot } from "./RidgePlot.js";

/**
 * Make a horizontal ridgeline plot
 *
 * @class HorizontalRidgePlot
 * @extends {RidgePlot}
 */
export class HorizontalRidgePlot extends RidgePlot {
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

    const svg = d3
      .select(this.elem)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    var y = d3.scaleBand().range([0, height]).domain(this._dkeys).padding(0.2);

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

    let yAxis = svg.append("g").call(d3.axisLeft(y));

    var wrap = function () {
      var self = d3.select(this),
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
        if (mets === null && "onClick" in self.state) {
          self.state.onClick(mets);
        }
      });

    let xminmax;
    if ("xminmax" in this.state) {
      xminmax = this.state.xminmax;
    } else {
      xminmax = d3.extent(this._dentries.map((x) => Math.max(...x[1].values)));
    }

    var x = d3.scaleLinear().domain([0, xminmax[1]]).range([0, width]).nice();

    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

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
    var histogram = d3
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
      colorScale = d3
        .scaleSequential()
        .interpolator(d3.interpolateInferno)
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
        let lengths = d3.max(
          bin.value.map(function (a) {
            return a.length;
          })
        );

        let yCurves = d3
          .scaleLinear()
          .range([0, y.bandwidth() * 1.4])
          .domain([lengths, -lengths]);

        return d3
          .area()
          .y0(yCurves(0))
          .y1(function (d) {
            return yCurves(d.length);
          })
          .x(function (d) {
            return x(d.x0);
          })
          .curve(d3.curveCatmullRom)(bin.value);
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

    var tip = d3
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
