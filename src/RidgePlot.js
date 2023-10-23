/**
 * Base class for ridge plots.
 * This class is not to be used directly.
 *
 * @class RidgePlot
 */
export class RidgePlot {
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
